"use client";

import React from 'react';

export default function GamedayLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ''}`}>
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        {/* Stopwatch body */}
        <circle cx="17" cy="21" r="12" fill="#111" stroke="#2a2a2a" strokeWidth="1.5" />
        {/* Crown + button */}
        <rect x="14" y="6" width="6" height="2.5" rx="1.25" fill="#2a2a2a" />
        <rect x="15.5" y="4" width="3" height="3" rx="0.75" fill="#333" />
        {/* Clock hands */}
        <line x1="17" y1="21" x2="17" y2="14" stroke="#3a3a3a" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="17" y1="21" x2="22" y2="21" stroke="#3a3a3a" strokeWidth="1.5" strokeLinecap="round" />
        {/* Neon chevrons */}
        <path d="M7 13 L15 21 L7 29" stroke="#39FF14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M13 13 L21 21 L13 29" stroke="#39FF14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.45" />
      </svg>

      <div className="flex flex-col leading-none">
        <span
          className="font-black italic uppercase text-white tracking-tight"
          style={{ fontSize: 15, letterSpacing: '-0.01em' }}
        >
          GAMEDAY
        </span>
        <span
          className="font-black italic uppercase tracking-widest"
          style={{ fontSize: 9, color: '#39FF14', letterSpacing: '0.18em' }}
        >
          PRO
        </span>
      </div>
    </div>
  );
}
