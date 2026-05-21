"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { generatePersonalizedTrainingPlan, type GeneratePersonalizedTrainingPlanOutput } from '@/ai/flows/generate-personalized-training-plan';
import { Home, Dumbbell, Utensils, BarChart2, Play, ChevronRight, Clock, Moon, Flame, Camera, RefreshCcw, AlertCircle, GraduationCap, Zap, CheckCircle2, Circle, XCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDocViaRest } from '@/firebase/firestore/rest-fetch';
import { setDocViaRest } from '@/firebase/firestore/rest-write';
import { cn } from '@/lib/utils';
import type { UserProfile, ScreenState } from '../GamedayFlow';

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

export default function Dashboard({ 
  profile, 
  onActivityClick,
  onNavClick
}: { 
  profile: UserProfile, 
  onActivityClick: (item: any) => void,
  onNavClick: (screen: ScreenState) => void
}) {
  const db = useFirestore();
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
        recentFeedback: profile.lastFeedback
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

  const sortedSchedule = useMemo(() => {
    if (!plan) return [];
    
    const withMeta = plan.schedule.map((it) => ({ 
      ...it, 
      isCompleted: profile.completedActivities?.includes(it.activity),
      isPast: currentTime > it.time
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

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden animate-in fade-in duration-700">
      <div className="px-6 pt-12 pb-4 flex justify-between items-center shrink-0">
        <h3 className="text-xl font-headline font-bold uppercase tracking-tight">Daily Schedule</h3>
        <button onClick={() => onNavClick('settings')} className="relative group">
          <Avatar className="h-10 w-10 border border-white/10 grayscale hover:grayscale-0 transition-all cursor-pointer">
            <AvatarImage src={avatar?.imageUrl} />
            <AvatarFallback>PRO</AvatarFallback>
          </Avatar>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-32">
        <div className="bg-white/5 rounded-3xl p-6 border border-white/5 flex flex-col items-center text-center space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary italic">Today's Focus</p>
          <h2 className="text-2xl font-headline font-bold uppercase tracking-tight leading-none">
            {loading ? "Syncing..." : plan?.dailyFocusTitle || "Awaiting Protocol"}
          </h2>
          <Button onClick={() => fetchPlan(true)} variant="ghost" className="h-6 p-0 text-[8px] font-bold uppercase tracking-widest text-white/20 hover:text-white flex items-center gap-1">
            <RefreshCcw size={10} className={cn(loading && "animate-spin")} /> Refresh Protocol
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Timeline</h4>
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">{formatTo12h(currentTime)}</span>
          </div>
          
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
            <div className="space-y-4">
              {sortedSchedule.map((item, idx) => {
                const isCurrent = item.isCurrent;
                const isPast = item.isPast;
                const isCompleted = item.isCompleted;
                const canClick = item.type === 'training' || item.type === 'nutrition';

                return (
                  <button 
                    key={idx} 
                    disabled={!canClick}
                    onClick={() => onActivityClick(item)}
                    className={cn(
                      "w-full text-left relative group border transition-all duration-300 rounded-2xl p-5 flex flex-col gap-3 overflow-hidden",
                      isCurrent ? "bg-white border-white scale-[1.02] active-protocol-pulse" : "bg-white/5 border-white/5",
                      isPast && !isCompleted ? "opacity-30 grayscale" : "opacity-100",
                      canClick && "cursor-pointer active:scale-[0.98]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <div className={cn("px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest flex items-center gap-1.5", isCurrent ? "bg-black text-white" : "bg-white/10 text-white/40")}>
                            {getTypeIcon(item.type)}
                            {item.type}
                         </div>
                         <p className={cn("text-[10px] font-bold uppercase tracking-widest", isCurrent ? "text-black/40" : "text-white/20")}>
                            {formatTo12h(item.time)}
                         </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCompleted ? (
                          <div className={cn("h-6 w-6 rounded-full flex items-center justify-center", isCurrent ? "bg-emerald-600 text-white" : "bg-emerald-500/20 text-emerald-500")}>
                            <CheckCircle2 size={16} />
                          </div>
                        ) : isPast ? (
                          <div className={cn("h-6 w-6 rounded-full flex items-center justify-center", isCurrent ? "text-destructive" : "text-destructive/20")}>
                            <XCircle size={16} />
                          </div>
                        ) : (
                          <div className={cn("h-6 w-6 rounded-full border flex items-center justify-center", isCurrent ? "border-black/10" : "border-white/10")}>
                             {isCurrent ? <div className="h-2 w-2 rounded-full bg-black animate-pulse" /> : <Circle size={12} className="opacity-10" />}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className={cn("text-xl font-headline font-bold uppercase leading-none tracking-tight", isCurrent ? "text-black" : "text-white", isCompleted && !isCurrent && "text-white/40")}>
                          {item.activity}
                        </h4>
                        {isCurrent && !isCompleted && (
                          <p className="text-[9px] font-bold uppercase text-black/50 tracking-widest italic">Active Protocol</p>
                        )}
                        {isPast && !isCompleted && !isCurrent && (
                          <p className="text-[8px] font-bold uppercase text-destructive/40 tracking-widest italic">Missed</p>
                        )}
                      </div>
                      {canClick && <ChevronRight size={18} className={isCurrent ? "text-black/30" : "text-white/10"} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 left-0 right-0 h-24 glass-nav flex items-center justify-around px-4 pb-4 z-30">
        <button onClick={() => onNavClick('dashboard')} className="flex flex-col items-center gap-1 text-white">
          <div className="h-0.5 w-6 bg-primary rounded-full mb-1" />
          <Home size={18} /> <span className="text-[7px] font-bold uppercase tracking-widest">Schedule</span>
        </button>
        <button onClick={() => onNavClick('drills_library')} className="flex flex-col items-center gap-1 text-white/30 hover:text-white transition-colors">
          <Dumbbell size={18} /> <span className="text-[7px] font-bold uppercase tracking-widest">Drills</span>
        </button>
        <button onClick={() => onNavClick('quests')} className="flex flex-col items-center gap-1 text-white/30 hover:text-white transition-colors">
          <Zap size={18} /> <span className="text-[7px] font-bold uppercase tracking-widest">Bonus</span>
        </button>
        <button onClick={() => onNavClick('food_tracker')} className="flex flex-col items-center gap-1 text-white/30 hover:text-white transition-colors">
          <Camera size={18} /> <span className="text-[7px] font-bold uppercase tracking-widest">Scanner</span>
        </button>
        <button onClick={() => onNavClick('stats')} className="flex flex-col items-center gap-1 text-white/30 hover:text-white transition-colors">
          <BarChart2 size={18} /> <span className="text-[7px] font-bold uppercase tracking-widest">Stats</span>
        </button>
      </div>
    </div>
  );
}
