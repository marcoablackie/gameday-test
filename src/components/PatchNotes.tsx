"use client";

import React from 'react';
import { PATCH_NOTES, CURRENT_VERSION } from '@/lib/patch-notes';
import { CheckCircle2, Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PatchNotes({ onDismiss }: { onDismiss: () => void }) {
  const latest = PATCH_NOTES[0];

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-background border-t border-white/10 rounded-t-3xl p-6 space-y-5 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap size={12} className="text-primary" />
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">What's New</p>
            </div>
            <h3 className="text-2xl font-headline font-black uppercase tracking-tight leading-none">
              Version {CURRENT_VERSION}
            </h3>
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">{latest.date}</p>
          </div>
          <button onClick={onDismiss} className="p-2 rounded-full bg-white/5 text-white/40 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2.5">
          {latest.changes.map((change, i) => (
            <div key={i} className="flex items-start gap-3">
              <CheckCircle2 size={14} className="text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-white/70 font-medium leading-snug">{change}</p>
            </div>
          ))}
        </div>

        <Button
          onClick={onDismiss}
          className="w-full h-12 rounded-2xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest neon-glow"
        >
          Let's Go
        </Button>
      </div>
    </div>
  );
}
