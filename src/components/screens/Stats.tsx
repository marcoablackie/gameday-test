"use client";

import React, { useMemo, useState } from 'react';
import { Home, Dumbbell, BarChart2, ChevronLeft, Zap, Camera, Trophy, Flame, Ruler } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ScreenState, UserProfile } from '../GamedayFlow';

const RANKS = [
  { name: 'Rookie', minLevel: 1, color: 'text-white/40', bg: 'bg-white/5' },
  { name: 'Prospect', minLevel: 3, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { name: 'Professional', minLevel: 6, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { name: 'Elite Tier', minLevel: 10, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { name: 'Legendary', minLevel: 20, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
];

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
  const currentRank = useMemo(() => [...RANKS].reverse().find(r => profile.level >= r.minLevel) || RANKS[0], [profile.level]);
  const progressToNextLevel = profile.xp % 100;
  const needsCalibration = !profile.height || !profile.weight || !profile.age;
  const targets = useMemo(() => calcMacroTargets(profile), [profile]);

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden animate-in fade-in slide-in-from-right-10 duration-700">
      <div className="px-8 pt-12 pb-6 flex items-center gap-4 shrink-0">
        <button onClick={onBack} className="p-3 bg-white/5 rounded-full text-white hover:bg-white/10 transition-all">
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-xl font-headline font-bold uppercase flex-1 tracking-tight text-center pr-10">Performance Data</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-8 space-y-8 pb-40">
        {needsCalibration ? (
          <div className="bg-primary/5 border border-primary/20 rounded-3xl p-8 space-y-6 animate-in zoom-in duration-500">
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <Ruler size={24} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-headline font-bold uppercase leading-tight tracking-tight">Calibration Required</h2>
              <p className="text-xs text-white/40 font-medium uppercase tracking-widest leading-relaxed">
                Body metrics missing. Sync your physical data to calculate your personalized calorie target.
              </p>
            </div>
            <Button
              onClick={() => onNavClick('settings')}
              className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-black uppercase italic"
            >
              Calibrate Now
            </Button>
          </div>
        ) : (
          <>
            {/* Rank card */}
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
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold uppercase tracking-widest">Level {profile.level}</span>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{profile.xp} XP</p>
                </div>
                <Progress value={progressToNextLevel} className="h-2 bg-white/10" />
              </div>
            </div>

            {/* Personalized calorie target */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Daily Nutrition Targets</h4>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-primary/60">Personalized Target</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-headline font-black text-primary">{targets.calories.toLocaleString()}</span>
                      <span className="text-xs font-bold text-primary/60 uppercase tracking-widest">kcal/day</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                    <Flame size={24} />
                  </div>
                </div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 leading-relaxed">
                  {profile.height} · {profile.weight} · Age {profile.age} · Athlete 1.725×
                </p>
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

            {/* Today's intake */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Today's Intake</h4>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Calories</span>
                    <div className="text-right">
                      <span className="text-xl font-bold">{profile.dailyStats.calories}</span>
                      <span className="text-[10px] text-white/20 ml-1">/ {targets.calories.toLocaleString()} kcal</span>
                    </div>
                  </div>
                  <Progress value={Math.min(100, (profile.dailyStats.calories / targets.calories) * 100)} className="h-1.5 bg-white/10" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/5 rounded-3xl p-5 space-y-2">
                    <p className="text-[8px] font-bold uppercase text-white/30">Protein</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-xl font-bold">{profile.dailyStats.protein}g</p>
                      <p className="text-[8px] text-white/20">/ {targets.protein}g</p>
                    </div>
                    <Progress value={Math.min(100, (profile.dailyStats.protein / targets.protein) * 100)} className="h-1 bg-white/10" />
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-3xl p-5 space-y-2">
                    <p className="text-[8px] font-bold uppercase text-white/30">Sugar</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-xl font-bold">{profile.dailyStats.sugar}g</p>
                      <p className="text-[8px] text-white/20">/ {targets.sugar}g</p>
                    </div>
                    <Progress value={Math.min(100, (profile.dailyStats.sugar / targets.sugar) * 100)} className="h-1 bg-white/10" />
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-3xl p-5 space-y-2">
                    <p className="text-[8px] font-bold uppercase text-white/30">Carbs</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-xl font-bold">{profile.dailyStats.carbs}g</p>
                      <p className="text-[8px] text-white/20">/ {targets.carbs}g</p>
                    </div>
                    <Progress value={Math.min(100, (profile.dailyStats.carbs / targets.carbs) * 100)} className="h-1 bg-white/10" />
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-3xl p-5 space-y-2">
                    <p className="text-[8px] font-bold uppercase text-white/30">Fats</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-xl font-bold">{profile.dailyStats.fats}g</p>
                      <p className="text-[8px] text-white/20">/ {targets.fats}g</p>
                    </div>
                    <Progress value={Math.min(100, (profile.dailyStats.fats / targets.fats) * 100)} className="h-1 bg-white/10" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-28 glass-nav flex items-center justify-around px-4 pb-8 z-30">
        <button onClick={() => onNavClick('dashboard')} className="flex flex-col items-center gap-2 text-white/40 hover:text-white transition-colors">
          <Home size={20} /> <span className="text-[8px] font-bold uppercase tracking-[0.1em]">Schedule</span>
        </button>
        <button onClick={() => onNavClick('drills_library')} className="flex flex-col items-center gap-2 text-white/40 hover:text-white transition-colors">
          <Dumbbell size={20} /> <span className="text-[8px] font-bold uppercase tracking-[0.1em]">Drills</span>
        </button>
        <button onClick={() => onNavClick('quests')} className="flex flex-col items-center gap-2 text-white/40 hover:text-white transition-colors">
          <Zap size={20} /> <span className="text-[8px] font-bold uppercase tracking-[0.1em]">Quest</span>
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
