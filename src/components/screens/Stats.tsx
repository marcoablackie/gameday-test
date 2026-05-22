"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { Home, Dumbbell, BarChart2, ChevronLeft, Zap, Camera, Trophy, Flame, Ruler } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getRank, getRankProgress, getNextRank, RANKS } from '@/lib/rank';
import type { ScreenState, UserProfile } from '../GamedayFlow';

function parseHeightToCm(height: string): number {
  const match = height.match(/(\d+)'(\d*)/);
  if (!match) return 175;
  return (parseInt(match[1]) * 12 + parseInt(match[2] || '0')) * 2.54;
}

function parseWeightLbs(weight: string): number {
  const match = weight.match(/(\d+)/);
  return match ? parseInt(match[1]) : 154;
}

function calcMacroTargets(profile: UserProfile) {
  if (!profile.height || !profile.weight || !profile.age) {
    return { calories: 3000, protein: 180, carbs: 350, fats: 90, sugar: 50, personalized: false };
  }

  const heightCm = parseHeightToCm(profile.height);
  const weightKg = parseWeightLbs(profile.weight) * 0.453592;
  const age = parseInt(profile.age);

  // Mifflin-St Jeor (male) × very-active athlete multiplier
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  const calories = Math.round(bmr * 1.725);

  const weightLbs = parseWeightLbs(profile.weight);
  const protein = Math.round(weightLbs * 0.8);
  const fats = Math.round((calories * 0.25) / 9);
  const carbs = Math.round((calories - protein * 4 - fats * 9) / 4);
  const sugar = Math.round(carbs * 0.1);

  return { calories, protein, carbs, fats, sugar, personalized: true };
}

export default function Stats({
  profile,
  onBack,
  onNavClick
}: {
  profile: UserProfile,
  onBack: () => void,
  onNavClick: (screen: ScreenState) => void
}) {
  const xp = profile.xp ?? 0;
  const currentRank = getRank(xp);
  const nextRank = getNextRank(xp);
  const rankProgress = getRankProgress(xp);
  const needsCalibration = !profile.height || !profile.weight || !profile.age;
  const targets = useMemo(() => calcMacroTargets(profile), [profile]);

  type FoodEntry = { name: string; calories: number; protein: number; carbs: number; fats: number; sugar: number; time: string };
  const [foodLog, setFoodLog] = useState<FoodEntry[]>([]);
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const key = `gameday_food_log_${profile.uid}_${today}`;
    try {
      const stored = localStorage.getItem(key);
      if (stored) setFoodLog(JSON.parse(stored));
    } catch {}
  }, [profile.uid]);

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden animate-in fade-in slide-in-from-right-10 duration-700">
      <div className="px-8 pt-12 pb-6 flex items-center gap-4 shrink-0">
        <button onClick={onBack} className="p-3 bg-white/5 rounded-full text-white hover:bg-white/10 transition-all">
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-xl font-headline font-bold uppercase flex-1 tracking-tight text-center pr-10">Performance Data</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-8 space-y-8 pb-40">

        {/* Rank card — always visible */}
        <div className="relative p-8 rounded-3xl bg-white/5 border border-white/5 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Trophy size={140} />
          </div>
          <div className="flex items-center gap-4 mb-6">
            <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center", currentRank.bg)}>
              <Trophy size={32} className={currentRank.color} />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Current Rank</p>
              <h2 className={cn("text-3xl font-headline font-bold uppercase leading-none tracking-tight", currentRank.color)}>
                {currentRank.name}
              </h2>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{xp} XP</span>
              {nextRank && (
                <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                  {nextRank.minXP - xp} XP to {nextRank.name}
                </span>
              )}
            </div>
            <Progress value={rankProgress} className="h-2 bg-white/10" />
            <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest text-white/20 pt-1">
              {RANKS.map(r => (
                <span key={r.name} className={cn(xp >= r.minXP ? currentRank.color : 'text-white/15')}>
                  {r.name.slice(0, 3)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Calibration prompt — inline, not a blocker */}
        {needsCalibration && (
          <div className="bg-primary/5 border border-primary/15 rounded-2xl p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0">
              <Ruler size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Calibration Missing</p>
              <p className="text-[9px] text-white/30 font-medium uppercase tracking-widest">Add height/weight/age for accurate targets</p>
            </div>
            <Button
              onClick={() => onNavClick('settings')}
              size="sm"
              className="h-9 px-4 text-[9px] font-black uppercase bg-primary text-primary-foreground rounded-xl shrink-0"
            >
              Calibrate
            </Button>
          </div>
        )}

        {/* Nutrition targets — personalized if calibrated, defaults otherwise */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Daily Targets</h4>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[8px] font-black uppercase tracking-widest text-primary/60">
                  {targets.personalized ? 'Personalized Target' : 'Default Target'}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-headline font-black text-primary">{targets.calories.toLocaleString()}</span>
                  <span className="text-xs font-bold text-primary/60 uppercase tracking-widest">kcal/day</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                <Flame size={24} />
              </div>
            </div>
            {targets.personalized && (
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 leading-relaxed">
                {profile.height} · {profile.weight} · Age {profile.age} · Athlete 1.725×
              </p>
            )}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10">
              <div className="text-center space-y-0.5">
                <p className="text-[8px] font-bold uppercase text-white/30 tracking-widest">Protein</p>
                <p className="text-sm font-black text-white">{targets.protein}g</p>
              </div>
              <div className="text-center space-y-0.5">
                <p className="text-[8px] font-bold uppercase text-white/30 tracking-widest">Carbs</p>
                <p className="text-sm font-black text-white">{targets.carbs}g</p>
              </div>
              <div className="text-center space-y-0.5">
                <p className="text-[8px] font-bold uppercase text-white/30 tracking-widest">Fats</p>
                <p className="text-sm font-black text-white">{targets.fats}g</p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's intake — always visible */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Today's Intake</h4>
          </div>

          <div className="space-y-4">
            <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Calories</span>
                <div className="text-right">
                  <span className="text-xl font-bold">{profile.dailyStats?.calories ?? 0}</span>
                  <span className="text-[10px] text-white/20 ml-1">/ {targets.calories.toLocaleString()} kcal</span>
                </div>
              </div>
              <Progress value={Math.min(100, ((profile.dailyStats?.calories ?? 0) / targets.calories) * 100)} className="h-1.5 bg-white/10" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Protein', val: profile.dailyStats?.protein ?? 0, target: targets.protein },
                { label: 'Sugar',   val: profile.dailyStats?.sugar   ?? 0, target: targets.sugar   },
                { label: 'Carbs',   val: profile.dailyStats?.carbs   ?? 0, target: targets.carbs   },
                { label: 'Fats',    val: profile.dailyStats?.fats    ?? 0, target: targets.fats    },
              ].map(({ label, val, target }) => (
                <div key={label} className="bg-white/5 border border-white/5 rounded-3xl p-5 space-y-2">
                  <p className="text-[8px] font-bold uppercase text-white/30">{label}</p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-xl font-bold">{val}g</p>
                    <p className="text-[8px] text-white/20">/ {target}g</p>
                  </div>
                  <Progress value={Math.min(100, (val / (target || 1)) * 100)} className="h-1 bg-white/10" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent scanned foods */}
        {foodLog.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Logged Foods Today</h4>
            </div>
            <div className="space-y-2">
              {[...foodLog].reverse().map((food, i) => (
                <div key={i} className="bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-white/5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate">{food.name}</p>
                    <p className="text-[8px] text-white/30 uppercase tracking-widest font-bold mt-0.5">{food.time}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-black text-primary">{food.calories} kcal</p>
                    <p className="text-[8px] text-white/30 font-bold">{food.protein}g P · {food.carbs}g C · {food.fats}g F</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <div className="absolute bottom-0 left-0 right-0 h-28 glass-nav flex items-center justify-around px-4 pb-8 z-30">
        <button onClick={() => onNavClick('dashboard')} className="flex flex-col items-center gap-2 text-white/40 hover:text-white transition-colors">
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
        <button onClick={() => onNavClick('stats')} className="flex flex-col items-center gap-2 text-white transition-colors">
          <div className="h-1 w-8 bg-primary rounded-full mb-1" />
          <BarChart2 size={20} /> <span className="text-[8px] font-bold uppercase tracking-[0.1em]">Stats</span>
        </button>
      </div>
    </div>
  );
}
