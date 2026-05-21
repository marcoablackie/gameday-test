"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Utensils, Clock, Flame, CheckCircle2, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function MealDetail({ 
  onBack, 
  item,
  onComplete,
  isCompleted
}: { 
  onBack: () => void, 
  item: { activity: string, intel: string, ingredients?: string[] },
  onComplete: (name: string) => void,
  isCompleted: boolean
}) {
  return (
    <div className="flex flex-col h-full bg-background animate-in slide-in-from-right-8 duration-500">
      <div className="px-6 pt-10 pb-4 flex items-center gap-4 shrink-0">
        <button onClick={onBack} className="p-3 rounded-full bg-white/5 border border-white/10 active:scale-90 transition-all">
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-lg font-headline font-black italic uppercase flex-1 text-center pr-10">Fuel Intel</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-32">
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
          <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Preparation Intel</p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-sm italic leading-relaxed text-white/80 whitespace-pre-wrap font-medium">
              "{item.intel}"
            </p>
          </div>
        </div>

        {item.ingredients && item.ingredients.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">Required Staples</p>
            <div className="grid grid-cols-1 gap-2">
              {item.ingredients.map((ing, i) => (
                <div key={i} className="bg-white/5 p-3 rounded-xl flex items-center gap-3 border border-white/5">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-xs font-black italic text-white/70 uppercase">{ing}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/90 to-transparent">
        <Button 
          onClick={() => !isCompleted && onComplete(item.activity)}
          disabled={isCompleted}
          className={cn(
            "w-full h-14 rounded-xl text-md font-black uppercase italic transition-all duration-300",
            isCompleted ? "bg-white/10 text-white/40" : "bg-primary text-primary-foreground neon-glow"
          )}
        >
          {isCompleted ? <><CheckCircle2 size={20} className="mr-2" /> Logged</> : "Log Fuel Intake"}
        </Button>
      </div>
    </div>
  );
}
