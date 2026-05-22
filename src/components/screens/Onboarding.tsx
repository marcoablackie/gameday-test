"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { UserProfile } from '../GamedayFlow';

const ABILITIES_MAP: Record<string, string[]> = {
  Basketball: ['Speed', 'Shooting', 'Passing', 'Defense', 'IQ', 'Agility'],
  Soccer: ['Stamina', 'Dribbling', 'Passing', 'Tackling', 'Finishing', 'Pace'],
  Football: ['Strength', 'Power', 'Speed', 'Route Running', 'Catching', 'Blocking'],
  Tennis: ['Footwork', 'Serve', 'Forehand', 'Backhand', 'Mental', 'Reaction'],
};

const IMPROVEMENTS_MAP: Record<string, string[]> = {
  Basketball: ['Endurance', 'Ball Handling', 'Rebounding', 'Free Throws', 'Post-up'],
  Soccer: ['Tactical Sense', 'Crosses', 'Weak Foot', 'Heading', 'Set Pieces'],
  Football: ['Explosiveness', 'Vision', 'Technique', 'Flexibility', 'Endurance'],
  Tennis: ['Net Play', 'Second Serve', 'Drop Shots', 'Slice', 'Physicality'],
};

const SPORT_POSITIONS: Record<string, string[]> = {
  Basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
  Soccer: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
  Football: ['Quarterback', 'Running Back', 'Wide Receiver', 'Tight End', 'Lineman', 'Linebacker', 'Defensive Back'],
  Tennis: ['Baseline Player', 'Serve & Volleyer', 'All-Court Player'],
};

const TIME_OPTIONS = Array.from({ length: 24 }).map((_, i) => {
  const hour = i.toString().padStart(2, '0');
  const hNum = i % 12 || 12;
  const ampm = i >= 12 ? 'PM' : 'AM';
  return { value: `${hour}:00`, label: `${hNum}:00 ${ampm}` };
});

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Onboarding({ onNext }: { onNext: (data: UserProfile) => void }) {
  const [profile, setProfile] = useState<UserProfile>({
    uid: '',
    email: '',
    sport: 'Basketball',
    position: 'Point Guard',
    bestAbilities: [],
    areaToImprove: [],
    isOnboarded: false,
    hasAccess: false,
    schoolStartTime: '08:00',
    schoolEndTime: '15:00',
    trainingDays: [],
    trainingTime: '16:00',
    xp: 0,
    level: 1,
    completedActivities: [],
    dailyStats: { calories: 0, protein: 0, carbs: 0, fats: 0, sugar: 0 }
  });

  const availableAbilities = useMemo(() => ABILITIES_MAP[profile.sport] || [], [profile.sport]);
  const availableImprovements = useMemo(() => IMPROVEMENTS_MAP[profile.sport] || [], [profile.sport]);

  useEffect(() => {
    const availablePositions = SPORT_POSITIONS[profile.sport] || [];
    if (!availablePositions.includes(profile.position)) {
      setProfile(p => ({ 
        ...p, 
        position: availablePositions[0] || '', 
        bestAbilities: [], 
        areaToImprove: [] 
      }));
    }
  }, [profile.sport]);

  const toggleDay = (day: string) => {
    setProfile(prev => {
      const current = prev.trainingDays ?? [];
      return {
        ...prev,
        trainingDays: current.includes(day) ? current.filter(d => d !== day) : [...current, day]
      };
    });
  };

  const toggleItem = (list: 'bestAbilities' | 'areaToImprove', item: string) => {
    setProfile(prev => {
      const current = prev[list] as string[];
      if (current.includes(item)) {
        return { ...prev, [list]: current.filter(i => i !== item) };
      } else {
        return { ...prev, [list]: [...current, item] };
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in slide-in-from-right-10 duration-700">
      <div className="px-8 pt-16 pb-6 space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
            <span>Core Analysis</span>
            <span>66%</span>
          </div>
          <Progress value={66} className="h-1 bg-white/10" />
        </div>

        <h1 className="text-4xl font-headline font-black italic uppercase leading-tight tracking-tighter">
          Define Your <br />
          Archetype
        </h1>
      </div>

      <ScrollArea className="flex-1 px-8">
        <div className="space-y-8 pb-12">
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Sport</Label>
            <Select value={profile.sport} onValueChange={(val) => setProfile(p => ({ ...p, sport: val }))}>
              <SelectTrigger className="bg-card border-white/10 h-14 rounded-xl text-md px-4 focus:ring-0">
                <SelectValue placeholder="Sport" />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/20">
                {Object.keys(SPORT_POSITIONS).map(sport => (
                  <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Position</Label>
            <Select value={profile.position} onValueChange={(val) => setProfile(p => ({ ...p, position: val }))}>
              <SelectTrigger className="bg-card border-white/10 h-14 rounded-xl text-md px-4 focus:ring-0">
                <SelectValue placeholder="Position" />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/20">
                {(SPORT_POSITIONS[profile.sport] || []).map(pos => (
                  <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">School Start</Label>
              <Select value={profile.schoolStartTime} onValueChange={(val) => setProfile(p => ({ ...p, schoolStartTime: val }))}>
                <SelectTrigger className="bg-card border-white/10 h-14 rounded-xl text-xs px-4 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/20">
                  {TIME_OPTIONS.map(time => (
                    <SelectItem key={time.value} value={time.value}>{time.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">School End</Label>
              <Select value={profile.schoolEndTime} onValueChange={(val) => setProfile(p => ({ ...p, schoolEndTime: val }))}>
                <SelectTrigger className="bg-card border-white/10 h-14 rounded-xl text-xs px-4 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/20">
                  {TIME_OPTIONS.map(time => (
                    <SelectItem key={time.value} value={time.value}>{time.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Training Days</Label>
            <p className="text-[9px] text-white/30 font-medium uppercase tracking-wider -mt-2">Select days you train — rest days are optimized for recovery</p>
            <div className="flex gap-2 flex-wrap">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={cn(
                    "px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                    (profile.trainingDays ?? []).includes(day)
                      ? "bg-primary border-primary text-primary-foreground scale-105"
                      : "bg-transparent border-white/10 text-muted-foreground hover:border-white/40"
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Preferred Training Time</Label>
            <Select value={profile.trainingTime || '16:00'} onValueChange={(val) => setProfile(p => ({ ...p, trainingTime: val }))}>
              <SelectTrigger className="bg-card border-white/10 h-14 rounded-xl text-xs px-4 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/20">
                {TIME_OPTIONS.map(time => (
                  <SelectItem key={time.value} value={time.value}>{time.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Strengths</Label>
            <div className="flex flex-wrap gap-2">
              {availableAbilities.map(ability => (
                <button
                  key={ability}
                  onClick={() => toggleItem('bestAbilities', ability)}
                  className={cn(
                    "px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all",
                    profile.bestAbilities.includes(ability)
                      ? "bg-primary border-primary text-primary-foreground scale-105"
                      : "bg-transparent border-white/10 text-muted-foreground hover:border-white/40"
                  )}
                >
                  {ability}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Targets</Label>
            <div className="flex flex-wrap gap-2">
              {availableImprovements.map(item => (
                <button
                  key={item}
                  onClick={() => toggleItem('areaToImprove', item)}
                  className={cn(
                    "px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all",
                    profile.areaToImprove.includes(item)
                      ? "bg-primary border-primary text-primary-foreground scale-105"
                      : "bg-transparent border-white/10 text-muted-foreground hover:border-white/40"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="px-8 pb-12 pt-4">
        <Button 
          disabled={profile.bestAbilities.length === 0 || profile.areaToImprove.length === 0}
          onClick={() => onNext(profile)}
          className="w-full h-16 rounded-2xl bg-primary text-primary-foreground text-lg font-bold hover:bg-primary/90 transition-all neon-glow"
        >
          Confirm Profile
        </Button>
      </div>
    </div>
  );
}
