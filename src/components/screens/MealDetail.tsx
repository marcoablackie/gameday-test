"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Utensils, Clock, ShoppingCart, CheckCircle2, X, Loader2, ChevronRight } from 'lucide-react';

function parseSteps(intel: string): string[] {
  const byNumber = intel.split(/(?<!\w)(?:\d+[.)]\s+|Step\s+\d+[.:]\s*)/i).filter(s => s.trim().length > 0);
  if (byNumber.length > 1) return byNumber.map(s => s.trim());
  return intel.split(/\.\s+(?=[A-Z])/).map(s => s.trim()).filter(s => s.length > 0);
}
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';

const FEEDBACK_OPTIONS = [
  { key: 'heavy',   emoji: '😵', label: 'Heavy',    color: 'border-red-500/30 text-red-400 hover:bg-red-500/10' },
  { key: 'perfect', emoji: '⚡', label: 'Perfect',  color: 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10' },
  { key: 'hungry',  emoji: '😤', label: 'Hungry',   color: 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10' },
] as const;

type AltMeal = {
  name: string;
  steps: string[];
  kcal: number;
  protein: number;
  carbs: number;
  fats: number;
};

export default function MealDetail({
  onBack,
  item,
  onComplete,
  isCompleted,
  sport,
  position,
}: {
  onBack: () => void;
  item: { activity: string; intel: string; ingredients?: string[] };
  onComplete: (name: string) => void;
  isCompleted: boolean;
  sport?: string;
  position?: string;
}) {
  const [feedbackGiven, setFeedbackGiven] = useState<string | null>(null);
  const { user } = useUser();
  const db = useFirestore();

  // "Can't make this?" flow
  const [showCantHave, setShowCantHave] = useState(false);
  const [cantReason, setCantReason] = useState<'ingredients' | null>(null);
  const [availIngredients, setAvailIngredients] = useState('');
  const [altMeal, setAltMeal] = useState<AltMeal | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleFeedback = async (key: string) => {
    setFeedbackGiven(key);
    if (!user || !db) return;
    const today = new Date().toISOString().split('T')[0];
    const ref = doc(db, 'users', user.uid, 'meal_feedback', today);
    await setDoc(
      ref,
      { [item.activity]: { feeling: key, timestamp: new Date().toISOString() } },
      { merge: true },
    ).catch(console.error);
  };

  const generateAlt = async () => {
    if (!availIngredients.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/alt-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: availIngredients,
          mealName: item.activity,
          sport,
          position,
        }),
      });
      const data = await res.json();
      if (!data.error) setAltMeal(data);
    } catch {}
    setGenerating(false);
  };

  const resetCantHave = () => {
    setShowCantHave(false);
    setCantReason(null);
    setAvailIngredients('');
    setAltMeal(null);
    setGenerating(false);
  };

  return (
    <div className="flex flex-col h-full bg-background animate-in slide-in-from-right-8 duration-500">
      <div className="px-6 pt-10 pb-4 flex items-center gap-4 shrink-0">
        <button onClick={onBack} className="p-3 rounded-full bg-white/5 border border-white/10 active:scale-90 transition-all">
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-lg font-headline font-black italic uppercase flex-1 text-center pr-10">Fuel Intel</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-36">
        <div className="h-40 w-full bg-white/5 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-primary/40 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent)]" />
          <Utensils size={48} className="relative z-10" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-4 italic relative z-10">Common Pantry Prep</p>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-headline font-black italic uppercase tracking-tighter leading-none">{item.activity}</h1>
          <div className="flex gap-2">
            <Badge className="bg-white/5 text-white/40 border-none px-3 py-1.5 flex items-center gap-2 font-black uppercase tracking-widest text-[8px]">
              <Clock size={10} /> 5 Min Prep
            </Badge>
            <Badge className="bg-white/5 text-white/40 border-none px-3 py-1.5 flex items-center gap-2 font-black uppercase tracking-widest text-[8px]">
              <ShoppingCart size={10} /> Basic Staples
            </Badge>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Preparation Steps</p>
          <div className="space-y-2">
            {parseSteps(item.intel).map((step, i) => (
              <div key={i} className="flex items-start gap-4 bg-white/5 border border-white/8 rounded-2xl px-4 py-3.5">
                <span className="text-primary font-black text-sm shrink-0 w-5 mt-0.5">{i + 1}.</span>
                <p className="text-sm leading-relaxed text-white/80 font-medium">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {item.ingredients && item.ingredients.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">Required Staples</p>
            <div className="grid grid-cols-1 gap-2">
              {item.ingredients.map((ing, i) => (
                <div key={i} className="bg-white/5 p-3 rounded-xl flex items-center gap-3 border border-white/5">
                  <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                  <span className="text-xs font-black italic text-white/70 uppercase">{ing}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-gradient-to-t from-background via-background/95 to-transparent space-y-3">
        {/* Feedback chips — visible once logged */}
        {isCompleted && !feedbackGiven && (
          <div className="animate-in slide-in-from-bottom-3 duration-400 space-y-2">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30 text-center">
              How did your body feel?
            </p>
            <div className="flex gap-2">
              {FEEDBACK_OPTIONS.map(({ key, emoji, label, color }) => (
                <button
                  key={key}
                  onClick={() => handleFeedback(key)}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all active:scale-95",
                    color,
                  )}
                >
                  {emoji} {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {isCompleted && feedbackGiven && (
          <p className="text-[8px] font-black uppercase tracking-widest text-center text-white/20 animate-in fade-in duration-500">
            Feedback saved ✓
          </p>
        )}

        <Button
          onClick={() => !isCompleted && onComplete(item.activity)}
          disabled={isCompleted}
          className={cn(
            "w-full h-14 rounded-xl text-md font-black uppercase italic transition-all duration-300",
            isCompleted ? "bg-white/10 text-white/40" : "bg-primary text-primary-foreground neon-glow",
          )}
        >
          {isCompleted ? <><CheckCircle2 size={20} className="mr-2" /> Logged</> : 'Log Fuel Intake'}
        </Button>

        {!isCompleted && (
          <button
            onClick={() => setShowCantHave(true)}
            className="w-full h-11 rounded-xl border border-white/15 text-[11px] font-black uppercase tracking-widest text-white/50 hover:border-white/30 hover:text-white/70 transition-all active:scale-95"
          >
            Can&apos;t make this?
          </button>
        )}
      </div>

      {/* Bottom sheet overlay */}
      {showCantHave && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={resetCantHave} />
          <div className="relative bg-background border-t border-white/10 rounded-t-3xl px-6 pt-6 pb-10 space-y-5 animate-in slide-in-from-bottom-8 duration-300">

            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black uppercase italic tracking-widest">Why couldn&apos;t you have this?</h4>
              <button onClick={resetCantHave} className="p-2 rounded-full bg-white/5 active:scale-90 transition-all">
                <X size={16} />
              </button>
            </div>

            {!cantReason && (
              <button
                onClick={() => setCantReason('ingredients')}
                className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-4 py-4 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🥫</span>
                  <span className="text-sm font-black uppercase italic tracking-wider">Didn&apos;t have the ingredients</span>
                </div>
                <ChevronRight size={16} className="text-white/30" />
              </button>
            )}

            {cantReason === 'ingredients' && !altMeal && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                  What do you have available?
                </p>
                <textarea
                  value={availIngredients}
                  onChange={e => setAvailIngredients(e.target.value)}
                  placeholder="e.g. eggs, bread, banana, peanut butter..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/20 resize-none focus:outline-none focus:border-primary/50 font-medium"
                />
                <Button
                  onClick={generateAlt}
                  disabled={!availIngredients.trim() || generating}
                  className="w-full h-12 rounded-xl font-black uppercase italic bg-primary text-primary-foreground neon-glow disabled:opacity-40"
                >
                  {generating ? (
                    <><Loader2 size={16} className="mr-2 animate-spin" /> Generating...</>
                  ) : (
                    <>Make Me Something <ChevronRight size={16} className="ml-1" /></>
                  )}
                </Button>
              </div>
            )}

            {altMeal && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Your Alternative</p>
                  <div className="flex gap-2 text-[9px] font-black uppercase tracking-wider text-white/30">
                    <span>{altMeal.kcal}kcal</span>
                    <span>·</span>
                    <span>{altMeal.protein}g P</span>
                    <span>·</span>
                    <span>{altMeal.carbs}g C</span>
                  </div>
                </div>

                <h5 className="text-lg font-headline font-black italic uppercase tracking-tight">{altMeal.name}</h5>

                <div className="space-y-2">
                  {altMeal.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white/5 border border-white/8 rounded-2xl px-4 py-3">
                      <span className="text-primary font-black text-sm shrink-0 w-5 mt-0.5">{i + 1}.</span>
                      <p className="text-sm leading-relaxed text-white/80 font-medium">{step}</p>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => { onComplete(altMeal.name); resetCantHave(); }}
                  className="w-full h-12 rounded-xl font-black uppercase italic bg-primary text-primary-foreground neon-glow"
                >
                  <CheckCircle2 size={16} className="mr-2" /> Had This Instead
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
