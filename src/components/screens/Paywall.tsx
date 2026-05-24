"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, CheckCircle2, Star, Loader2, Lock, Play, Utensils, Flame, Zap, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSportConfig } from '@/lib/sports-config';

type PlanId = 'monthly' | 'yearly' | 'lifetime';

const FEATURES = [
  'AI Daily Training Plan',
  'Food Camera Scanner',
  'Game-Day Nutrition',
  'Drill Video Library',
  'XP & Rank System',
  'Push Notifications',
];

export default function Paywall({
  onComplete,
  onDismiss,
  sport,
  position,
}: {
  onComplete: () => void;
  onDismiss: () => void;
  sport?: string;
  position?: string;
}) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  const TESTIMONIALS = [
    { quote: "Changed how I prepare for game day. Pre-match routine is completely locked in.", name: "Jake M.", sport: "Soccer · Midfielder" },
    { quote: "The food scanner alone is worth it. Never tracked my macros properly before this.", name: "Priya K.", sport: "Netball · Centre" },
    { quote: "Game day nutrition plans hit different when they're actually built for your position.", name: "Liam C.", sport: "AFL · Midfielder" },
    { quote: "Rival mode has me opening the app every single day without fail.", name: "Sam W.", sport: "Basketball · Point Guard" },
  ];

  useEffect(() => {
    const id = setInterval(() => setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(id);
  }, []);

  const sportConfig = getSportConfig(sport || 'Soccer');
  const previewDrill = sportConfig.drills[0];

  const sampleSchedule = [
    { time: '07:30', type: 'nutrition', activity: 'Pre-Training Fuel', detail: 'Oats + banana + 500ml water' },
    { time: '16:00', type: 'training', activity: previewDrill.title, detail: previewDrill.intel.split('\n')[0].replace(/^\d+\.\s*/, '') },
    { time: '18:30', type: 'recovery', activity: 'Post-Session Recovery', detail: 'Protein + foam roll + stretch' },
    { time: '21:00', type: 'sleep', activity: 'Sleep Protocol', detail: 'Wind down — no screens after 9pm' },
  ];

  const plans = [
    { id: 'monthly' as PlanId, name: 'Monthly', price: '$6.99', period: '/ mo', sub: '3-Day Free Trial', tag: null },
    { id: 'yearly' as PlanId, name: 'Yearly', price: '$49.99', period: '/ yr', sub: 'Save 40%', tag: 'Most Popular' },
    { id: 'lifetime' as PlanId, name: 'Lifetime', price: '$69.99', period: ' once', sub: 'Was $99.99', tag: 'Best Deal', isDiscounted: true },
  ];

  const handlePurchase = () => {
    setIsProcessing(true);
    setTimeout(() => { setIsProcessing(false); onComplete(); }, 800);
  };

  const typeIcon = (type: string) => {
    if (type === 'training') return <Play size={9} className="fill-current" />;
    if (type === 'nutrition') return <Utensils size={9} />;
    if (type === 'recovery') return <Flame size={9} />;
    return <Star size={9} />;
  };

  const typeColor = (type: string): string => {
    if (type === 'training') return 'bg-primary/15 text-primary';
    if (type === 'nutrition') return 'bg-amber-400/15 text-amber-400';
    if (type === 'recovery') return 'bg-blue-400/15 text-blue-400';
    return 'bg-purple-400/15 text-purple-400';
  };

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden animate-in fade-in zoom-in-95 duration-700">
      {/* Ambient top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-56 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

      <button
        onClick={onDismiss}
        className="absolute top-12 left-6 p-2.5 rounded-full bg-white/5 border border-white/10 text-white/30 z-10 hover:text-white/70 transition-colors"
      >
        <X size={15} />
      </button>

      <div className="flex-1 overflow-y-auto px-6 pt-14 pb-4 space-y-5">
        {/* Header */}
        <div className="text-center space-y-3 pt-4">
          <div className="flex items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25 animate-in fade-in duration-500 delay-150">
              <Zap size={10} className="text-primary fill-current" />
              <span className="text-[8px] font-black uppercase tracking-[0.25em] text-primary">Elite Access</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/8">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-widest text-white/40">3,400+ athletes</span>
            </div>
          </div>
          <h2 className="text-[2rem] font-headline font-black uppercase leading-none tracking-tighter animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
            Your Daily<br />Protocol
          </h2>
          {sport && position && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 animate-in fade-in duration-500 delay-300">
              Built for {sport} · {position}
            </p>
          )}
        </div>

        {/* Preview plan card */}
        <div className="relative rounded-3xl overflow-hidden border border-white/8 bg-white/3 animate-in fade-in slide-in-from-bottom-3 duration-600 delay-300">
          <div className="px-4 pt-3 pb-2.5 border-b border-white/5 flex items-center justify-between">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/25">Today's AI Plan — Preview</p>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              <Lock size={7} className="text-primary" />
              <span className="text-[7px] font-black uppercase tracking-widest text-primary">Pro</span>
            </div>
          </div>

          <div className="px-2 pt-1.5 pb-1 space-y-0.5">
            {sampleSchedule.map((item, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all",
                  i === 1 && "bg-primary/5 ring-1 ring-inset ring-primary/10"
                )}
              >
                <span className="text-[9px] font-mono font-bold text-white/20 w-10 shrink-0 tabular-nums">{item.time}</span>
                <div className={cn("h-6 w-6 rounded-lg flex items-center justify-center shrink-0", typeColor(item.type))}>
                  {typeIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-[13px] font-bold truncate", i === 1 ? "text-white" : "text-white/70")}>{item.activity}</p>
                  <p className="text-[10px] text-white/25 truncate leading-tight">{item.detail}</p>
                </div>
                {i === 1 && <span className="text-[8px] font-black uppercase tracking-[0.12em] text-primary shrink-0">Now</span>}
              </div>
            ))}
          </div>

          {/* Blur lock overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#121212] via-[#121212]/85 to-transparent flex items-end justify-center pb-3 pointer-events-none">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25">
              <Lock size={8} className="text-primary" />
              <span className="text-[8px] font-black uppercase tracking-widest text-primary">Unlock full daily plan</span>
            </div>
          </div>
        </div>

        {/* Plan selector */}
        <div className="space-y-2 animate-in fade-in duration-500 delay-400">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => !isProcessing && setSelectedPlan(plan.id)}
                className={cn(
                  "w-full rounded-2xl p-4 border transition-all cursor-pointer relative overflow-hidden active:scale-[0.98] duration-150",
                  isSelected
                    ? "bg-white border-white text-black shadow-xl"
                    : "bg-white/4 border-white/8 text-white hover:bg-white/7"
                )}
              >
                {plan.tag && (
                  <div className={cn(
                    "absolute top-0 right-0 px-2.5 py-1 text-[7px] font-black uppercase tracking-widest rounded-bl-xl",
                    isSelected ? "bg-black text-white" : "bg-primary text-black"
                  )}>
                    {plan.tag}
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <p className="text-[8px] font-black uppercase tracking-widest opacity-50">{plan.name}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black italic uppercase leading-none">{plan.price}</span>
                      <span className="text-[10px] font-bold opacity-35">{plan.period}</span>
                    </div>
                    <p className={cn(
                      "text-[8px] font-black uppercase tracking-widest",
                      (plan as any).isDiscounted
                        ? isSelected ? "opacity-60" : "text-primary"
                        : "opacity-35"
                    )}>
                      {plan.sub}
                    </p>
                  </div>
                  <div className={cn(
                    "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                    isSelected ? "border-black" : "border-white/15"
                  )}>
                    {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-black animate-in zoom-in duration-200" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 gap-2 animate-in fade-in duration-500 delay-500">
          {FEATURES.map((item, i) => (
            <div key={i} className="flex items-center gap-2 bg-white/3 rounded-xl p-2.5 border border-white/5">
              <CheckCircle2 size={11} className="text-primary shrink-0" />
              <span className="text-[9px] font-bold uppercase tracking-wide text-white/45 leading-tight">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rotating testimonial */}
      <div className="mx-6 mb-2 rounded-2xl bg-white/3 border border-white/6 p-4 space-y-2 animate-in fade-in duration-300" key={testimonialIdx}>
        <p className="text-[11px] text-white/50 leading-relaxed italic">"{TESTIMONIALS[testimonialIdx].quote}"</p>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-black text-primary">
            {TESTIMONIALS[testimonialIdx].name[0]}
          </div>
          <div>
            <p className="text-[9px] font-black text-white/60">{TESTIMONIALS[testimonialIdx].name}</p>
            <p className="text-[8px] font-bold uppercase tracking-widest text-white/25">{TESTIMONIALS[testimonialIdx].sport}</p>
          </div>
          <div className="ml-auto flex gap-0.5">
            {TESTIMONIALS.map((_, i) => (
              <span key={i} className={cn("h-1 rounded-full transition-all", i === testimonialIdx ? "w-4 bg-primary" : "w-1 bg-white/15")} />
            ))}
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="px-6 pb-10 pt-4 space-y-3 border-t border-white/5 bg-background/90 backdrop-blur-md shrink-0">
        <Button
          onClick={handlePurchase}
          disabled={isProcessing}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground text-sm font-black uppercase italic hover:opacity-90 transition-all neon-glow active:scale-[0.98]"
        >
          {isProcessing ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Activating...</>
          ) : selectedPlan === 'monthly' ? (
            <>Start 3-Day Free Trial <ChevronRight size={16} className="ml-1" /></>
          ) : (
            <>Unlock Protocol <ChevronRight size={16} className="ml-1" /></>
          )}
        </Button>
        <p className="text-[8px] text-center text-white/15 uppercase font-black tracking-[0.3em]">
          Demo mode — no payment required
        </p>
      </div>
    </div>
  );
}
