"use client";

import React, { useState, useMemo } from 'react';
import { Home, Dumbbell, BarChart2, ChevronLeft, Search, Play, Camera, Zap, Shuffle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { ScreenState } from '../GamedayFlow';
import { getDailyDrills, getSportConfig, type DrillTemplate } from '@/lib/sports-config';
import { cn } from '@/lib/utils';

const CATEGORIES = ['All', 'Position Specific', 'Conditioning', 'IQ & Strategy', 'Strength', 'Skills'] as const;

export default function DrillsLibrary({
  onBack,
  onNavClick,
  onDrillClick,
  sport = 'Soccer',
}: {
  onBack: () => void;
  onNavClick: (screen: ScreenState) => void;
  onDrillClick: (drill: { activity: string; intel: string }) => void;
  sport?: string;
}) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [query, setQuery] = useState('');

  const dailyDrills = useMemo(() => getDailyDrills(sport, 8), [sport]);
  const allDrills = useMemo(() => getSportConfig(sport).drills, [sport]);

  const filtered = useMemo(() => {
    let list: DrillTemplate[] = activeCategory === 'All' ? dailyDrills : allDrills.filter(d => d.category === activeCategory);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = allDrills.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.intel.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeCategory, query, dailyDrills, allDrills]);

  const sectionLabel = query.trim()
    ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`
    : activeCategory === 'All'
    ? "Today's Drills"
    : activeCategory;

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500 ease-out">
      <div className="px-6 pt-10 pb-4 flex items-center gap-4 shrink-0">
        <button onClick={onBack} className="p-3 rounded-full bg-white/5 border border-white/10 text-white active:scale-90 transition-all">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
          <h3 className="text-xl font-headline font-black italic uppercase leading-tight">Drill Library</h3>
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">{sport}</p>
        </div>
        {activeCategory === 'All' && !query && (
          <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-primary/60">
            <Shuffle size={10} /> Daily
          </div>
        )}
      </div>

      <div className="px-6 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-10 bg-white/5 border-none h-12 rounded-xl text-white placeholder:text-white/20 italic"
            placeholder="Search drills..."
          />
        </div>
      </div>

      {!query && (
        <div className="px-6 pb-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "whitespace-nowrap px-4 py-2 rounded-full border text-[8px] font-black uppercase tracking-widest transition-colors italic",
                  activeCategory === cat
                    ? "bg-primary border-primary text-black"
                    : "bg-white/5 border-white/10 text-white/40 hover:text-primary"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 pb-32">
        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-3">{sectionLabel}</p>
        <div className="space-y-3">
          {filtered.map((drill, idx) => (
            <div
              key={idx}
              onClick={() => onDrillClick({ activity: drill.title, intel: drill.intel })}
              className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-4 group hover:bg-white/10 transition-all cursor-pointer active:scale-[0.98]"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-colors shrink-0">
                <Play size={16} className="fill-current" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black uppercase italic tracking-wider group-hover:text-primary transition-colors truncate">{drill.title}</p>
                <p className="text-[8px] text-white/40 uppercase font-black tracking-[0.2em]">{drill.category} • {drill.duration}</p>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-white/30 text-xs py-12">No drills found</p>
          )}
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
