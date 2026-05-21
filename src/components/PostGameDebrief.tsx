"use client";

import React, { useState } from 'react';
import { Trophy, ChevronRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GameFixture } from '@/ai/flows/extract-fixtures';

type Props = {
  game: GameFixture & { id: string };
  onSubmit: (debrief: GameDebrief) => void;
  onSkip: () => void;
};

export type GameDebrief = {
  result: 'win' | 'loss' | 'draw';
  goalsFor: number;
  goalsAgainst: number;
  wentWell: string;
  toImprove: string;
  rating: number;
};

const RATINGS = [1, 2, 3, 4, 5];

export default function PostGameDebrief({ game, onSubmit, onSkip }: Props) {
  const [step, setStep] = useState<'result' | 'refl' | 'rating'>('result');
  const [result, setResult] = useState<'win' | 'loss' | 'draw' | null>(null);
  const [goalsFor, setGoalsFor] = useState('');
  const [goalsAgainst, setGoalsAgainst] = useState('');
  const [wentWell, setWentWell] = useState('');
  const [toImprove, setToImprove] = useState('');
  const [rating, setRating] = useState(0);

  const handleSubmit = () => {
    onSubmit({
      result: result!,
      goalsFor: parseInt(goalsFor) || 0,
      goalsAgainst: parseInt(goalsAgainst) || 0,
      wentWell,
      toImprove,
      rating,
    });
  };

  const gameDate = new Date(game.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-background border-t border-white/10 rounded-t-3xl px-6 pt-6 pb-10 space-y-6 animate-in slide-in-from-bottom-4 duration-500">

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <Trophy size={10} className="text-primary" />
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary">Post-Game Debrief</span>
          </div>
          <h3 className="text-xl font-headline font-black uppercase tracking-tight">vs {game.opponent}</h3>
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">{gameDate}</p>
        </div>

        {/* Step: Result */}
        {step === 'result' && (
          <div className="space-y-4">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 text-center">How did it go?</p>
            <div className="grid grid-cols-3 gap-3">
              {(['win', 'draw', 'loss'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setResult(r)}
                  className={cn(
                    "h-14 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all",
                    result === r
                      ? r === 'win' ? "bg-emerald-500 border-emerald-500 text-white" : r === 'loss' ? "bg-destructive border-destructive text-white" : "bg-white/20 border-white/20 text-white"
                      : "bg-white/5 border-white/10 text-white/40"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Your Goals</p>
                <input
                  type="number"
                  value={goalsFor}
                  onChange={e => setGoalsFor(e.target.value)}
                  placeholder="0"
                  className="w-full h-12 rounded-xl bg-white/5 border border-white/10 text-white text-center text-lg font-black focus:outline-none focus:border-white/30"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Their Goals</p>
                <input
                  type="number"
                  value={goalsAgainst}
                  onChange={e => setGoalsAgainst(e.target.value)}
                  placeholder="0"
                  className="w-full h-12 rounded-xl bg-white/5 border border-white/10 text-white text-center text-lg font-black focus:outline-none focus:border-white/30"
                />
              </div>
            </div>
            <Button
              onClick={() => setStep('refl')}
              disabled={!result}
              className="w-full h-12 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest"
            >
              Next <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        )}

        {/* Step: Reflection */}
        {step === 'refl' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-[8px] font-black uppercase tracking-widest text-white/40">What did you do well?</p>
              <textarea
                value={wentWell}
                onChange={e => setWentWell(e.target.value)}
                placeholder="e.g. First touch was clean, won headers..."
                rows={3}
                className="w-full rounded-xl bg-white/5 border border-white/10 text-white text-xs p-3 focus:outline-none focus:border-white/30 placeholder:text-white/20 resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-[8px] font-black uppercase tracking-widest text-white/40">What do you want to improve?</p>
              <textarea
                value={toImprove}
                onChange={e => setToImprove(e.target.value)}
                placeholder="e.g. Need to press higher, better positioning..."
                rows={3}
                className="w-full rounded-xl bg-white/5 border border-white/10 text-white text-xs p-3 focus:outline-none focus:border-white/30 placeholder:text-white/20 resize-none"
              />
            </div>
            <Button
              onClick={() => setStep('rating')}
              disabled={!wentWell && !toImprove}
              className="w-full h-12 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest"
            >
              Next <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        )}

        {/* Step: Rating */}
        {step === 'rating' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 text-center">Rate your personal performance</p>
              <div className="flex justify-center gap-3">
                {RATINGS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRating(r)}
                    className="transition-transform active:scale-90"
                  >
                    <Star
                      size={32}
                      className={cn(
                        "transition-colors",
                        r <= rating ? "text-primary fill-primary" : "text-white/10"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0}
              className="w-full h-12 rounded-2xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest neon-glow"
            >
              Save Debrief
            </Button>
          </div>
        )}

        <button onClick={onSkip} className="w-full text-center text-[8px] font-bold uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors">
          Skip for now
        </button>
      </div>
    </div>
  );
}
