
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Welcome from './screens/Welcome';
import Onboarding from './screens/Onboarding';
import Paywall from './screens/Paywall';
import Dashboard from './screens/Dashboard';
import DrillDetail from './screens/DrillDetail';
import MealDetail from './screens/MealDetail';
import DrillsLibrary from './screens/DrillsLibrary';
import Stats from './screens/Stats';
import FoodTracker from './screens/FoodTracker';
import Quests from './screens/Quests';
import Settings from './screens/Settings';
import Fixtures from './screens/Fixtures';
import PatchNotes from './PatchNotes';
import FeedbackButton from './FeedbackButton';
import PostGameDebrief from './PostGameDebrief';
import TeamPicker from './TeamPicker';
import { getSavedTeam, saveTeam, type SavedTeam } from '@/lib/fsc-data';
import type { GameDebrief } from './PostGameDebrief';
import { CURRENT_VERSION } from '@/lib/patch-notes';
import AuthScreen from './auth/AuthScreen';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { updateDocViaRest, setDocViaRest } from '@/firebase/firestore/rest-write';
import { getDocViaRest } from '@/firebase/firestore/rest-fetch';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type DailyStats = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  sugar: number;
};

export type UserProfile = {
  sport: string;
  position: string;
  bestAbilities: string[];
  areaToImprove: string[];
  isOnboarded: boolean;
  hasAccess: boolean;
  lastFeedback?: string;
  schoolStartTime?: string;
  schoolEndTime?: string;
  xp: number;
  level: number;
  completedActivities: string[];
  skippedActivities?: string[];
  dailyStats: DailyStats;
  dailyStatsDate?: string;
  height?: string;
  weight?: string;
  age?: string;
  uid: string;
  email: string;
  myTeam?: SavedTeam | null;
  proLeagueId?: string;
  proClubId?: string;
  proClubName?: string;
  trainingDays?: string[];
  trainingTime?: string;
  debriefedFixtureIds?: string[];
};

export type ScreenState = 'welcome' | 'auth' | 'onboarding' | 'paywall' | 'dashboard' | 'drill' | 'meal' | 'drills_library' | 'stats' | 'food_tracker' | 'quests' | 'settings' | 'fixtures';

// Lazy-loads fixture data then renders the debrief modal
function PendingDebriefLoader({ fixtureId, onSubmit, onSkip }: {
  fixtureId: string;
  onSubmit: (d: GameDebrief) => void;
  onSkip: () => void;
}) {
  const [game, setGame] = React.useState<React.ComponentProps<typeof PostGameDebrief>['game'] | null>(null);
  React.useEffect(() => {
    import('@/lib/fsc-data').then(({ loadFSCData, parseMatchDate, formatKickoff }) => {
      loadFSCData().then(({ fixtures }) => {
        const f = fixtures.find(x => x.id === fixtureId);
        if (!f) return;
        let myClubName = '';
        try { myClubName = JSON.parse(localStorage.getItem('gameday_my_club') || '{}').name?.toLowerCase() ?? ''; } catch {}
        const isHome = (f.homeTeam.name ?? '').toLowerCase().includes(myClubName);
        const opponentRaw = isHome ? (f.awayTeam.name ?? 'TBC') : (f.homeTeam.name ?? 'TBC');
        const opponent = opponentRaw.includes('  ') ? opponentRaw.split('  ')[0].trim() : opponentRaw;
        const local = parseMatchDate(f.matchDate);
        setGame({ id: f.id, opponent, date: f.matchDate.split('T')[0], time: formatKickoff(local), venue: f.groundLocation, isHome, competition: f.leagueTierName });
      });
    });
  }, [fixtureId]);
  if (!game) return null;
  return <PostGameDebrief game={game} onSubmit={onSubmit} onSkip={onSkip} />;
}

export default function GamedayFlow() {
  const { user: firebaseUser, loading: authLoading } = useUser();
  const db = useFirestore();
  const [currentScreen, setCurrentScreen] = useState<ScreenState>(() => {
    // Skip the welcome flash for returning users — go straight to dashboard
    // while Firebase auth resolves in the background.
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('gameday_last_uid')) {
        return 'dashboard';
      }
    } catch {}
    return 'welcome';
  });
  const [selectedActivity, setSelectedActivity] = useState<{ activity: string, intel: string, type?: string, ingredients?: string[], youtubeSearchQuery?: string, videoId?: string } | null>(null);
  
  // Demo Mode State
  const [demoUser, setDemoUser] = useState<{ uid: string; email: string } | null>(null);
  const [stalledConnection, setStalledConnection] = useState(false);

  // Patch notes
  const [showPatchNotes, setShowPatchNotes] = useState(false);

  // Team picker — shown after paywall for new users, or once for existing users without a team
  const [showTeamPicker, setShowTeamPicker] = useState(false);

  // Post-game debrief — uses FSC JSON data; tracks which fixture IDs have been debriefed
  const [pendingDebriefFixtureId, setPendingDebriefFixtureId] = useState<string | null>(null);

  useEffect(() => {
    const handleBypass = () => {
      setDemoUser({ uid: 'demo-athlete', email: 'pro@gameday.pro' });
      setCurrentScreen('dashboard');
    };
    window.addEventListener('demo-bypass', handleBypass);
    return () => window.removeEventListener('demo-bypass', handleBypass);
  }, []);

  const effectiveUser = firebaseUser || demoUser;
  const userRef = useMemo(() => (db && effectiveUser ? doc(db, 'users', effectiveUser.uid) : null), [db, effectiveUser]);
  const { data: profile, loading: profileLoading, error } = useDoc<UserProfile>(userRef);

  // Cache profile in localStorage so the app works when Firestore is slow/offline
  const [cachedProfile, setCachedProfile] = useState<UserProfile | null>(null);

  type FoodEntry = { name: string; calories: number; protein: number; carbs: number; fats: number; sugar: number; time: string };
  const [todayFoodLog, setTodayFoodLog] = useState<FoodEntry[]>(() => {
    try {
      const uid = typeof window !== 'undefined' ? (localStorage.getItem('gameday_last_uid') || '') : '';
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
      const stored = localStorage.getItem(`gameday_food_log_${uid}_${today}`);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [waterLogged, setWaterLogged] = useState<number>(() => {
    try {
      const uid = typeof window !== 'undefined' ? (localStorage.getItem('gameday_last_uid') || '') : '';
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
      return parseInt(localStorage.getItem(`gameday_water_${uid}_${today}`) || '0');
    } catch { return 0; }
  });

  useEffect(() => {
    if (!effectiveUser) return;
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
    try {
      localStorage.setItem('gameday_last_uid', effectiveUser.uid);
      const stored = localStorage.getItem(`gameday_profile_${effectiveUser.uid}`);
      if (stored) setCachedProfile(JSON.parse(stored));
      // Load today's daily data from localStorage (fast, immediate)
      const logStored = localStorage.getItem(`gameday_food_log_${effectiveUser.uid}_${today}`);
      setTodayFoodLog(logStored ? JSON.parse(logStored) : []);
      const waterStored = localStorage.getItem(`gameday_water_${effectiveUser.uid}_${today}`);
      setWaterLogged(waterStored ? parseInt(waterStored) : 0);
    } catch {}

    // Pull today's daily data from Firestore (syncs across devices)
    if (db) {
      const dailyRef = doc(db, 'users', effectiveUser.uid, 'daily', today);
      getDocViaRest<{ foodLog: FoodEntry[]; waterMl: number }>(dailyRef)
        .then(data => {
          if (!data) return;
          if (Array.isArray(data.foodLog) && data.foodLog.length > 0) {
            setTodayFoodLog(data.foodLog);
            try { localStorage.setItem(`gameday_food_log_${effectiveUser.uid}_${today}`, JSON.stringify(data.foodLog)); } catch {}
          }
          if (typeof data.waterMl === 'number' && data.waterMl > 0) {
            setWaterLogged(data.waterMl);
            try { localStorage.setItem(`gameday_water_${effectiveUser.uid}_${today}`, String(data.waterMl)); } catch {}
          }
        })
        .catch(() => {});
    }
  }, [effectiveUser?.uid, db]);

  useEffect(() => {
    if (profile && effectiveUser) {
      // Zero out stale stats before caching — prevents Firestore overwriting an already-reset session
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
      let p = profile;
      if (p.dailyStatsDate !== today) {
        p = { ...p, dailyStats: { calories: 0, protein: 0, carbs: 0, fats: 0, sugar: 0 }, dailyStatsDate: today };
      }
      try {
        localStorage.setItem(`gameday_profile_${effectiveUser.uid}`, JSON.stringify(p));
      } catch {}
      setCachedProfile(p);
    }
  }, [profile, effectiveUser]);

  // cachedProfile is always at least as fresh as profile (includes optimistic updates)
  const effectiveProfile = cachedProfile || profile;

  // Reset daily stats when the user opens the app on a new day (Sydney midnight)
  useEffect(() => {
    if (!effectiveProfile || !userRef || !effectiveUser) return;
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
    if (effectiveProfile.dailyStatsDate === today) return;
    const zeroed = { ...effectiveProfile, dailyStats: { calories: 0, protein: 0, carbs: 0, fats: 0, sugar: 0 }, dailyStatsDate: today };
    setCachedProfile(zeroed);
    try { localStorage.setItem(`gameday_profile_${effectiveUser.uid}`, JSON.stringify(zeroed)); } catch {}
    reliableUpdate({ 'dailyStats.calories': 0, 'dailyStats.protein': 0, 'dailyStats.carbs': 0, 'dailyStats.fats': 0, 'dailyStats.sugar': 0, dailyStatsDate: today }).catch(() => {});
  }, [effectiveProfile?.uid, effectiveProfile?.dailyStatsDate]);

  useEffect(() => {
    if (authLoading) return;

    if (!effectiveUser) {
      if (currentScreen !== 'welcome' && currentScreen !== 'auth') {
        setCurrentScreen('welcome');
      }
    } else {
      if (!profileLoading) {
        if (error) {
          console.error("Profile load error:", error);
          // Firestore is offline/erroring — don't strand the user on the auth screen.
          // Navigate to dashboard; it will show a reconnecting state until profile loads.
          if (currentScreen === 'auth' || currentScreen === 'welcome') {
            setCurrentScreen('dashboard');
          }
        } else if (!effectiveProfile || !effectiveProfile.isOnboarded) {
          if (currentScreen !== 'onboarding' && currentScreen !== 'paywall' && currentScreen !== 'settings') {
            // Only redirect from dashboard if Firestore confirmed no document (no error = not a connection issue)
            if (currentScreen !== 'dashboard' || !error) {
              setCurrentScreen('onboarding');
            }
          }
        } else if (!effectiveProfile.hasAccess && currentScreen !== 'paywall' && currentScreen !== 'onboarding' && currentScreen !== 'dashboard' && currentScreen !== 'settings') {
          setCurrentScreen('paywall');
        } else if (currentScreen === 'welcome' || currentScreen === 'auth' || currentScreen === 'onboarding') {
          setCurrentScreen('dashboard');
        }
      }
    }
  }, [effectiveUser, profile, effectiveProfile, authLoading, profileLoading, currentScreen]);

  // If stuck on dashboard with no profile for 5s, show error instead of spinner
  useEffect(() => {
    if (currentScreen === 'dashboard' && !effectiveProfile) {
      setStalledConnection(false);
      const timer = setTimeout(() => setStalledConnection(true), 20000);
      return () => clearTimeout(timer);
    } else {
      setStalledConnection(false);
    }
  }, [currentScreen, effectiveProfile]);

  // Safety net: if auth resolved but Firestore hangs for 6s, navigate to dashboard
  useEffect(() => {
    if (!effectiveUser) return;
    const timer = setTimeout(() => {
      if (profileLoading && (currentScreen === 'auth' || currentScreen === 'welcome')) {
        setCurrentScreen('dashboard');
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [effectiveUser, profileLoading, currentScreen]);

  // Patch notes: show on first open after a version update
  useEffect(() => {
    if (!effectiveProfile) return;
    try {
      const seen = localStorage.getItem('gameday_version_seen');
      if (seen !== CURRENT_VERSION) setShowPatchNotes(true);
    } catch {}
  }, [effectiveProfile]);

  // Sync team between Firestore and localStorage
  useEffect(() => {
    if (!effectiveProfile) return;
    const localTeam = getSavedTeam();
    if (effectiveProfile.myTeam && !localTeam) {
      // New device: pull team from Firestore into localStorage
      saveTeam(effectiveProfile.myTeam);
    } else if (!effectiveProfile.myTeam && localTeam) {
      // Existing user before sync was added: push local team up to Firestore
      updateProfile({ myTeam: localTeam });
    }
  }, [effectiveProfile?.uid]);

  // Team picker: show once for onboarded users who haven't picked a team yet
  useEffect(() => {
    if (!effectiveProfile?.isOnboarded) return;
    if (getSavedTeam()) return; // already set
    try {
      const skipped = localStorage.getItem('gameday_team_picker_skipped');
      if (!skipped) setShowTeamPicker(true);
    } catch {}
  }, [effectiveProfile?.isOnboarded]);

  // Check for past fixtures needing a debrief (lazy-load FSC data)
  useEffect(() => {
    if (!effectiveProfile) return;
    try {
      const myClubRaw = localStorage.getItem('gameday_my_club');
      if (!myClubRaw) return;
      const { name: clubName } = JSON.parse(myClubRaw);
      const localIds: string[] = JSON.parse(localStorage.getItem('gameday_debriefed') || '[]');
      const debriefedIds: string[] = [...new Set([...localIds, ...(effectiveProfile?.debriefedFixtureIds || [])])];
      const now = new Date();
      import('@/lib/fsc-data').then(({ loadFSCData, parseMatchDate, getSavedTeam: getTeam, fixturesForTeam }) => {
        loadFSCData().then(({ fixtures, clubs }) => {
          const q = clubName.toLowerCase();
          const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);
          const savedTeam = getTeam();
          let candidates = savedTeam
            ? fixturesForTeam(fixtures, savedTeam.clubName, savedTeam.gradeKey, clubs)
            : fixtures.filter(f =>
                (f.homeTeam.name ?? '').toLowerCase().includes(q) ||
                (f.awayTeam.name ?? '').toLowerCase().includes(q)
              );
          const past = candidates
            .filter(f => {
              const t = parseMatchDate(f.matchDate);
              return t < now && t >= cutoff && !debriefedIds.includes(f.id);
            })
            .sort((a, b) => b.matchDate.localeCompare(a.matchDate))[0];
          if (past) setPendingDebriefFixtureId(past.id);
        });
      });
    } catch {}
  }, [effectiveProfile]);

  const reliableUpdate = async (data: Record<string, any>) => {
    if (!userRef) return;
    try {
      await updateDocViaRest(userRef, data);
    } catch {
      await updateDoc(userRef, data);
    }
  };

  const skipActivity = (activityId: string) => {
    if (!userRef || !effectiveProfile) return;
    if (effectiveProfile.skippedActivities?.includes(activityId)) return;
    const newSkipped = [...(effectiveProfile.skippedActivities || []), activityId];
    reliableUpdate({ skippedActivities: newSkipped }).catch(console.error);
    if (effectiveProfile && effectiveUser) {
      const updated = { ...effectiveProfile, skippedActivities: newSkipped };
      setCachedProfile(updated);
      try { localStorage.setItem(`gameday_profile_${effectiveUser.uid}`, JSON.stringify(updated)); } catch {}
    }
  };

  const awardXP = (amount: number, activityId: string) => {
    if (!userRef || !effectiveProfile || !effectiveUser) return;
    if (effectiveProfile.completedActivities.includes(activityId)) return;
    const newXp = (effectiveProfile.xp || 0) + amount;
    const newLevel = Math.floor(newXp / 100) + 1;
    const newActivities = [...effectiveProfile.completedActivities, activityId];
    reliableUpdate({ xp: newXp, level: newLevel, completedActivities: newActivities }).catch(console.error);
    const updated = { ...effectiveProfile, xp: newXp, level: newLevel, completedActivities: newActivities };
    setCachedProfile(updated);
    try { localStorage.setItem(`gameday_profile_${effectiveUser.uid}`, JSON.stringify(updated)); } catch {}
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    if (!userRef) return;
    reliableUpdate(data as Record<string, any>).catch(console.error);
    // Also update cache immediately so UI reflects the change instantly
    if (effectiveProfile && effectiveUser) {
      const updated = { ...effectiveProfile, ...data };
      setCachedProfile(updated);
      try { localStorage.setItem(`gameday_profile_${effectiveUser.uid}`, JSON.stringify(updated)); } catch {}
    }
  };

  const logMealStats = (stats: DailyStats, foodName?: string) => {
    if (!userRef || !effectiveProfile || !effectiveUser) return;
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });

    // Reset stats if it's a new day
    const isToday = effectiveProfile.dailyStatsDate === today;
    const cur = isToday ? (effectiveProfile.dailyStats || { calories: 0, protein: 0, carbs: 0, fats: 0, sugar: 0 })
                        : { calories: 0, protein: 0, carbs: 0, fats: 0, sugar: 0 };

    const newStats: DailyStats = {
      calories: cur.calories + stats.calories,
      protein:  cur.protein  + stats.protein,
      carbs:    cur.carbs    + stats.carbs,
      fats:     cur.fats     + stats.fats,
      sugar:    cur.sugar    + stats.sugar,
    };
    reliableUpdate({
      'dailyStats.calories': newStats.calories,
      'dailyStats.protein':  newStats.protein,
      'dailyStats.carbs':    newStats.carbs,
      'dailyStats.fats':     newStats.fats,
      'dailyStats.sugar':    newStats.sugar,
      dailyStatsDate: today,
    }).catch(console.error);

    const updatedProfile = { ...effectiveProfile, dailyStats: newStats, dailyStatsDate: today };
    setCachedProfile(updatedProfile);
    try { localStorage.setItem(`gameday_profile_${effectiveUser.uid}`, JSON.stringify(updatedProfile)); } catch {}

    // Persist food log locally + to Firestore
    if (foodName) {
      const key = `gameday_food_log_${effectiveUser.uid}_${today}`;
      try {
        const existing: FoodEntry[] = JSON.parse(localStorage.getItem(key) || '[]');
        const newEntry: FoodEntry = {
          name: foodName,
          calories: stats.calories,
          protein: stats.protein,
          carbs: stats.carbs,
          fats: stats.fats,
          sugar: stats.sugar,
          time: new Date().toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }),
        };
        const updatedLog = [...existing, newEntry];
        localStorage.setItem(key, JSON.stringify(updatedLog));
        setTodayFoodLog(updatedLog);
        // Sync to Firestore daily doc
        if (db) {
          const waterMl = parseInt(localStorage.getItem(`gameday_water_${effectiveUser.uid}_${today}`) || '0');
          const dailyRef = doc(db, 'users', effectiveUser.uid, 'daily', today);
          setDocViaRest(dailyRef, { foodLog: updatedLog, waterMl })
            .catch(() => setDoc(dailyRef, { foodLog: updatedLog, waterMl }, { merge: true }).catch(() => {}));
        }
      } catch {}
    }
  };

  const logWater = (ml: number) => {
    if (!effectiveUser) return;
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
    const newTotal = waterLogged + ml;
    setWaterLogged(newTotal);
    try { localStorage.setItem(`gameday_water_${effectiveUser.uid}_${today}`, String(newTotal)); } catch {}
    if (db) {
      const foodLog = JSON.parse(localStorage.getItem(`gameday_food_log_${effectiveUser.uid}_${today}`) || '[]');
      const dailyRef = doc(db, 'users', effectiveUser.uid, 'daily', today);
      setDocViaRest(dailyRef, { foodLog, waterMl: newTotal })
        .catch(() => setDoc(dailyRef, { foodLog, waterMl: newTotal }, { merge: true }).catch(() => {}));
    }
  };

  const saveDebrief = (debrief: GameDebrief) => {
    if (!pendingDebriefFixtureId) return;
    const newDebriefedIds = [...(effectiveProfile?.debriefedFixtureIds || []), pendingDebriefFixtureId];
    try { localStorage.setItem('gameday_debriefed', JSON.stringify(newDebriefedIds)); } catch {}
    const feedback = `Post-game: ${debrief.result} ${debrief.goalsFor}-${debrief.goalsAgainst}. Went well: ${debrief.wentWell}. To improve: ${debrief.toImprove}. Rating: ${debrief.rating}/5.`;
    updateProfile({ lastFeedback: feedback, debriefedFixtureIds: newDebriefedIds });
    setPendingDebriefFixtureId(null);
  };

  const handleActivityClick = (item: any) => {
    setSelectedActivity({
      activity: item.activity,
      intel: item.intel,
      type: item.type,
      ingredients: item.ingredients,
      youtubeSearchQuery: item.youtubeSearchQuery,
      videoId: item.videoId
    });
    if (item.type === 'training') setCurrentScreen('drill');
    else if (item.type === 'nutrition') setCurrentScreen('meal');
  };

  const handleOnboardingComplete = (data: UserProfile) => {
    if (!userRef || !effectiveUser) return;

    const newProfile = {
      ...data,
      uid: effectiveUser.uid,
      email: effectiveUser.email,
      isOnboarded: true,
      hasAccess: false,
      xp: 0,
      level: 1,
      completedActivities: [],
      dailyStats: { calories: 0, protein: 0, carbs: 0, fats: 0, sugar: 0 }
    };

    setDocViaRest(userRef, newProfile).catch(() =>
      setDoc(userRef, newProfile, { merge: true }).catch(console.error)
    );
    // Navigate immediately — don't wait for onSnapshot
    setCurrentScreen('paywall');
  };

  if (authLoading) {
    return (
      <div className="flex-1 bg-background flex flex-col items-center justify-center gap-4">
        <div className="animate-spin h-8 w-8 border-t-2 border-primary rounded-full" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 animate-pulse">Initializing Protocol...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {currentScreen === 'welcome' && <Welcome onNext={() => setCurrentScreen('auth')} />}
      {currentScreen === 'auth' && !effectiveUser && <AuthScreen />}
      {currentScreen === 'auth' && effectiveUser && (
        <div className="flex-1 bg-background flex flex-col items-center justify-center gap-4 animate-in fade-in duration-200">
          <div className="animate-spin h-8 w-8 border-t-2 border-primary rounded-full" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 animate-pulse">Loading Protocol...</p>
        </div>
      )}
      
      {currentScreen === 'onboarding' && effectiveUser && (
        <Onboarding onNext={handleOnboardingComplete} />
      )}

      {currentScreen === 'paywall' && (
        <Paywall
          onComplete={() => {
            updateProfile({ hasAccess: true });
            if (effectiveProfile && effectiveUser) {
              const updated = { ...effectiveProfile, hasAccess: true };
              setCachedProfile(updated);
              try { localStorage.setItem(`gameday_profile_${effectiveUser.uid}`, JSON.stringify(updated)); } catch {}
            }
            // Show team picker for new users before landing on dashboard
            setShowTeamPicker(true);
            setCurrentScreen('dashboard');
          }}
          onDismiss={() => setCurrentScreen('dashboard')}
        />
      )}
      
      {currentScreen === 'dashboard' && !effectiveProfile && !stalledConnection && (
        <div className="flex-1 bg-background flex flex-col items-center justify-center gap-4">
          <div className="animate-spin h-8 w-8 border-t-2 border-primary rounded-full" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 animate-pulse">Loading...</p>
        </div>
      )}
      {currentScreen === 'dashboard' && !effectiveProfile && stalledConnection && (
        <div className="flex-1 bg-background flex flex-col items-center justify-center gap-6 px-8">
          <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <span className="text-2xl">⚡</span>
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm font-black uppercase tracking-widest">Connection Lost</p>
            <p className="text-[10px] text-white/30 font-medium uppercase tracking-widest">Check your internet and try again</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-4 rounded-2xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest neon-glow active:scale-95 transition-all"
          >
            Reload App
          </button>
        </div>
      )}
      {currentScreen === 'dashboard' && effectiveProfile && (
        <Dashboard
          profile={effectiveProfile}
          onActivityClick={handleActivityClick}
          onNavClick={setCurrentScreen}
          onComplete={(id, type) => awardXP(type === 'training' ? 50 : 25, id)}
          onSkip={skipActivity}
          onLogMeal={logMealStats}
        />
      )}

      {currentScreen === 'drill' && selectedActivity && effectiveProfile && (
        <DrillDetail
          onBack={() => setCurrentScreen('dashboard')}
          item={selectedActivity}
          onComplete={(t) => awardXP(50, t)}
          isCompleted={effectiveProfile.completedActivities.includes(selectedActivity.activity)}
        />
      )}

      {currentScreen === 'meal' && selectedActivity && effectiveProfile && (
        <MealDetail
          onBack={() => setCurrentScreen('dashboard')}
          item={selectedActivity}
          onComplete={(t) => awardXP(25, t)}
          isCompleted={effectiveProfile.completedActivities.includes(selectedActivity.activity)}
          sport={effectiveProfile.sport}
          position={effectiveProfile.position}
        />
      )}

      {currentScreen === 'drills_library' && (
        <DrillsLibrary
          onBack={() => setCurrentScreen('dashboard')}
          onNavClick={setCurrentScreen}
          onDrillClick={(d) => { setSelectedActivity({ ...d, type: 'training' }); setCurrentScreen('drill'); }}
          sport={effectiveProfile?.sport}
        />
      )}

      {currentScreen === 'stats' && effectiveProfile && (
        <Stats
          profile={effectiveProfile}
          onBack={() => setCurrentScreen('dashboard')}
          onNavClick={setCurrentScreen}
          todayFoodLog={todayFoodLog}
          waterLogged={waterLogged}
          onAddWater={logWater}
        />
      )}

      {currentScreen === 'settings' && effectiveProfile && (
        <Settings
          profile={effectiveProfile}
          onBack={() => setCurrentScreen('dashboard')}
          onChangeTeam={() => setShowTeamPicker(true)}
          onUpdateProfile={updateProfile}
        />
      )}

      {currentScreen === 'food_tracker' && <FoodTracker onBack={() => setCurrentScreen('dashboard')} onNavClick={setCurrentScreen} onLogMeal={logMealStats} uid={effectiveProfile?.uid} />}

      {currentScreen === 'quests' && effectiveProfile && (
        <Quests
          profile={effectiveProfile}
          onBack={() => setCurrentScreen('dashboard')}
          onNavClick={setCurrentScreen}
          onComplete={(id) => awardXP(100, id)}
        />
      )}

      {currentScreen === 'fixtures' && (
        <Fixtures
          onBack={() => setCurrentScreen('dashboard')}
          onNavClick={setCurrentScreen}
        />
      )}

      {/* Team picker overlay — shown after paywall (new users) or once for existing users */}
      {showTeamPicker && !showPatchNotes && (
        <TeamPicker
          title="Pick Your Team"
          subtitle="Find your club and select the team you play for"
          onSave={(team) => {
            updateProfile({ myTeam: team });
            setShowTeamPicker(false);
          }}
          onSkip={() => {
            setShowTeamPicker(false);
            try { localStorage.setItem('gameday_team_picker_skipped', '1'); } catch {}
          }}
        />
      )}

      {/* Patch notes overlay */}
      {showPatchNotes && (
        <PatchNotes onDismiss={() => {
          setShowPatchNotes(false);
          try { localStorage.setItem('gameday_version_seen', CURRENT_VERSION); } catch {}
        }} />
      )}

      {/* Feedback button — visible on main app screens, hidden on auth/onboarding */}
      {effectiveProfile && ['dashboard', 'drill', 'meal', 'stats', 'food_tracker', 'drills_library', 'quests', 'fixtures', 'settings'].includes(currentScreen) && (
        <FeedbackButton uid={effectiveUser?.uid} />
      )}

      {/* Post-game debrief overlay — rendered via separate state to avoid require() */}
      {pendingDebriefFixtureId && !showPatchNotes && (
        <PendingDebriefLoader
          fixtureId={pendingDebriefFixtureId}
          onSubmit={saveDebrief}
          onSkip={() => setPendingDebriefFixtureId(null)}
        />
      )}
    </div>
  );
}
