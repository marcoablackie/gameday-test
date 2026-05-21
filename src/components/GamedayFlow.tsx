
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
import PostGameDebrief from './PostGameDebrief';
import type { GameDebrief } from './PostGameDebrief';
import { CURRENT_VERSION } from '@/lib/patch-notes';
import AuthScreen from './auth/AuthScreen';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { updateDocViaRest, setDocViaRest } from '@/firebase/firestore/rest-write';
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
  dailyStats: DailyStats;
  height?: string;
  weight?: string;
  age?: string;
  uid: string;
  email: string;
};

export type ScreenState = 'welcome' | 'auth' | 'onboarding' | 'paywall' | 'dashboard' | 'drill' | 'meal' | 'drills_library' | 'stats' | 'food_tracker' | 'quests' | 'settings' | 'fixtures';

export default function GamedayFlow() {
  const { user: firebaseUser, loading: authLoading } = useUser();
  const db = useFirestore();
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('welcome');
  const [selectedActivity, setSelectedActivity] = useState<{ activity: string, intel: string, type?: string, ingredients?: string[], youtubeSearchQuery?: string, videoId?: string } | null>(null);
  
  // Demo Mode State
  const [demoUser, setDemoUser] = useState<{ uid: string; email: string } | null>(null);
  const [stalledConnection, setStalledConnection] = useState(false);

  // Patch notes
  const [showPatchNotes, setShowPatchNotes] = useState(false);

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

  useEffect(() => {
    if (!effectiveUser) return;
    try {
      const stored = localStorage.getItem(`gameday_profile_${effectiveUser.uid}`);
      if (stored) setCachedProfile(JSON.parse(stored));
    } catch {}
  }, [effectiveUser?.uid]);

  useEffect(() => {
    if (profile && effectiveUser) {
      try {
        localStorage.setItem(`gameday_profile_${effectiveUser.uid}`, JSON.stringify(profile));
      } catch {}
      setCachedProfile(profile);
    }
  }, [profile, effectiveUser]);

  const effectiveProfile = profile || cachedProfile;

  useEffect(() => {
    console.log("GamedayFlow state check", { 
      authLoading, 
      profileLoading, 
      hasEffectiveUser: !!effectiveUser,
      profile: profile 
    });
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
          console.log("Profile found and onboarded, navigating to dashboard");
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
      if (seen !== CURRENT_VERSION) {
        setShowPatchNotes(true);
      }
    } catch {}
  }, [effectiveProfile]);

  // Check for past fixtures needing a debrief (based on saved club + FSC JSON)
  useEffect(() => {
    if (!effectiveProfile) return;
    try {
      const myClub = localStorage.getItem('gameday_my_club');
      if (!myClub) return;
      const { name: clubName } = JSON.parse(myClub);
      const debriefedIds: string[] = JSON.parse(localStorage.getItem('gameday_debriefed') || '[]');
      const now = new Date();
      const { fixtures } = require('@/data/fsc_clean_season_database.json');
      const cn = clubName.toLowerCase();
      const pastNeedingDebrief = (fixtures as any[])
        .filter(f =>
          new Date(f.matchDate.replace('Z', '')) < now &&
          (f.homeTeam.name.toLowerCase().includes(cn) || f.awayTeam.name.toLowerCase().includes(cn)) &&
          !debriefedIds.includes(f.id)
        )
        .sort((a: any, b: any) => b.matchDate.localeCompare(a.matchDate))[0];
      if (pastNeedingDebrief) setPendingDebriefFixtureId(pastNeedingDebrief.id);
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

  const awardXP = (amount: number, activityId: string) => {
    if (!userRef || !effectiveProfile) return;
    if (effectiveProfile.completedActivities.includes(activityId)) return;
    const newXp = (effectiveProfile.xp || 0) + amount;
    const newLevel = Math.floor(newXp / 100) + 1;
    const newActivities = [...effectiveProfile.completedActivities, activityId];
    reliableUpdate({ xp: newXp, level: newLevel, completedActivities: newActivities }).catch(console.error);
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

  const logMealStats = (stats: DailyStats) => {
    if (!userRef || !effectiveProfile) return;
    const update = {
      'dailyStats.calories': (effectiveProfile.dailyStats?.calories || 0) + stats.calories,
      'dailyStats.protein': (effectiveProfile.dailyStats?.protein || 0) + stats.protein,
      'dailyStats.carbs': (effectiveProfile.dailyStats?.carbs || 0) + stats.carbs,
      'dailyStats.fats': (effectiveProfile.dailyStats?.fats || 0) + stats.fats,
      'dailyStats.sugar': (effectiveProfile.dailyStats?.sugar || 0) + stats.sugar,
    };
    reliableUpdate(update).catch(console.error);
  };

  const saveDebrief = (debrief: GameDebrief) => {
    if (!pendingDebriefFixtureId) return;
    try {
      const existing: string[] = JSON.parse(localStorage.getItem('gameday_debriefed') || '[]');
      localStorage.setItem('gameday_debriefed', JSON.stringify([...existing, pendingDebriefFixtureId]));
    } catch {}
    const feedback = `Post-game: ${debrief.result} ${debrief.goalsFor}-${debrief.goalsAgainst}. Went well: ${debrief.wentWell}. To improve: ${debrief.toImprove}. Rating: ${debrief.rating}/5.`;
    updateProfile({ lastFeedback: feedback });
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
            // Update cached profile immediately so nav logic sees hasAccess=true before Firestore syncs
            if (effectiveProfile && effectiveUser) {
              const updated = { ...effectiveProfile, hasAccess: true };
              setCachedProfile(updated);
              try { localStorage.setItem(`gameday_profile_${effectiveUser.uid}`, JSON.stringify(updated)); } catch {}
            }
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
        />
      )}

      {currentScreen === 'drills_library' && (
        <DrillsLibrary
          onBack={() => setCurrentScreen('dashboard')}
          onNavClick={setCurrentScreen}
          onDrillClick={(d) => { setSelectedActivity({ ...d, type: 'training' }); setCurrentScreen('drill'); }}
        />
      )}

      {currentScreen === 'stats' && effectiveProfile && (
        <Stats
          profile={effectiveProfile}
          onBack={() => setCurrentScreen('dashboard')}
          onNavClick={setCurrentScreen}
        />
      )}

      {currentScreen === 'settings' && effectiveProfile && (
        <Settings
          profile={effectiveProfile}
          onBack={() => setCurrentScreen('dashboard')}
          onUpdateProfile={updateProfile}
        />
      )}

      {currentScreen === 'food_tracker' && <FoodTracker onBack={() => setCurrentScreen('dashboard')} onNavClick={setCurrentScreen} onLogMeal={logMealStats} />}

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

      {/* Patch notes overlay */}
      {showPatchNotes && (
        <PatchNotes onDismiss={() => {
          setShowPatchNotes(false);
          try { localStorage.setItem('gameday_version_seen', CURRENT_VERSION); } catch {}
        }} />
      )}

      {/* Post-game debrief overlay */}
      {pendingDebriefFixtureId && !showPatchNotes && (() => {
        const { fixtures } = require('@/data/fsc_clean_season_database.json');
        const fixture = (fixtures as any[]).find((f: any) => f.id === pendingDebriefFixtureId);
        if (!fixture) return null;
        const myClubRaw = localStorage.getItem('gameday_my_club');
        const myClubName = myClubRaw ? JSON.parse(myClubRaw).name.toLowerCase() : '';
        const isHome = fixture.homeTeam.name.toLowerCase().includes(myClubName);
        const opponent = isHome ? fixture.awayTeam.name : fixture.homeTeam.name;
        const opponentClean = opponent.includes('  ') ? opponent.split('  ')[0].trim() : opponent;
        const game = { id: fixture.id, opponent: opponentClean, date: fixture.matchDate.split('T')[0], time: fixture.matchDate.split('T')[1]?.slice(0,5) || '00:00', venue: fixture.groundLocation, isHome, competition: fixture.leagueTierName };
        return <PostGameDebrief game={game} onSubmit={saveDebrief} onSkip={() => setPendingDebriefFixtureId(null)} />;
      })()}
    </div>
  );
}
