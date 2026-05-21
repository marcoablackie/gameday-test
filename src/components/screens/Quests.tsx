"use client";

import React, { useMemo } from 'react';
import { Home, Dumbbell, BarChart2, Camera, ChevronLeft, Zap, CheckCircle2, Brain, Flame, Apple, Moon, BookOpen, Users, Target, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScreenState, UserProfile } from '../GamedayFlow';

const ALL_QUESTS = [
  // Physical
  { id: 'p1', title: '100 Reps Challenge', description: 'Do 100 total reps of any exercise — push-ups, squats, or jumps. Break it up however you want.', category: 'Physical', xp: 150, icon: 'flame', color: 'orange' },
  { id: 'p2', title: 'Cold Shower Protocol', description: 'End your shower with 60 seconds of cold water. Builds mental toughness and speeds recovery.', category: 'Physical', xp: 100, icon: 'wind', color: 'blue' },
  { id: 'p3', title: 'Extra 15 Minutes', description: 'Add 15 minutes of focused skill work to your day — dribbling, shooting form, footwork.', category: 'Physical', xp: 100, icon: 'target', color: 'primary' },
  { id: 'p4', title: 'Sprint Series', description: '5 all-out 30-meter sprints with 90 seconds rest between each. Max effort every rep.', category: 'Physical', xp: 150, icon: 'flame', color: 'orange' },
  { id: 'p5', title: 'Jump Training', description: '3 sets of 10 max-height vertical jumps. Focus on triple extension — ankles, knees, hips.', category: 'Physical', xp: 100, icon: 'target', color: 'primary' },
  { id: 'p6', title: 'Grip Strength', description: 'Spend 10 minutes on grip work — hang from a bar, towel pull-ups, or farmer carries.', category: 'Physical', xp: 75, icon: 'flame', color: 'orange' },

  // Mental
  { id: 'm1', title: 'Visualization Session', description: 'Spend 10 minutes eyes closed, visualizing your next game. See every move in detail.', category: 'Mindset', xp: 100, icon: 'brain', color: 'purple' },
  { id: 'm2', title: 'Watch Film', description: 'Watch 20 minutes of a pro who plays your position. Take 3 notes on what makes them elite.', category: 'Mindset', xp: 100, icon: 'brain', color: 'purple' },
  { id: 'm3', title: 'Journaling Protocol', description: 'Write for 5 minutes: what went well today, what to fix, and tomorrow\'s #1 goal.', category: 'Mindset', xp: 75, icon: 'book', color: 'purple' },
  { id: 'm4', title: 'No Phone Hour', description: 'One full hour with your phone face-down and silent. Use the time to read, stretch, or rest.', category: 'Mindset', xp: 75, icon: 'brain', color: 'purple' },
  { id: 'm5', title: 'Pre-Game Routine', description: 'Design your personal warm-up ritual: music, movements, mindset cues. Write it down.', category: 'Mindset', xp: 100, icon: 'brain', color: 'purple' },
  { id: 'm6', title: 'Affirmation Set', description: 'Say 5 specific affirmations about your game out loud. Not generic — specific to your position.', category: 'Mindset', xp: 50, icon: 'book', color: 'purple' },

  // Nutrition
  { id: 'n1', title: 'Hydration Protocol', description: 'Drink 3 liters of water today. Set reminders every 2 hours if needed.', category: 'Nutrition', xp: 75, icon: 'apple', color: 'green' },
  { id: 'n2', title: 'No Junk Day', description: 'Zero processed food, fast food, or soda today. Whole foods only.', category: 'Nutrition', xp: 150, icon: 'apple', color: 'green' },
  { id: 'n3', title: 'Protein Target', description: 'Hit your daily protein goal. Track every meal and make sure you\'re within 10g of your target.', category: 'Nutrition', xp: 100, icon: 'apple', color: 'green' },
  { id: 'n4', title: 'Meal Prep Block', description: 'Spend 20 minutes prepping tomorrow\'s meals in advance. Consistency beats perfection.', category: 'Nutrition', xp: 100, icon: 'apple', color: 'green' },
  { id: 'n5', title: 'Pre-Training Fuel', description: 'Eat a proper pre-workout meal 90 minutes before your next session — carbs + protein combo.', category: 'Nutrition', xp: 75, icon: 'apple', color: 'green' },

  // Recovery
  { id: 'r1', title: 'Full Stretch Protocol', description: 'Complete 15 minutes of full-body stretching — hips, hammies, shoulders, and calves.', category: 'Recovery', xp: 75, icon: 'moon', color: 'blue' },
  { id: 'r2', title: 'Lights Out by 10PM', description: 'In bed with eyes closed by 10PM tonight. Sleep is the #1 performance drug.', category: 'Recovery', xp: 100, icon: 'moon', color: 'blue' },
  { id: 'r3', title: 'Foam Roll Session', description: '10 minutes of foam rolling — quads, IT band, calves, upper back. Hold each spot 45 seconds.', category: 'Recovery', xp: 75, icon: 'wind', color: 'blue' },
  { id: 'r4', title: 'Nap Protocol', description: 'Take a 20-minute nap between 1-3PM. Set an alarm — no longer than 25 minutes or you\'ll feel groggy.', category: 'Recovery', xp: 75, icon: 'moon', color: 'blue' },
  { id: 'r5', title: 'Screen-Free Wind Down', description: 'No screens for 45 minutes before bed tonight. Read, stretch, or journal instead.', category: 'Recovery', xp: 100, icon: 'moon', color: 'blue' },

  // Social / Growth
  { id: 's1', title: 'Coach Check-In', description: 'Send your coach a specific question about your technique or game plan. Show you\'re invested.', category: 'Growth', xp: 100, icon: 'users', color: 'yellow' },
  { id: 's2', title: 'Mentor Outreach', description: 'Message one athlete or professional you look up to. Ask one specific, thoughtful question.', category: 'Growth', xp: 100, icon: 'users', color: 'yellow' },
  { id: 's3', title: 'Read 10 Pages', description: 'Read 10 pages of any performance, business, or sports psychology book.', category: 'Growth', xp: 75, icon: 'book', color: 'yellow' },
  { id: 's4', title: 'Teammate Uplift', description: 'Give a genuine, specific compliment or encouragement to a teammate today.', category: 'Growth', xp: 50, icon: 'users', color: 'yellow' },
  { id: 's5', title: 'Goal Review', description: 'Write out your top 3 goals for this season. Then write ONE thing you\'re doing today to hit them.', category: 'Growth', xp: 100, icon: 'book', color: 'yellow' },
  { id: 's6', title: 'Skill Video', description: 'Record yourself doing a drill or skill. Watch it back and identify one thing to fix.', category: 'Growth', xp: 100, icon: 'target', color: 'yellow' },
];

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  blue:   { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/20'   },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  green:  { bg: 'bg-emerald-500/10',text: 'text-emerald-400',border: 'border-emerald-500/20'},
  yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
  primary:{ bg: 'bg-primary/10',    text: 'text-primary',    border: 'border-primary/20'    },
};

function getIcon(icon: string, size = 16) {
  switch (icon) {
    case 'flame':  return <Flame  size={size} />;
    case 'brain':  return <Brain  size={size} />;
    case 'apple':  return <Apple  size={size} />;
    case 'moon':   return <Moon   size={size} />;
    case 'book':   return <BookOpen size={size} />;
    case 'users':  return <Users  size={size} />;
    case 'target': return <Target size={size} />;
    case 'wind':   return <Wind   size={size} />;
    default:       return <Zap    size={size} />;
  }
}

function dailyQuests(profile: UserProfile) {
  // Seed by date + uid so it's unique per user and rotates daily
  const seed = `${new Date().toDateString()}-${profile.uid}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);

  const picks: typeof ALL_QUESTS = [];
  const used = new Set<number>();
  let h = Math.abs(hash);
  while (picks.length < 3) {
    const idx = h % ALL_QUESTS.length;
    if (!used.has(idx)) { used.add(idx); picks.push(ALL_QUESTS[idx]); }
    h = Math.abs((h * 1664525 + 1013904223) | 0);
  }
  return picks;
}

export default function Quests({
  profile,
  onBack,
  onNavClick,
  onComplete
}: {
  profile: UserProfile,
  onBack: () => void,
  onNavClick: (screen: ScreenState) => void,
  onComplete: (id: string) => void
}) {
  const quests = useMemo(() => dailyQuests(profile), [profile.uid]);
  const completedCount = quests.filter(q => profile.completedActivities.includes(q.id)).length;
  const totalXp = quests.reduce((sum, q) => sum + q.xp, 0);

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden animate-in fade-in slide-in-from-right-10 duration-700">
      <div className="px-6 pt-12 pb-4 flex items-center gap-4 shrink-0">
        <button onClick={onBack} className="p-3 bg-white/5 rounded-full text-white hover:bg-white/10 transition-all">
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-xl font-headline font-bold uppercase flex-1 tracking-tight text-center pr-10">Daily Bonus</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-36">

        {/* Header card */}
        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Today's Missions</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-headline font-black text-white">{completedCount}</span>
              <span className="text-lg font-black text-white/20">/ 3</span>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-primary">
              Up to +{totalXp} XP available
            </p>
          </div>
          <div className="relative h-16 w-16">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="white" strokeOpacity="0.05" strokeWidth="4" />
              <circle
                cx="28" cy="28" r="24" fill="none"
                stroke="hsl(var(--primary))" strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${(completedCount / 3) * 150.8} 150.8`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap size={18} className="text-primary" />
            </div>
          </div>
        </div>

        {/* Quest cards */}
        <div className="space-y-4">
          {quests.map((quest) => {
            const done = profile.completedActivities.includes(quest.id);
            const style = CATEGORY_STYLES[quest.color] ?? CATEGORY_STYLES.primary;

            return (
              <div
                key={quest.id}
                className={cn(
                  "rounded-3xl border p-6 space-y-4 transition-all duration-300",
                  done ? "bg-white/3 border-white/5 opacity-60" : "bg-white/5 border-white/8"
                )}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", style.bg, style.text)}>
                      {getIcon(quest.icon)}
                    </div>
                    <div>
                      <p className={cn("text-[8px] font-black uppercase tracking-widest", style.text)}>{quest.category}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">+{quest.xp} XP</p>
                    </div>
                  </div>
                  {done && <CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5" />}
                </div>

                {/* Title + description */}
                <div className="space-y-1.5">
                  <h4 className={cn(
                    "text-xl font-headline font-black uppercase leading-tight tracking-tight",
                    done ? "text-white/40" : "text-white"
                  )}>
                    {quest.title}
                  </h4>
                  <p className="text-xs text-white/50 leading-relaxed font-medium">
                    {quest.description}
                  </p>
                </div>

                {/* Action */}
                {!done && (
                  <button
                    onClick={() => onComplete(quest.id)}
                    className={cn(
                      "w-full h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98]",
                      "border neon-glow",
                      style.bg, style.text, style.border
                    )}
                  >
                    Mark Complete
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* All done state */}
        {completedCount === 3 && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 text-center space-y-2 animate-in zoom-in duration-500">
            <CheckCircle2 size={32} className="text-emerald-500 mx-auto" />
            <p className="text-sm font-black uppercase tracking-widest text-emerald-400">All Missions Complete</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">New missions unlock tomorrow</p>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-28 glass-nav flex items-center justify-around px-4 pb-8 z-30">
        <button onClick={() => onNavClick('dashboard')} className="flex flex-col items-center gap-2 text-white/40 hover:text-white transition-colors">
          <Home size={20} /> <span className="text-[8px] font-bold uppercase tracking-[0.1em]">Schedule</span>
        </button>
        <button onClick={() => onNavClick('drills_library')} className="flex flex-col items-center gap-2 text-white/40 hover:text-white transition-colors">
          <Dumbbell size={20} /> <span className="text-[8px] font-bold uppercase tracking-[0.1em]">Drills</span>
        </button>
        <button onClick={() => onNavClick('quests')} className="flex flex-col items-center gap-2 text-white transition-colors">
          <div className="h-1 w-8 bg-primary rounded-full mb-1" />
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
