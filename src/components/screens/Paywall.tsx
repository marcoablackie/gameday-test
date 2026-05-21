"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, CheckCircle2, Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type PlanId = 'monthly' | 'yearly' | 'lifetime';

export default function Paywall({ onComplete, onDismiss }: { onComplete: () => void, onDismiss: () => void }) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);

  const plans = [
    {
      id: 'monthly' as PlanId,
      name: 'Pro Monthly',
      price: '$6.99',
      period: '/ month',
      sub: '3-Day Free Trial',
      tag: 'Flexible'
    },
    {
      id: 'yearly' as PlanId,
      name: 'Pro Yearly',
      price: '$49.99',
      period: '/ year',
      sub: 'Best Value',
      tag: 'Most Popular'
    },
    {
      id: 'lifetime' as PlanId,
      name: 'Elite Lifetime',
      price: '$69.99',
      period: ' once',
      sub: 'Was $99.99',
      tag: 'Limited Offer',
      isDiscounted: true
    }
  ];

  const handlePurchase = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onComplete();
    }, 800);
  };

  return (
    <div className="flex flex-col h-full bg-background relative px-6 py-12 overflow-y-auto animate-in fade-in zoom-in-95 duration-700">
      <button 
        onClick={onDismiss}
        className="absolute top-12 left-6 p-3 rounded-full bg-white/5 border border-white/10 text-white z-10 hover:bg-white/20 transition-colors"
      >
        <X size={20} />
      </button>

      <div className="flex-1 flex flex-col items-center pt-8">
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
             <Star size={10} className="text-primary fill-current" />
             <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary">Elite Access</span>
          </div>
          <h2 className="text-3xl font-headline font-bold uppercase leading-none tracking-tighter">
            PRO PERFORMANCE <br /> PROTOCOL
          </h2>
        </div>

        <div className="w-full space-y-3 mb-8">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              onClick={() => !isProcessing && setSelectedPlan(plan.id)}
              className={cn(
                "w-full rounded-2xl p-5 border transition-all cursor-pointer relative overflow-hidden group active:scale-[0.98]",
                selectedPlan === plan.id 
                  ? "bg-white border-white text-black shadow-2xl" 
                  : "bg-white/5 border-white/5 text-white hover:bg-white/10"
              )}
            >
              {plan.tag && (
                <div className={cn(
                  "absolute top-0 right-0 px-3 py-1 text-[7px] font-black uppercase tracking-widest rounded-bl-xl",
                  selectedPlan === plan.id ? "bg-black text-white" : "bg-primary text-black"
                )}>
                  {plan.tag}
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className={cn("text-[9px] font-black uppercase tracking-widest opacity-60", selectedPlan === plan.id ? "text-black" : "text-white")}>
                    {plan.name}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <h4 className="text-2xl font-black italic uppercase leading-none">{plan.price}</h4>
                    <span className="text-[10px] font-bold opacity-40">{plan.period}</span>
                  </div>
                  <p className={cn(
                    "text-[8px] font-black uppercase tracking-widest", 
                    plan.isDiscounted ? "text-primary" : "opacity-40",
                    selectedPlan === plan.id && plan.isDiscounted && "text-black opacity-60"
                  )}>
                    {plan.sub}
                  </p>
                </div>
                <div className={cn(
                  "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                  selectedPlan === plan.id ? "border-black" : "border-white/10"
                )}>
                  {selectedPlan === plan.id && <div className="h-3 w-3 rounded-full bg-black animate-in zoom-in duration-300" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="w-full bg-white/5 rounded-2xl p-4 border border-white/5 mb-8">
           <div className="flex flex-col gap-3">
              {[
                "Personalized AI Training Drills",
                "Instant AI Food Analysis",
                "Dynamic Recovery Protocols"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                   <CheckCircle2 size={12} className="text-primary" />
                   <span className="text-[9px] font-bold uppercase tracking-widest text-white/60">{item}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="space-y-6">
        <Button
          onClick={handlePurchase}
          disabled={isProcessing}
          className="w-full h-16 rounded-2xl bg-primary text-primary-foreground text-lg font-black uppercase italic hover:bg-white/90 transition-all neon-glow"
        >
          {isProcessing ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Activating...</>
          ) : (
            selectedPlan === 'monthly' ? "Start 3-Day Free Trial" : "Initialize Protocol"
          )}
        </Button>
        <p className="text-[8px] text-center text-white/20 uppercase font-black tracking-[0.3em] italic">
          Demo mode — no payment required
        </p>
      </div>
    </div>
  );
}
