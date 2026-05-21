
"use client";

import React from 'react';
import { ChevronLeft, LogOut, User, Ruler, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import type { UserProfile } from '../GamedayFlow';

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

const heightOptions = Array.from({ length: 25 }).map((_, i) => {
  const totalInches = i + 60;
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'${inches}"`;
});

const weightOptions = Array.from({ length: 41 }).map((_, i) => `${(i * 5) + 100} lbs`);
const ageOptions = Array.from({ length: 14 }).map((_, i) => (i + 12).toString());

export default function Settings({ 
  profile, 
  onBack, 
  onUpdateProfile
}: { 
  profile: UserProfile, 
  onBack: () => void, 
  onUpdateProfile: (data: Partial<UserProfile>) => void
}) {
  const auth = useAuth();

  const handleLogout = async () => {
    if (auth) await signOut(auth);
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-full bg-background animate-in slide-in-from-right-10 duration-500">
      <div className="px-8 pt-12 pb-6 flex items-center gap-4 shrink-0">
        <button onClick={onBack} className="p-3 bg-white/5 rounded-full text-white hover:bg-white/10 transition-all">
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-xl font-headline font-bold uppercase flex-1 tracking-tight text-center pr-10">Settings</h3>
      </div>

      <ScrollArea className="flex-1 px-8">
        <div className="space-y-10 pb-20">
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <User size={14} className="text-primary" />
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Athlete Identity</h4>
            </div>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">Sport</Label>
                <Select value={profile.sport} onValueChange={(val) => onUpdateProfile({ sport: val })}>
                  <SelectTrigger className="h-12 bg-white/5 border-white/10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/20">
                    {Object.keys(SPORT_POSITIONS).map(sport => (
                      <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">Position</Label>
                <Select value={profile.position} onValueChange={(val) => onUpdateProfile({ position: val })}>
                  <SelectTrigger className="h-12 bg-white/5 border-white/10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/20">
                    {(SPORT_POSITIONS[profile.sport] || []).map(pos => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Clock size={14} className="text-primary" />
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Schedule Lockout</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">School Start</Label>
                <Select value={profile.schoolStartTime} onValueChange={(val) => onUpdateProfile({ schoolStartTime: val })}>
                  <SelectTrigger className="h-12 bg-white/5 border-white/10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/20">
                    {TIME_OPTIONS.map(time => (
                      <SelectItem key={time.value} value={time.value}>{time.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">School End</Label>
                <Select value={profile.schoolEndTime} onValueChange={(val) => onUpdateProfile({ schoolEndTime: val })}>
                  <SelectTrigger className="h-12 bg-white/5 border-white/10 text-xs">
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
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Ruler size={14} className="text-primary" />
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Physical Calibration</h4>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">Height</Label>
                <Select value={profile.height || ""} onValueChange={(val) => onUpdateProfile({ height: val })}>
                  <SelectTrigger className="h-10 bg-white/5 border-white/10 text-[10px]">
                    <SelectValue placeholder="--" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/20">
                    {heightOptions.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">Weight</Label>
                <Select value={profile.weight || ""} onValueChange={(val) => onUpdateProfile({ weight: val })}>
                  <SelectTrigger className="h-10 bg-white/5 border-white/10 text-[10px]">
                    <SelectValue placeholder="--" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/20">
                    {weightOptions.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">Age</Label>
                <Select value={profile.age || ""} onValueChange={(val) => onUpdateProfile({ age: val })}>
                  <SelectTrigger className="h-10 bg-white/5 border-white/10 text-[10px]">
                    <SelectValue placeholder="--" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/20">
                    {ageOptions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-white/5 flex flex-col gap-4">
             <Button 
               variant="destructive" 
               className="h-14 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
               onClick={handleLogout}
             >
               <LogOut size={16} /> Logout athlete
             </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
