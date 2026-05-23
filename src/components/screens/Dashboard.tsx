"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { generatePersonalizedTrainingPlan, type GeneratePersonalizedTrainingPlanOutput } from '@/ai/flows/generate-personalized-training-plan';
import { Home, Dumbbell, Utensils, BarChart2, Play, ChevronRight, Clock, Moon, Flame, Camera, RefreshCcw, AlertCircle, GraduationCap, Calendar, MapPin, CheckCircle2, XCircle, Zap, Bell, BellOff, Check, X, Apple, Shuffle, Loader2, Plus } from 'lucide-react';
import { getRank, getRankProgress, getNextRank } from '@/lib/rank';
import { scheduleDayNotifications, requestNotificationPermission, isNotificationPermitted, clearScheduledNotifications } from '@/lib/notification-service';
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

type Snack = { name: string; benefit: string; steps: string[]; kcal: number; protein: number; carbs: number; fats: number };

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
    try {
      // Prefer team-level selection; fall back to club-only legacy key
      const team = getSavedTeam();
      if (team) {
        setMyClub({ id: team.clubId, name: team.clubName, logo: team.clubLogo });
        loadFSCData().then(data => setNextGame(findNextGame(data, team.clubName, team.gradeKey))).catch(() => {});
      } else {
        const raw = localStorage.getItem('gameday_my_club');
        if (raw) {
          const club = JSON.parse(raw);
          setMyClub(club);
          loadFSCData().then(data => setNextGame(findNextGame(data, club.name))).catch(() => {});
        }
      }
    } catch {}
  }, []);
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
      });

      const planData = { ...result, uid: profile.uid, date: todayStr, createdAt: new Date().toISOString() };
      setDocViaRest(planRef, planData).catch(() => setDoc(planRef, planData).catch(() => {}));

      try { localStorage.setItem(planCacheKey, JSON.stringify(result)); } catch {}
      setPlan(result);
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
    setSnackLoading(true);
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

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden animate-in fade-in duration-700">
      <div className="px-6 pt-12 pb-4 shrink-0">
        <div className="flex justify-between items-start">
          <div className="space-y-1.5">
            <h3 className="text-xl font-headline font-bold uppercase tracking-tight">Daily Schedule</h3>
            <div className="flex items-center gap-2">
              <span className={cn("text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full", rank.bg, rank.color)}>
                {rank.name}
              </span>
              <span className="text-[8px] text-white/20 font-bold uppercase tracking-widest">{profile.xp ?? 0} XP</span>
              {nextRank && (
                <span className="text-[8px] text-white/15 font-bold">→ {nextRank.name} at {nextRank.minXP}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
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
          <Button onClick={() => fetchPlan(true)} variant="ghost" size="icon" className="h-8 w-8 text-white/20 hover:text-white shrink-0">
            <RefreshCcw size={14} className={cn(loading && "animate-spin")} />
          </Button>
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
            <button onClick={() => onNavClick('fixtures')} className="w-full rounded-3xl bg-white/5 border border-white/8 p-5 flex items-center gap-4 active:scale-[0.98] transition-all">
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
              </button>
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
                      setSnackLoading(true);
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

      <div className="sticky bottom-0 left-0 right-0 h-28 glass-nav flex items-center justify-around px-4 pb-8 z-30">
        <button onClick={() => onNavClick('dashboard')} className="flex flex-col items-center gap-2 text-white">
          <div className="h-1 w-8 bg-primary rounded-full mb-1" />
          <Home size={20} /> <span className="text-[8px] font-bold uppercase tracking-[0.1em]">Daily</span>
        </button>
        <button onClick={() => onNavClick('drills_library')} className="flex flex-col items-center gap-2 text-white/40 hover:text-white transition-colors">
          <Dumbbell size={20} /> <span className="text-[8px] font-bold uppercase tracking-[0.1em]">Drills</span>
        </button>
        <button onClick={() => onNavClick('quests')} className="flex flex-col items-center gap-2 text-white/40 hover:text-white transition-colors">
          <Zap size={20} /> <span className="text-[8px] font-bold uppercase tracking-[0.1em]">Bonus</span>
        </button>
        <button onClick={() => onNavClick('food_tracker')} className="flex flex-col items-center gap-2 text-white/40 hover:text-white transition-colors">
          <Camera size={20} /> <span className="text-[8px] font-bold uppercase tracking-[0.1em]">Scan</span>
        </button>
        <button onClick={() => onNavClick('stats')} className="flex flex-col items-center gap-2 text-white/40 hover:text-white transition-colors">
          <BarChart2 size={20} /> <span className="text-[8px] font-bold uppercase tracking-[0.1em]">Stats</span>
        </button>
      </div>
    </div>
  );
}
