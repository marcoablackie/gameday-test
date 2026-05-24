"use client";

import React, { useEffect, useState } from 'react';

const STATS = [
  { label: 'Distance',      arg: '113.2 km', fra: '115.7 km', argWin: false },
  { label: 'Sprints',       arg: '147',      fra: '138',      argWin: true  },
  { label: 'Duels Won',     arg: '68%',      fra: '54%',      argWin: true  },
  { label: 'Passes',        arg: '324',      fra: '389',      argWin: false },
  { label: 'xG',            arg: '2.8',      fra: '2.1',      argWin: true  },
];

export default function MatchIntroSplash({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'score' | 'stats' | 'cta'>('score');
  const [visibleStats, setVisibleStats] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('stats'), 1200);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (phase !== 'stats') return;
    if (visibleStats >= STATS.length) {
      const t = setTimeout(() => setPhase('cta'), 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisibleStats(v => v + 1), 280);
    return () => clearTimeout(t);
  }, [phase, visibleStats]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black animate-in fade-in duration-500 cursor-pointer"
      onClick={onDone}
    >
      {/* Header */}
      <div className="flex flex-col items-center pt-16 pb-6 px-8">
        <p className="text-[8px] font-black uppercase tracking-[0.45em] text-white/30 mb-2">
          FIFA World Cup · Qatar 2022 · Final
        </p>
        <p
          className="text-[10px] font-black uppercase tracking-[0.5em] text-primary animate-in fade-in duration-700"
          style={{ animationDelay: '200ms' }}
        >
          Full Time
        </p>
      </div>

      {/* Score block */}
      <div className="flex items-center justify-center gap-6 px-8 pb-8">
        {/* ARG */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="text-4xl leading-none">🇦🇷</div>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/70">Argentina</p>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-3">
            <span className="text-6xl font-black text-white leading-none">3</span>
            <span className="text-2xl font-black text-white/30 leading-none">—</span>
            <span className="text-6xl font-black text-white/40 leading-none">3</span>
          </div>
          <p className="text-[8px] font-black uppercase tracking-widest text-white/25">AET · ARG win 4–2 pens</p>
        </div>

        {/* FRA */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="text-4xl leading-none">🇫🇷</div>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/70">France</p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-8 h-px bg-white/8 mb-6" />

      {/* Stats */}
      <div className="flex-1 px-8 space-y-0">
        <p className="text-[8px] font-black uppercase tracking-[0.45em] text-white/25 mb-5 text-center">
          Performance Analysis
        </p>

        {/* Column headers */}
        <div className="flex items-center mb-3">
          <span className="flex-1 text-right text-[8px] font-black uppercase tracking-wider text-primary/60 pr-4">ARG</span>
          <span className="w-28 text-center text-[7px] font-black uppercase tracking-widest text-white/20"></span>
          <span className="flex-1 text-left text-[8px] font-black uppercase tracking-wider text-white/30 pl-4">FRA</span>
        </div>

        {STATS.map((s, i) => (
          <div
            key={s.label}
            className="flex items-center py-2.5 border-b border-white/5 transition-all duration-300"
            style={{ opacity: visibleStats > i ? 1 : 0, transform: visibleStats > i ? 'translateY(0)' : 'translateY(6px)' }}
          >
            {/* ARG value */}
            <span className={`flex-1 text-right pr-4 text-[13px] font-black tabular-nums ${s.argWin ? 'text-white' : 'text-white/35'}`}>
              {s.arg}
            </span>

            {/* Stat label */}
            <span className="w-28 text-center text-[7px] font-black uppercase tracking-widest text-white/25">
              {s.label}
            </span>

            {/* FRA value */}
            <span className={`flex-1 text-left pl-4 text-[13px] font-black tabular-nums ${!s.argWin ? 'text-white/70' : 'text-white/25'}`}>
              {s.fra}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div
        className="px-8 pb-16 pt-8 flex flex-col items-center gap-4 transition-all duration-500"
        style={{ opacity: phase === 'cta' ? 1 : 0, transform: phase === 'cta' ? 'translateY(0)' : 'translateY(10px)' }}
      >
        <div className="h-px w-full bg-white/8 mb-2" />
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 text-center">
          Track your match-day performance
        </p>
        <div className="flex items-center gap-2 px-7 py-4 rounded-[2rem] bg-primary text-black">
          <span className="text-[11px] font-black uppercase tracking-[0.3em]">Get Started</span>
        </div>
        <p className="text-[7px] uppercase tracking-widest text-white/15 font-black">Tap anywhere to continue</p>
      </div>
    </div>
  );
}
