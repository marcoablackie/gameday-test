"use client";

import React from 'react';
import { Home, Dumbbell, UtensilsCrossed, BarChart2, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScreenState } from './GamedayFlow';

const ITEMS = [
  { screen: 'dashboard'    as ScreenState, Icon: Home,              label: 'Daily'    },
  { screen: 'drills_library' as ScreenState, Icon: Dumbbell,        label: 'Drills'   },
  { screen: 'food_tracker' as ScreenState, Icon: UtensilsCrossed,   label: 'Meals'    },
  { screen: 'stats'        as ScreenState, Icon: BarChart2,         label: 'Stats'    },
  { screen: 'settings'     as ScreenState, Icon: SlidersHorizontal, label: 'Settings' },
] as const;

export default function NavBar({
  active,
  onNavClick,
  position = 'absolute',
}: {
  active: ScreenState;
  onNavClick: (screen: ScreenState) => void;
  position?: 'absolute' | 'sticky';
}) {
  return (
    <div className={cn(
      position === 'absolute' ? 'absolute' : 'sticky',
      'bottom-0 left-0 right-0 h-28 glass-nav flex items-center justify-around px-4 pb-8 z-30'
    )}>
      {ITEMS.map(({ screen, Icon, label }) => {
        const isActive = active === screen;
        return (
          <button
            key={screen}
            onClick={() => onNavClick(screen)}
            className={cn(
              'flex flex-col items-center gap-1.5 transition-colors',
              isActive ? 'text-white' : 'text-white/40 hover:text-white'
            )}
          >
            <div className={cn('h-0.5 w-8 rounded-full mb-0.5', isActive ? 'bg-primary' : 'bg-transparent')} />
            <Icon size={20} />
            <span className="text-[8px] font-bold uppercase tracking-[0.1em]">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
