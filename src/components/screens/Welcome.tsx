"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import GamedayLogo from '@/components/GamedayLogo';

export default function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col h-full px-8 pt-24 pb-12 bg-background animate-in fade-in duration-1000">
      <div className="flex-1 space-y-16">
        <div className="space-y-8">
          <div className="relative inline-block">
            <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl opacity-60" />
            <GamedayLogo className="relative" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-7xl font-headline font-black italic uppercase leading-[0.85] tracking-tighter">
              OUTWORK <br />
              EVERYONE
            </h1>
            <div className="flex items-center gap-3">
               <ShieldCheck size={14} className="text-primary" />
               <p className="text-primary/40 text-[10px] font-black uppercase tracking-[0.4em] italic">
                 SYSTEM PROTOCOL v1.0
               </p>
            </div>
          </div>
          
          <p className="text-white/60 text-xl font-medium leading-tight max-w-[300px] italic">
            Professional optimization for the high-stakes elite.
          </p>
        </div>

        <div className="space-y-10 pt-10 border-t border-white/5">
          <div className="flex items-start gap-6">
            <div className="h-1 bg-primary w-8 mt-3 shrink-0 rounded-full" />
            <div className="space-y-1">
              <p className="font-black italic uppercase text-sm tracking-widest">Hyper-Specific</p>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-widest italic">Position Calibration Enabled.</p>
            </div>
          </div>
          <div className="flex items-start gap-6">
            <div className="h-1 bg-white/10 w-8 mt-3 shrink-0 rounded-full" />
            <div className="space-y-1">
              <p className="font-black italic uppercase text-sm tracking-widest text-white/40">Zero Compromise</p>
              <p className="text-[10px] text-white/20 font-black uppercase tracking-widest italic">Pantry Staples Only.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Button 
          onClick={onNext}
          className="w-full h-16 rounded-[2rem] bg-primary text-primary-foreground text-lg font-black uppercase italic hover:bg-white/90 group transition-all neon-glow"
        >
          Initialize Protocol
          <ArrowRight size={22} className="ml-3 group-hover:translate-x-2 transition-transform" />
        </Button>
        <p className="text-[9px] text-center text-white/20 uppercase font-black tracking-[0.5em] italic">
          Biometric Sync Required
        </p>
      </div>
    </div>
  );
}