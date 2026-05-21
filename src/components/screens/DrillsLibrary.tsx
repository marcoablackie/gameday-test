"use client";

import React from 'react';
import { Home, Dumbbell, BarChart2, ChevronLeft, Search, Play, Camera, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { ScreenState } from '../GamedayFlow';

export default function DrillsLibrary({
  onBack,
  onNavClick,
  onDrillClick
}: {
  onBack: () => void,
  onNavClick: (screen: ScreenState) => void,
  onDrillClick: (drill: { activity: string, intel: string }) => void
}) {
  const categories = ['Position Specific', 'Conditioning', 'IQ & Strategy', 'Strength'];
  const drills = [
    { title: 'Lateral Quickness', duration: '10 min', cat: 'Conditioning', intel: 'Maintain a low center of gravity. Use 5-yard explosive lateral bursts with active hands. 3 sets of 10 reps.' },
    { title: 'Decision Making Under Pressure', duration: '15 min', cat: 'IQ & Strategy', intel: 'Visualize 3 standard defensive traps. Mentally simulate the pass lane response for each within 0.5 seconds.' },
    { title: 'Explosive Start', duration: '12 min', cat: 'Conditioning', intel: 'From a dead stop, 10-yard sprints focusing on the first 3 steps. Maximal triple extension.' },
    { title: 'Fundamental Mechanics', duration: '20 min', cat: 'Position Specific', intel: 'Slow motion breakdown of your primary movement. Record your form and check for bio-mechanical efficiency.' },
  ];

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500 ease-out">
      <div className="px-6 pt-10 pb-4 flex items-center gap-4 shrink-0">
        <button onClick={onBack} className="p-3 rounded-full bg-white/5 border border-white/10 text-white active:scale-90 transition-all">
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-xl font-headline font-black italic uppercase flex-1">Drill Library</h3>
      </div>

      <div className="px-6 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input className="pl-10 bg-white/5 border-none h-12 rounded-xl text-white placeholder:text-white/20 italic" placeholder="Search intel..." />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-32">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button key={cat} className="whitespace-nowrap px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest text-white/40 hover:text-primary transition-colors italic">
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {drills.map((drill, idx) => (
            <div
              key={idx}
              onClick={() => onDrillClick({ activity: drill.title, intel: drill.intel })}
              className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-4 group hover:bg-white/10 transition-all cursor-pointer active:scale-[0.98]"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                <Play size={16} className="fill-current" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black uppercase italic tracking-wider group-hover:text-primary transition-colors">{drill.title}</p>
                <p className="text-[8px] text-white/40 uppercase font-black tracking-[0.2em]">{drill.cat} • {drill.duration}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-28 glass-nav flex items-center justify-around px-4 pb-8 z-30">
        <button onClick={() => onNavClick('dashboard')} className="flex flex-col items-center gap-2 text-white/40 hover:text-white transition-colors">
          <Home size={20} /> <span className="text-[8px] font-bold uppercase tracking-[0.1em]">Daily</span>
        </button>
        <button onClick={() => onNavClick('drills_library')} className="flex flex-col items-center gap-2 text-white transition-colors">
          <div className="h-1 w-8 bg-primary rounded-full mb-1" />
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
