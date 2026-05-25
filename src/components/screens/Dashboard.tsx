"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { generatePersonalizedTrainingPlan, type GeneratePersonalizedTrainingPlanOutput } from '@/ai/flows/generate-personalized-training-plan';
import { Utensils, Play, ChevronRight, Clock, Moon, Flame, Camera, RefreshCcw, AlertCircle, GraduationCap, Calendar, MapPin, CheckCircle2, XCircle, Zap, Bell, BellOff, Check, X, Apple, Shuffle, Loader2, Plus, Share2, Trophy, Copy, Swords, Target, Bandage, Thermometer, Lock } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { getRank, getRankProgress, getNextRank } from '@/lib/rank';
import { scheduleDayNotifications, requestNotificationPermission, isNotificationPermitted, clearScheduledNotifications, registerServiceWorker, notifyPlanReady } from '@/lib/notification-service';
import { touchStreak } from '@/lib/streak';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDocViaRest } from '@/firebase/firestore/rest-fetch';
import { setDocViaRest } from '@/firebase/firestore/rest-write';
import { cn } from '@/lib/utils';
import type { UserProfile, ScreenState, DailyStats } from '../GamedayFlow';
import { loadFSCData, parseMatchDate, formatKickoff, parseTeamName, getSavedTeam, fixturesForTeam, type FSCFixture, type FSCData } from '@/lib/fsc-data';
import { getSportConfig } from '@/lib/sports-config';
import { aiLimit, incrementAI, FREE_LIMITS, type AIFeature } from '@/lib/ai-limits';

type Snack = { name: string; benefit: string; steps: string[]; kcal: number; protein: number; carbs: number; fats: number };

const RIVALS = [
  { name: 'Jordan T.', gender: 'women' },
  { name: 'Mateo R.',  gender: 'men'   },
  { name: 'Alex K.',   gender: 'women' },
  { name: 'Luca M.',   gender: 'men'   },
  { name: 'Sam P.',    gender: 'men'   },
  { name: 'Jake H.',   gender: 'men'   },
  { name: 'Ethan W.',  gender: 'men'   },
  { name: 'Noah B.',   gender: 'men'   },
  { name: 'Riley S.',  gender: 'women' },
  { name: 'Dylan C.',  gender: 'men'   },
  { name: 'Kai F.',    gender: 'men'   },
  { name: 'Tyler M.',  gender: 'men'   },
  { name: 'Mason J.',  gender: 'men'   },
  { name: 'Logan A.',  gender: 'women' },
  { name: 'Connor R.', gender: 'men'   },
  { name: 'Zac D.',    gender: 'men'   },
  { name: 'Finn H.',   gender: 'men'   },
  { name: 'Harry B.',  gender: 'men'   },
  { name: 'Oliver K.', gender: 'men'   },
  { name: 'James T.',  gender: 'men'   },
];

function formatTo12h(time24: string) {
  if (!time24) return "";
  const cleanTime = time24.split(' ')[0];
  const parts = cleanTime.split(':');
  if (parts.length < 2) return time24;
  let hour = parseInt(parts[0]);
  const min = parts[1].substring(0, 2);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${min} ${ampm}`;
}

type NextGame = FSCFixture & { isHome: boolean; opponentName: string; opponentLogo: string };

function findNextGame(data: FSCData, clubName: string, gradeKey?: string): NextGame | null {
  const now = new Date();
  const q = clubName.toLowerCase();
  const pool = gradeKey
    ? fixturesForTeam(data.fixtures, clubName, gradeKey, data.clubs)
    : data.fixtures.filter(f =>
        (f.homeTeam.name ?? '').toLowerCase().includes(q) ||
        (f.awayTeam.name ?? '').toLowerCase().includes(q)
      );
  const upcoming = pool
    .filter(f => {
      const d = parseMatchDate(f.matchDate);
      const msSinceKickoff = now.getTime() - d.getTime();
      // Show today's game for up to 2.5 hours after kickoff (covers full match + extra time).
      // After that it drops off and the next fixture shows automatically.
      if (msSinceKickoff > 0 && msSinceKickoff <= 2.5 * 60 * 60 * 1000) return true;
      return d >= now;
    })
    .sort((a, b) => a.matchDate.localeCompare(b.matchDate));
  if (!upcoming[0]) return null;
  const f = upcoming[0];
  const isHome = (f.homeTeam.name ?? '').toLowerCase().includes(q);
  return {
    ...f,
    isHome,
    opponentName: isHome ? (f.awayTeam.name ?? 'TBC') : (f.homeTeam.name ?? 'TBC'),
    opponentLogo: isHome ? f.awayTeam.logo : f.homeTeam.logo,
  };
}

function daysUntilDate(isoString: string) {
  const local = parseMatchDate(isoString);
  const now = new Date();
  const diff = local.getTime() - now.getTime();
  if (diff <= 0) return { label: 'Today', sub: 'game day' };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days === 0) return { label: `${hours}h`, sub: 'until kickoff' };
  if (days === 1) return { label: 'Tomorrow', sub: '' };
  return { label: `${days}`, sub: 'days to go' };
}

export default function Dashboard({
  profile,
  onActivityClick,
  onNavClick,
  onComplete,
  onSkip,
  onLogMeal,
}: {
  profile: UserProfile,
  onActivityClick: (item: any) => void,
  onNavClick: (screen: ScreenState) => void,
  onComplete: (activityId: string, type: string) => void,
  onSkip: (activityId: string) => void,
  onLogMeal?: (stats: DailyStats, name: string) => void,
}) {
  const db = useFirestore();
  const [myClub, setMyClub] = useState<{ id: string; name: string; logo: string } | null>(null);
  const [nextGame, setNextGame] = useState<NextGame | null>(null);

  useEffect(() => {
    async function loadGameCard() {
      try {
        // 1. Try FSC (Australian soccer grade-level data)
        const team = getSavedTeam();
        if (team) {
          setMyClub({ id: team.clubId, name: team.clubName, logo: team.clubLogo });
          const data = await loadFSCData();
          setNextGame(findNextGame(data, team.clubName, team.gradeKey));
          return;
        }
        const rawClub = localStorage.getItem('gameday_my_club');
        if (rawClub) {
          const club = JSON.parse(rawClub);
          setMyClub(club);
          const data = await loadFSCData();
          setNextGame(findNextGame(data, club.name));
          return;
        }
      } catch {}

      // 2. Fall back to TheSportsDB team (non-soccer / other sports)
      try {
        const raw = localStorage.getItem('gameday_sportsdb_team');
        if (!raw) throw new Error('no sportsdb team');
        const sdbTeam: { idTeam: string; strTeam: string; strBadge: string } = JSON.parse(raw);
        setMyClub({ id: sdbTeam.idTeam, name: sdbTeam.strTeam, logo: sdbTeam.strBadge });
        const res = await fetch(`/api/team-fixtures?id=${sdbTeam.idTeam}`);
        if (!res.ok) throw new Error('sportsdb fetch failed');
        const { fixtures } = await res.json();
        if (!fixtures?.length) throw new Error('no fixtures');
        const now = new Date();
        const upcoming = fixtures
          .filter((f: any) => {
            const d = new Date(f.matchDate);
            const msSince = now.getTime() - d.getTime();
            if (msSince > 0 && msSince <= 2.5 * 60 * 60 * 1000) return true;
            return d >= now;
          })
          .sort((a: any, b: any) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
        if (upcoming[0]) {
          const f = upcoming[0];
          setNextGame({ ...f, matchDate: f.matchDate });
          return;
        }
      } catch {}

      // 3. Fall back to manually-scanned fixtures
      try {
        const rawManual = localStorage.getItem(`gameday_manual_fixtures_${profile.uid}`);
        if (!rawManual) return;
        const manual: Array<{ id: string; date: string; time: string | null; opponent: string; venue: string | null; isHome: boolean | null }> = JSON.parse(rawManual);
        const now = new Date();
        const upcoming = manual
          .map(f => ({
            ...f,
            matchDate: f.date + (f.time ? `T${f.time}:00` : 'T09:00:00'),
          }))
          .filter(f => {
            const d = new Date(f.matchDate);
            const msSince = now.getTime() - d.getTime();
            if (msSince > 0 && msSince <= 2.5 * 60 * 60 * 1000) return true;
            return d >= now;
          })
          .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
        if (upcoming[0]) {
          const f = upcoming[0];
          setNextGame({
            matchDate: f.matchDate,
            homeTeam: { name: f.isHome ? profile.sport + ' Team' : f.opponent, logo: '' },
            awayTeam: { name: f.isHome ? f.opponent : profile.sport + ' Team', logo: '' },
            homeScore: null, awayScore: null,
            status: '', league: '',
            isHome: f.isHome ?? true,
            opponentName: f.opponent,
            opponentLogo: '',
            venue: f.venue || '',
            source: 'manual',
          } as any);
        }
      } catch {}
    }
    loadGameCard();
  }, [profile.uid]);
  const planCacheKey = `gameday_plan_${profile.uid}_${new Date().toISOString().split('T')[0]}`;
  const [plan, setPlan] = useState<GeneratePersonalizedTrainingPlanOutput | null>(() => {
    try {
      const s = localStorage.getItem(`gameday_plan_${profile.uid}_${new Date().toISOString().split('T')[0]}`);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(() => {
    try {
      const s = localStorage.getItem(`gameday_plan_${profile.uid}_${new Date().toISOString().split('T')[0]}`);
      return !s;
    } catch { return true; }
  });
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState("");
  const avatar = PlaceHolderImages.find(img => img.id === 'user-avatar');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const hh = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hh}:${mm}`);
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPlan = useCallback(async (forceRefresh = false) => {
    if (!db || !profile.uid) return;

    // If already cached for today, do nothing — state was initialised from localStorage
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(planCacheKey);
        if (cached) { setPlan(JSON.parse(cached)); setLoading(false); return; }
      } catch {}
    }

    setLoading(true);
    setError(null);

    const todayStr = new Date().toISOString().split('T')[0];
    const planRef = doc(db, 'users', profile.uid, 'plans', todayStr);

    try {
      if (!forceRefresh) {
        // Try SDK first, fall back to REST if the SDK is offline
        let existingPlan: GeneratePersonalizedTrainingPlanOutput | null = null;
        try {
          const snap = await getDoc(planRef);
          if (snap.exists()) existingPlan = snap.data() as GeneratePersonalizedTrainingPlanOutput;
        } catch {
          existingPlan = await getDocViaRest<GeneratePersonalizedTrainingPlanOutput>(planRef).catch(() => null);
        }
        if (existingPlan) {
          try { localStorage.setItem(planCacheKey, JSON.stringify(existingPlan)); } catch {}
          setPlan(existingPlan);
          setLoading(false);
          return;
        }
      }

      const todayDayOfWeek = new Date().toLocaleDateString('en-AU', { weekday: 'short', timeZone: 'Australia/Sydney' });
      const isWeekend = todayDayOfWeek === 'Sat' || todayDayOfWeek === 'Sun';

      // Detect game day using the same path as the fixtures UI (getSavedTeam + loadFSCData)
      let isGameDay = false;
      try {
        const fscData = await loadFSCData();
        const savedTeam = getSavedTeam();
        const todayStr = new Date().toDateString();
        let pool: FSCFixture[] = [];
        if (savedTeam) {
          pool = fixturesForTeam(fscData.fixtures, savedTeam.clubName, savedTeam.gradeKey, fscData.clubs);
        } else {
          try {
            const q = (JSON.parse(localStorage.getItem('gameday_my_club') || '{}').name || '').toLowerCase();
            if (q) pool = fscData.fixtures.filter(f =>
              (f.homeTeam.name ?? '').toLowerCase().includes(q) ||
              (f.awayTeam.name ?? '').toLowerCase().includes(q)
            );
          } catch {}
        }
        isGameDay = pool.some(f => parseMatchDate(f.matchDate).toDateString() === todayStr);
      } catch {}

      const result = await generatePersonalizedTrainingPlan({
        sport: profile.sport,
        position: profile.position,
        bestAbilities: profile.bestAbilities,
        areaToImprove: profile.areaToImprove,
        schoolStartTime: profile.schoolStartTime || "08:00",
        schoolEndTime: profile.schoolEndTime || "15:00",
        height: profile.height,
        weight: profile.weight,
        age: profile.age,
        recentFeedback: profile.lastFeedback,
        trainingDays: profile.trainingDays,
        trainingTime: profile.trainingTime,
        todayDayOfWeek,
        isWeekend,
        isGameDay,
        sportContext: getSportConfig(profile.sport).aiContext,
        isInjured: profile.trainingStatus === 'injured',
        isSick: profile.trainingStatus === 'sick',
      });

      const planData = { ...result, uid: profile.uid, date: todayStr, createdAt: new Date().toISOString() };
      setDocViaRest(planRef, planData).catch(() => setDoc(planRef, planData).catch(() => {}));

      try { localStorage.setItem(planCacheKey, JSON.stringify(result)); } catch {}
      setPlan(result);
      if (!forceRefresh) notifyPlanReady(profile.sport);
    } catch (err) {
      console.error("Fetch plan failed:", err);
      setError("Sync failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [profile, db]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const [notifEnabled, setNotifEnabled] = useState(false);
  useEffect(() => { setNotifEnabled(isNotificationPermitted()); }, []);

  // Streak
  const [streak, setStreak] = useState(0);
  useEffect(() => {
    const s = touchStreak(profile.uid);
    setStreak(s.count);
    registerServiceWorker();
  }, [profile.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!plan || !notifEnabled) return;
    scheduleDayNotifications(plan.schedule, profile.schoolStartTime, profile.schoolEndTime);
    return () => clearScheduledNotifications();
  }, [plan, notifEnabled, profile.schoolStartTime, profile.schoolEndTime]);

  const sortedSchedule = useMemo(() => {
    if (!plan) return [];

    // Guarantee no school blocks on weekends regardless of what the AI/cache returned
    const dayOfWeek = new Date().toLocaleDateString('en-AU', { weekday: 'short', timeZone: 'Australia/Sydney' });
    const isWeekend = dayOfWeek === 'Sat' || dayOfWeek === 'Sun';
    const schedule = isWeekend ? plan.schedule.filter(it => it.type !== 'school') : plan.schedule;

    const withMeta = schedule.map((it) => ({
      ...it,
      isCompleted: profile.completedActivities?.includes(it.activity),
      isSkipped: profile.skippedActivities?.includes(it.activity),
      isPast: currentTime > it.time,
    }));

    let activeIdx = -1;
    const sortedByTime = [...withMeta].sort((a, b) => a.time.localeCompare(b.time));
    for (let i = 0; i < sortedByTime.length; i++) {
      if (currentTime >= sortedByTime[i].time) {
        activeIdx = i;
      }
    }

    return sortedByTime.map((it, i) => ({
      ...it,
      isCurrent: i === activeIdx
    })).sort((a, b) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      return 0;
    });
  }, [plan, currentTime, profile.completedActivities]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'training': return <Play size={10} className="fill-current" />;
      case 'nutrition': return <Utensils size={10} />;
      case 'recovery': return <Flame size={10} />;
      case 'sleep': return <Moon size={10} />;
      case 'school': return <GraduationCap size={10} />;
      default: return <Clock size={10} />;
    }
  };

  const [activeSnack, setActiveSnack] = useState<Snack | null>(null);
  const [snackLoading, setSnackLoading] = useState(false);
  const [snackLogged, setSnackLogged] = useState(false);
  useEffect(() => { setSnackLogged(false); }, [activeSnack?.name]);

  const fetchSnack = async () => {
    if (activeSnack) { setActiveSnack(null); return; }
    const lim = aiLimit('snack', !!profile.hasAccess);
    if (!lim.allowed) { setUpgradeFeature('snack'); setShowUpgradeSheet(true); return; }
    setSnackLoading(true);
    incrementAI('snack');
    try {
      const res = await fetch('/api/snack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport: profile.sport,
          position: profile.position,
          weight: profile.weight,
          caloriesLogged: profile.dailyStats?.calories ?? 0,
        }),
      });
      const data = await res.json();
      if (!data.error) setActiveSnack(data);
    } catch {}
    finally { setSnackLoading(false); }
  };

  const rank = getRank(profile.xp ?? 0);
  const nextRank = getNextRank(profile.xp ?? 0);
  const rankProgress = getRankProgress(profile.xp ?? 0);

  const [showShareSheet, setShowShareSheet] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<AIFeature | null>(null);

  // Rival — persisted in localStorage so users can actually beat them
  const [rivalState, setRivalState] = useState<{ idx: number; targetXP: number } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`gameday_rival_state_${profile.uid}`);
      if (stored) { setRivalState(JSON.parse(stored)); return; }
      // First time: place rival 0 just ahead of current XP
      const seed = profile.uid.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0);
      const gap = (Math.abs(seed >> 4) % 250) + 75;
      const init = { idx: 0, targetXP: (profile.xp ?? 0) + gap };
      localStorage.setItem(`gameday_rival_state_${profile.uid}`, JSON.stringify(init));
      setRivalState(init);
    } catch {}
  }, [profile.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const advanceRival = useCallback(() => {
    if (!rivalState) return;
    const newIdx = (rivalState.idx + 1) % RIVALS.length;
    const seed2 = newIdx * 97 + 13;
    const gap = (seed2 % 350) + 150;
    const next = { idx: newIdx, targetXP: (profile.xp ?? 0) + gap };
    localStorage.setItem(`gameday_rival_state_${profile.uid}`, JSON.stringify(next));
    setRivalState(next);
  }, [rivalState, profile.uid, profile.xp]);

  // Daily challenge — 1 per day, rotates from a curated list
  const CHALLENGES = [
    { id: 'c1',  title: '100 Reps',           desc: 'Any exercise — push-ups, squats, jumps. Break it up however you want.', xp: 150, cat: 'Physical'  },
    { id: 'c2',  title: 'Cold Shower',        desc: 'End your shower with 60 seconds of cold water. Build mental toughness.', xp: 100, cat: 'Mindset'  },
    { id: 'c3',  title: 'Sprint Series',       desc: '5 all-out 30m sprints with 90s rest between. Max effort every rep.',     xp: 150, cat: 'Physical'  },
    { id: 'c4',  title: 'Visualisation',       desc: '10 mins eyes closed — see every move in your next game in detail.',      xp: 100, cat: 'Mindset'  },
    { id: 'c5',  title: 'No Junk Day',         desc: 'Zero processed food or soda today. Whole foods only.',                   xp: 150, cat: 'Nutrition' },
    { id: 'c6',  title: 'Hydration Protocol',  desc: 'Drink 3 litres of water today. Set reminders every 2 hours.',           xp: 75,  cat: 'Nutrition' },
    { id: 'c7',  title: 'Full Stretch',        desc: '15 mins full-body — hips, hammies, shoulders, calves.',                  xp: 75,  cat: 'Recovery'  },
    { id: 'c8',  title: 'Watch Film',          desc: 'Watch 20 mins of a pro who plays your position. Take 3 notes.',          xp: 100, cat: 'Mindset'  },
    { id: 'c9',  title: 'Lights Out by 10PM',  desc: 'In bed with eyes closed by 10PM. Sleep is the #1 performance drug.',    xp: 100, cat: 'Recovery'  },
    { id: 'c10', title: 'Extra 15 Minutes',    desc: 'Add 15 mins of focused skill work — dribbling, shooting, footwork.',    xp: 100, cat: 'Physical'  },
    { id: 'c11', title: 'Protein Target',      desc: 'Hit your daily protein goal. Track every meal, within 10g of target.',  xp: 100, cat: 'Nutrition' },
    { id: 'c12', title: 'Journaling',          desc: '5 mins: what went well, what to fix, tomorrow\'s #1 goal.',              xp: 75,  cat: 'Mindset'  },
    { id: 'c13', title: 'Foam Roll Session',   desc: '10 mins — quads, IT band, calves, upper back. Hold 45s each spot.',     xp: 75,  cat: 'Recovery'  },
    { id: 'c14', title: 'Jump Training',        desc: '3 sets × 10 max-height jumps. Triple extension — ankles, knees, hips.', xp: 100, cat: 'Physical'  },
  ];
  const todayChallengeIdx = useMemo(() => {
    const d = new Date();
    const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
    return dayOfYear % CHALLENGES.length;
  }, []);
  const todayChallenge = CHALLENGES[todayChallengeIdx];
  const challengeKey = `gameday_challenge_done_${profile.uid}_${new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' })}`;
  const [challengeDone, setChallengeDone] = useState(() => {
    try { return !!localStorage.getItem(challengeKey); } catch { return false; }
  });
  const acceptChallenge = () => {
    try { localStorage.setItem(challengeKey, '1'); } catch {}
    setChallengeDone(true);
  };

  const rival = useMemo(() => {
    if (!rivalState) return null;
    const { name, gender } = RIVALS[rivalState.idx % RIVALS.length];
    const portraitNum = (rivalState.idx * 7 + 13) % 99 + 1;
    return {
      name,
      avatar: `https://randomuser.me/api/portraits/${gender}/${portraitNum}.jpg`,
      targetXP: rivalState.targetXP,
    };
  }, [rivalState]);

  const rivalRank = rival ? getRank(rival.targetXP) : getRank(0);
  const xpGap = rival ? Math.max(0, rival.targetXP - (profile.xp ?? 0)) : 0;
  const rivalBeaten = !!rival && (profile.xp ?? 0) >= rival.targetXP;

  // Opposition scout
  const [scoutData, setScoutData] = useState<{ threats: string; exploit: string; tip: string } | null>(null);
  const [scoutLoading, setScoutLoading] = useState(false);
  const [scoutOpen, setScoutOpen] = useState(false);

  const fetchScout = async (opponentName: string, competition?: string) => {
    if (scoutData) { setScoutOpen(o => !o); return; }
    const lim = aiLimit('scout', !!profile.hasAccess);
    if (!lim.allowed) { setUpgradeFeature('scout'); setShowUpgradeSheet(true); return; }
    setScoutLoading(true);
    setScoutOpen(true);
    incrementAI('scout');
    try {
      const res = await fetch('/api/scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opponentName, competition, sport: profile.sport, position: profile.position }),
      });
      const data = await res.json();
      if (!data.error) setScoutData(data);
    } catch {}
    finally { setScoutLoading(false); }
  };

  const SPORT_EMOJI: Record<string, string> = {
    Soccer: '⚽', Basketball: '🏀', AFL: '🏉', 'Rugby League': '🏉',
    'Rugby Union': '🏉', Netball: '🏐', Cricket: '🏏', Tennis: '🎾',
    Swimming: '🏊', Athletics: '🏃', 'American Football': '🏈',
  };
  const sportEmoji = SPORT_EMOJI[profile.sport] ?? '⚡';

  const shareText = `${sportEmoji} ${rank.name} · ${profile.xp ?? 0} XP\nTraining as ${profile.position} (${profile.sport}) with Gameday — the AI performance coach for athletes.`;

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Gameday', text: shareText }); } catch {}
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden animate-in fade-in duration-700">
      <div className="px-6 pt-12 pb-4 shrink-0">
        <div className="flex justify-between items-start">
          <div className="space-y-1.5">
            <h3 className="text-xl font-headline font-bold uppercase tracking-tight">Daily Schedule</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full", rank.bg, rank.color)}>
                {rank.name}
              </span>
              <span className="text-[8px] text-white/20 font-bold uppercase tracking-widest">{profile.xp ?? 0} XP</span>
              {streak > 0 && (
                <span className="text-[8px] font-black uppercase tracking-widest text-orange-400">🔥 {streak}d</span>
              )}
              {nextRank && (
                <span className="text-[8px] text-white/15 font-bold">→ {nextRank.name} at {nextRank.minXP}</span>
              )}
              {profile.trainingStatus === 'injured' && (
                <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                  <Bandage size={8} /> Injury Mode
                </span>
              )}
              {profile.trainingStatus === 'sick' && (
                <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
                  <Thermometer size={8} /> Sick Day
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShareSheet(true)}
              title="Share your rank"
              className="p-2 rounded-full text-white/20 hover:text-white transition-colors"
            >
              <Share2 size={16} />
            </button>
            <button
              onClick={async () => {
                const granted = await requestNotificationPermission();
                setNotifEnabled(granted);
              }}
              title={notifEnabled ? 'Notifications on' : 'Enable notifications'}
              className="p-2 rounded-full text-white/20 hover:text-white transition-colors"
            >
              {notifEnabled ? <Bell size={16} className="text-primary" /> : <BellOff size={16} />}
            </button>
            <button onClick={() => onNavClick('settings')} className="relative group">
              <Avatar className="h-10 w-10 border border-white/10 grayscale hover:grayscale-0 transition-all cursor-pointer">
                <AvatarImage src={avatar?.imageUrl} />
                <AvatarFallback>PRO</AvatarFallback>
              </Avatar>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-32">
        {/* Daily focus */}
        <div className="flex items-center justify-between px-1">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Today's Focus</p>
            <h2 className="text-xl font-headline font-black uppercase tracking-tight leading-none mt-0.5">
              {loading ? "Loading..." : plan?.dailyFocusTitle || "Awaiting Protocol"}
            </h2>
          </div>
          <Button
            onClick={() => {
              const lim = aiLimit('plan-refresh', !!profile.hasAccess);
              if (!lim.allowed) { setUpgradeFeature('plan-refresh'); setShowUpgradeSheet(true); return; }
              incrementAI('plan-refresh');
              fetchPlan(true);
            }}
            variant="ghost" size="icon" className="h-8 w-8 text-white/20 hover:text-white shrink-0"
          >
            <RefreshCcw size={14} className={cn(loading && "animate-spin")} />
          </Button>
        </div>

        {/* Rival card */}
        {rival && (
          <div className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-2xl border transition-all",
            rivalBeaten
              ? "bg-emerald-500/5 border-emerald-500/20"
              : "bg-white/3 border-white/6"
          )}>
            <img
              src={rival.avatar}
              alt={rival.name}
              className="h-8 w-8 rounded-lg object-cover shrink-0 bg-white/5"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/25">Your Rival</p>
              <p className="text-[12px] font-black text-white leading-tight">
                {rival.name}
                <span className={cn("ml-2 text-[9px] font-bold", rivalRank.color)}>{rivalRank.name}</span>
              </p>
            </div>
            <div className="text-right shrink-0">
              {rivalBeaten ? (
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Beaten! 🏆</span>
                  <button
                    onClick={advanceRival}
                    className="text-[8px] font-black uppercase tracking-widest text-white/35 hover:text-white/70 transition-colors"
                  >
                    Next Rival →
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-[8px] font-black uppercase tracking-widest text-red-400">{xpGap} XP ahead</p>
                  <p className="text-[8px] text-white/20 font-bold">{rival.targetXP} total</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Daily Challenge */}
        <div className={cn(
          "px-4 py-4 rounded-2xl border transition-all",
          challengeDone ? "bg-emerald-500/5 border-emerald-500/20" : "bg-white/3 border-white/6"
        )}>
          <div className="flex items-start gap-3">
            <div className={cn(
              "h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
              challengeDone ? "bg-emerald-500/15" : "bg-primary/10"
            )}>
              {challengeDone ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Zap size={16} className="text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/25 mb-0.5">Daily Challenge</p>
              <p className={cn("text-[12px] font-black uppercase tracking-tight", challengeDone ? "text-emerald-400" : "text-white")}>
                {todayChallenge.title}
              </p>
              <p className="text-[9px] text-white/40 font-medium mt-0.5 leading-snug">{todayChallenge.desc}</p>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-[8px] font-black uppercase tracking-widest text-primary">+{todayChallenge.xp} XP</span>
              {!challengeDone && (
                <button
                  onClick={acceptChallenge}
                  className="mt-1.5 block text-[7px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-primary text-primary-foreground active:scale-95 transition-all"
                >
                  Accept
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Next game */}
        {nextGame && (() => {
          const countdown = daysUntilDate(nextGame.matchDate);
          const local = parseMatchDate(nextGame.matchDate);
          const dateLabel = local.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Australia/Sydney' });
          const kickoff = formatKickoff(local);
          const opponentClub = nextGame.opponentName.includes('  ')
            ? nextGame.opponentName.split('  ')[0].trim()
            : nextGame.opponentName;
          return (
            <div className="space-y-0">
              <button onClick={() => onNavClick('fixtures')} className="w-full rounded-3xl bg-white/5 border border-white/8 p-5 flex items-center gap-4 active:scale-[0.98] transition-all rounded-b-xl">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center shrink-0">
                  <span className="text-lg font-black text-primary leading-none">{countdown.label}</span>
                  {countdown.sub && <span className="text-[7px] font-bold uppercase tracking-wide text-primary/60 leading-none mt-0.5">{countdown.sub}</span>}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Next Game</p>
                  <p className="text-base font-headline font-black uppercase text-white leading-tight truncate">vs {opponentClub}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <div className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-white/30">
                      <Calendar size={8} />{dateLabel}
                    </div>
                    <div className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-white/30">
                      <Clock size={8} />{kickoff}
                    </div>
                    <div className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-white/30">
                      <MapPin size={8} />{nextGame.groundLocation}
                    </div>
                  </div>
                </div>
                <img src={nextGame.opponentLogo} alt="" className="h-10 w-10 rounded-xl object-contain bg-white/5 shrink-0" />
              </button>

              {/* Scout button */}
              {(() => {
                const scoutLim = aiLimit('scout', !!profile.hasAccess);
                return (
                  <button
                    onClick={() => fetchScout(opponentClub, (nextGame as any).leagueTierName)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-b-3xl bg-white/3 border border-t-0 border-white/8 text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-white/60 hover:bg-white/5 transition-all active:scale-[0.99]"
                  >
                    {scoutLoading ? <Loader2 size={10} className="animate-spin" /> : <Target size={10} />}
                    {scoutData ? (scoutOpen ? 'Hide Scout Report' : 'Scout Report') : 'Generate Scout Report'}
                    {!profile.hasAccess && !scoutData && scoutLim.remaining <= 2 && scoutLim.remaining > 0 && (
                      <span className="opacity-40">({scoutLim.remaining} left)</span>
                    )}
                  </button>
                );
              })()}

              {/* Scout report panel */}
              {scoutOpen && (
                <div className="mt-2 rounded-2xl bg-white/4 border border-white/8 p-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
                  {scoutLoading && !scoutData ? (
                    <div className="flex items-center justify-center gap-2 py-3">
                      <Loader2 size={14} className="animate-spin text-white/30" />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">Analysing {opponentClub}...</span>
                    </div>
                  ) : scoutData ? (
                    <>
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/25">Scout Report — vs {opponentClub}</p>
                      <div className="space-y-2.5">
                        <div className="flex gap-2.5">
                          <span className="text-[9px] shrink-0 mt-0.5">⚠️</span>
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-red-400/70 mb-0.5">Watch Out</p>
                            <p className="text-[11px] text-white/60 leading-snug">{scoutData.threats}</p>
                          </div>
                        </div>
                        <div className="flex gap-2.5">
                          <span className="text-[9px] shrink-0 mt-0.5">💡</span>
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-primary/70 mb-0.5">Exploit</p>
                            <p className="text-[11px] text-white/60 leading-snug">{scoutData.exploit}</p>
                          </div>
                        </div>
                        <div className="flex gap-2.5">
                          <span className="text-[9px] shrink-0 mt-0.5">🎯</span>
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-amber-400/70 mb-0.5">Your Edge ({profile.position})</p>
                            <p className="text-[11px] text-white/60 leading-snug">{scoutData.tip}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              )}
            </div>
          );
        })()}

        {/* Game-day upgrade nudge for free users */}
        {!profile.hasAccess && nextGame && (() => {
          const countdown = daysUntilDate(nextGame.matchDate);
          if (countdown.label !== 'Today') return null;
          return (
            <button
              onClick={() => onNavClick('paywall')}
              className="w-full rounded-2xl bg-primary/8 border border-primary/25 p-4 flex items-center gap-3 active:scale-[0.98] transition-all group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
              <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Zap size={16} className="text-primary fill-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-primary/60">Game Day Protocol</p>
                <p className="text-[13px] font-bold text-white leading-tight">Unlock your pre-match nutrition plan</p>
              </div>
              <ChevronRight size={14} className="text-primary/40 group-hover:text-primary transition-colors shrink-0" />
            </button>
          );
        })()}

        {/* No club set prompt */}
        {!nextGame && !myClub && (
          <button onClick={() => onNavClick('fixtures')} className="w-full rounded-3xl bg-white/5 border border-dashed border-white/10 p-5 flex items-center gap-4 active:scale-[0.98] transition-all">
            <div className="h-10 w-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <Calendar size={16} className="text-white/30" />
            </div>
            <div className="text-left">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Set Your Club</p>
              <p className="text-[8px] font-bold uppercase tracking-widest text-white/20">Browse fixtures & select your team</p>
            </div>
            <ChevronRight size={14} className="text-white/20 ml-auto shrink-0" />
          </button>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Timeline</h4>
            <div className="flex items-center gap-3">
              {(() => {
                const snackLim = aiLimit('snack', !!profile.hasAccess);
                return (
                  <button
                    onClick={fetchSnack}
                    disabled={snackLoading}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95",
                      activeSnack
                        ? "bg-amber-400/15 border-amber-400/30 text-amber-300"
                        : "bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
                    )}
                  >
                    {snackLoading ? <Loader2 size={10} className="animate-spin" /> : <Apple size={10} />}
                    Snack
                    {!profile.hasAccess && !activeSnack && snackLim.remaining <= 2 && snackLim.remaining > 0 && (
                      <span className="opacity-40">({snackLim.remaining})</span>
                    )}
                  </button>
                );
              })()}
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">{formatTo12h(currentTime)}</span>
            </div>
          </div>
          
          {/* Snack card */}
          {activeSnack && (
            <div className="bg-amber-400/5 border border-amber-400/15 rounded-2xl p-5 space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-amber-400/70 mb-0.5">Snack Boost</p>
                  <p className="text-base font-black uppercase tracking-tight leading-tight text-white">{activeSnack.name}</p>
                  <p className="text-[9px] text-amber-400/60 font-bold uppercase tracking-widest mt-0.5">{activeSnack.benefit}</p>
                </div>
                <button onClick={() => setActiveSnack(null)} className="p-1.5 rounded-full bg-white/5 text-white/30 hover:text-white transition-colors shrink-0">
                  <X size={12} />
                </button>
              </div>

              <div className="space-y-2">
                {activeSnack.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-amber-400 font-black text-xs shrink-0 mt-0.5 w-4">{i + 1}.</span>
                    <p className="text-[11px] text-white/70 font-medium leading-snug">{step}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-amber-400/10">
                <div className="flex gap-3 text-[8px] font-black uppercase tracking-widest">
                  <span className="text-amber-400">{activeSnack.kcal} kcal</span>
                  <span className="text-white/30">{activeSnack.protein}g P</span>
                  <span className="text-white/30">{activeSnack.carbs}g C</span>
                  <span className="text-white/30">{activeSnack.fats}g F</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (!activeSnack || snackLogged) return;
                      onLogMeal?.({ calories: activeSnack.kcal, protein: activeSnack.protein, carbs: activeSnack.carbs, fats: activeSnack.fats, sugar: 0 }, activeSnack.name);
                      setSnackLogged(true);
                    }}
                    disabled={snackLogged}
                    className={cn(
                      "flex items-center gap-1 text-[8px] font-black uppercase tracking-widest transition-colors",
                      snackLogged ? "text-emerald-400" : "text-amber-400/60 hover:text-amber-400"
                    )}
                  >
                    {snackLogged ? <><CheckCircle2 size={10} /> Logged</> : <><Plus size={10} /> Log It</>}
                  </button>
                  <button
                    onClick={async () => {
                      const lim = aiLimit('snack', !!profile.hasAccess);
                      if (!lim.allowed) { setUpgradeFeature('snack'); setShowUpgradeSheet(true); return; }
                      setSnackLoading(true);
                      incrementAI('snack');
                      try {
                        const res = await fetch('/api/snack', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            sport: profile.sport,
                            position: profile.position,
                            weight: profile.weight,
                            caloriesLogged: profile.dailyStats?.calories ?? 0,
                          }),
                        });
                        const data = await res.json();
                        if (!data.error) setActiveSnack(data);
                      } catch {}
                      finally { setSnackLoading(false); }
                    }}
                    disabled={snackLoading}
                    className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-amber-400/60 hover:text-amber-400 transition-colors disabled:opacity-40"
                  >
                    {snackLoading ? <Loader2 size={10} className="animate-spin" /> : <Shuffle size={10} />}
                    New
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}
            </div>
          ) : error ? (
            <div className="p-10 text-center space-y-4 bg-white/5 rounded-2xl border border-white/5">
              <AlertCircle className="mx-auto text-white/20" size={32} />
              <p className="text-xs text-white/40 font-medium uppercase tracking-widest leading-relaxed">{error}</p>
              <Button onClick={() => fetchPlan(true)} variant="outline" className="h-10 text-[10px] font-bold uppercase border-white/10 hover:bg-white/10">Retry Sync</Button>
            </div>
          ) : (
            <div className="space-y-1">
              {sortedSchedule.map((item, idx) => {
                const isCurrent = item.isCurrent;
                const isPast = item.isPast;
                const isCompleted = item.isCompleted;
                const isSkipped = item.isSkipped;
                const canClick = item.type === 'training' || item.type === 'nutrition';
                const showYesNo = canClick && !isCompleted && !isSkipped && (isCurrent || isPast);
                const showArrow = canClick && !isCompleted && !isSkipped && !isPast && !isCurrent;

                const typeStyle: Record<string, string> = {
                  training: 'bg-primary/15 text-primary',
                  nutrition: 'bg-amber-400/15 text-amber-400',
                  recovery: 'bg-blue-400/15 text-blue-400',
                  sleep: 'bg-purple-400/15 text-purple-400',
                  school: 'bg-white/8 text-white/30',
                };

                const isMissed = isPast && !isCompleted && !isSkipped && !isCurrent;

                return (
                  <div
                    key={idx}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all duration-200",
                      isCurrent && "bg-primary/8 ring-1 ring-inset ring-primary/20",
                      (isCompleted || isSkipped) && "opacity-35",
                      isMissed && "opacity-20",
                    )}
                  >
                    {/* Tappable left section → opens detail */}
                    <button
                      disabled={!canClick}
                      onClick={() => canClick ? onActivityClick(item) : undefined}
                      className={cn(
                        "flex-1 flex items-center gap-3 min-w-0 text-left",
                        canClick ? "active:opacity-70 cursor-pointer" : "cursor-default"
                      )}
                    >
                      <span className="text-[9px] font-mono font-bold text-white/25 w-11 shrink-0 tabular-nums">
                        {formatTo12h(item.time)}
                      </span>

                      <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0", typeStyle[item.type] ?? typeStyle.school)}>
                        {getTypeIcon(item.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-[13px] font-bold leading-tight truncate",
                          isCurrent ? "text-white" : isCompleted ? "text-white/30 line-through decoration-white/20" : isSkipped ? "text-white/20 line-through" : "text-white/70",
                        )}>
                          {item.activity}
                        </p>
                        {isCurrent && !isCompleted && !isSkipped && (
                          <span className="text-[8px] font-black uppercase tracking-[0.12em] text-primary">Active now</span>
                        )}
                        {isMissed && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-red-500/60">Missed</span>
                        )}
                      </div>
                    </button>

                    {/* Right side: status or YES/NO */}
                    <div className="shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 size={15} className="text-emerald-500" />
                      ) : isSkipped ? (
                        <XCircle size={13} className="text-red-500/40" />
                      ) : showYesNo ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onComplete(item.activity, item.type)}
                            className="h-7 w-7 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center active:scale-90 transition-all hover:bg-emerald-500/20"
                          >
                            <Check size={11} className="text-emerald-400" />
                          </button>
                          <button
                            onClick={() => onSkip(item.activity)}
                            className="h-7 w-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-all hover:bg-white/10"
                          >
                            <X size={11} className="text-white/30" />
                          </button>
                        </div>
                      ) : showArrow ? (
                        <ChevronRight size={13} className={cn(
                          "transition-colors",
                          isCurrent ? "text-primary/50" : "text-white/15"
                        )} />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <NavBar active="dashboard" onNavClick={onNavClick} position="sticky" />

      {/* Upgrade sheet overlay */}
      {showUpgradeSheet && upgradeFeature && (
        <div
          className="absolute inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowUpgradeSheet(false)}
        >
          <div
            className="w-full bg-[#181818] border-t border-white/10 rounded-t-3xl px-6 pt-6 pb-10 space-y-5 animate-in slide-in-from-bottom-4 duration-350"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Lock size={20} className="text-primary" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-primary">Free Limit Hit</p>
              <h3 className="text-xl font-headline font-black uppercase leading-tight">
                {upgradeFeature === 'snack' ? 'Snack Limit Reached' :
                 upgradeFeature === 'scout' ? 'Scout Limit Reached' :
                 upgradeFeature === 'plan-refresh' ? 'Refresh Limit Reached' :
                 'Limit Reached'}
              </h3>
              <p className="text-[11px] text-white/40 font-medium leading-relaxed">
                {upgradeFeature === 'snack'
                  ? `You've used all ${FREE_LIMITS.snack.max} free snack suggestions for today.`
                  : upgradeFeature === 'scout'
                  ? `You've used all ${FREE_LIMITS.scout.max} free scout reports.`
                  : `You've used all ${FREE_LIMITS['plan-refresh'].max} free plan refreshes for today.`}
                {' '}Upgrade for unlimited access.
              </p>
            </div>
            <button
              onClick={() => { setShowUpgradeSheet(false); onNavClick('paywall'); }}
              className="w-full h-14 rounded-2xl bg-primary text-primary-foreground text-sm font-black uppercase italic neon-glow active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Zap size={16} className="fill-current" />
              Unlock Pro — Unlimited Access
            </button>
            <button
              onClick={() => setShowUpgradeSheet(false)}
              className="w-full text-center text-[8px] font-bold uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}

      {/* Share sheet overlay */}
      {showShareSheet && (
        <div
          className="absolute inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowShareSheet(false)}
        >
          <div
            className="w-full bg-[#181818] border-t border-white/10 rounded-t-3xl px-6 pt-6 pb-10 space-y-5 animate-in slide-in-from-bottom-4 duration-350"
            onClick={e => e.stopPropagation()}
          >
            {/* Card preview */}
            <div className="rounded-2xl bg-white/5 border border-white/8 p-5 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-3">
                <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center", rank.bg)}>
                  <Trophy size={20} className={rank.color} />
                </div>
                <div>
                  <p className={cn("text-lg font-black uppercase tracking-tight leading-none", rank.color)}>{rank.name}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mt-0.5">{profile.xp ?? 0} XP · {profile.sport}</p>
                </div>
                <div className="ml-auto text-2xl">{sportEmoji}</div>
              </div>
              {nextRank && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Progress to {nextRank.name}</span>
                    <span className="text-[8px] font-black text-white/20">{rankProgress}%</span>
                  </div>
                  <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${rankProgress}%` }} />
                  </div>
                </div>
              )}
              <p className="text-[10px] text-white/30 font-medium leading-relaxed border-t border-white/5 pt-3">
                Training smarter every day · Powered by Gameday
              </p>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleShare}
                className="h-12 rounded-2xl bg-primary text-black text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 neon-glow active:scale-95 transition-all"
              >
                <Share2 size={13} /> Share
              </button>
              <button
                onClick={handleCopy}
                className="h-12 rounded-2xl bg-white/8 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                {copied
                  ? <><CheckCircle2 size={13} className="text-emerald-400" /><span className="text-emerald-400">Copied!</span></>
                  : <><Copy size={13} /> Copy Text</>
                }
              </button>
            </div>

            <button
              onClick={() => setShowShareSheet(false)}
              className="w-full text-center text-[8px] font-bold uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
