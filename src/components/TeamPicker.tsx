"use client";

import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { Search, X, ChevronRight, Star, Loader2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { loadFSCData, teamsForClub, getSavedTeam, saveTeam, type FSCClub, type TeamEntry, type FSCData } from '@/lib/fsc-data';
import { Button } from '@/components/ui/button';

type Props = {
  onSave: () => void;
  onSkip?: () => void;
  title?: string;
  subtitle?: string;
};

export default function TeamPicker({ onSave, onSkip, title = "Pick Your Team", subtitle = "Select the team you play for" }: Props) {
  const [data, setData]               = useState<FSCData | null>(null);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [selectedClub, setSelectedClub] = useState<FSCClub | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<TeamEntry | null>(null);

  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    loadFSCData().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filteredClubs = useMemo(() => {
    if (!data) return [];
    const q = deferredSearch.trim().toLowerCase();
    return q ? data.clubs.filter(c => c.name.toLowerCase().includes(q)) : data.clubs;
  }, [data, deferredSearch]);

  const teams = useMemo<TeamEntry[]>(
    () => (data && selectedClub ? teamsForClub(data.fixtures, selectedClub.name, data.clubs) : []),
    [data, selectedClub]
  );

  const handleSave = () => {
    if (!selectedClub || !selectedTeam) return;
    saveTeam({ clubId: selectedClub.id, clubName: selectedClub.name, clubLogo: selectedClub.logo, gradeKey: selectedTeam.gradeKey, displayGrade: selectedTeam.displayGrade });
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background animate-in fade-in duration-300">
      {/* Header */}
      <div className="px-6 pt-14 pb-4 shrink-0">
        <div className="space-y-1 mb-5">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Team Setup</p>
          <h2 className="text-3xl font-headline font-black uppercase leading-none tracking-tight">{title}</h2>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{subtitle}</p>
        </div>

        {/* Search — always visible */}
        <div className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-2xl px-4 h-12">
          <Search size={15} className="text-white/30 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setSelectedClub(null); setSelectedTeam(null); }}
            placeholder="Search your club..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none"
          />
          {(search || selectedClub) && (
            <button onClick={() => { setSearch(''); setSelectedClub(null); setSelectedTeam(null); }} className="text-white/30 hover:text-white">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Breadcrumb */}
        {(selectedClub || selectedTeam) && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <button onClick={() => { setSelectedClub(null); setSelectedTeam(null); }} className="text-[8px] font-black uppercase tracking-widest text-white/30 hover:text-white">Clubs</button>
            {selectedClub && (
              <>
                <ChevronRight size={10} className="text-white/20" />
                <button
                  onClick={() => setSelectedTeam(null)}
                  className={cn("text-[8px] font-black uppercase tracking-widest", selectedTeam ? "text-white/30 hover:text-white" : "text-white")}
                >
                  {selectedClub.name}
                </button>
              </>
            )}
            {selectedTeam && (
              <>
                <ChevronRight size={10} className="text-white/20" />
                <span className="text-[8px] font-black uppercase tracking-widest text-primary">{selectedTeam.displayGrade}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 space-y-2 pb-4">
        {loading && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Loader2 size={22} className="text-primary animate-spin" />
            <p className="text-[9px] font-black uppercase tracking-widest text-white/30 animate-pulse">Loading clubs...</p>
          </div>
        )}

        {/* Club list */}
        {!loading && !selectedClub && filteredClubs.map(club => (
          <button
            key={club.id}
            onClick={() => { setSelectedClub(club); setSearch(''); }}
            className="w-full flex items-center gap-4 bg-white/5 border border-white/8 rounded-2xl px-4 py-3 hover:bg-white/8 active:scale-[0.98] transition-all"
          >
            <img src={club.logo} alt={club.name} className="h-10 w-10 rounded-xl object-contain bg-white/5 shrink-0" />
            <p className="flex-1 text-left text-sm font-bold text-white truncate">{club.name}</p>
            <ChevronRight size={14} className="text-white/20 shrink-0" />
          </button>
        ))}

        {/* Team list */}
        {!loading && selectedClub && !selectedTeam && teams.map(team => (
          <button
            key={team.gradeKey}
            onClick={() => setSelectedTeam(team)}
            className="w-full flex items-center gap-4 rounded-2xl px-4 py-4 active:scale-[0.98] transition-all border bg-white/5 border-white/8 hover:bg-white/8"
          >
            <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <Users size={14} className="text-white/30" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-bold text-white truncate">{team.displayGrade}</p>
              <p className="text-[8px] font-bold uppercase tracking-widest text-white/30 mt-0.5">{team.count} fixture{team.count !== 1 ? 's' : ''} this season</p>
            </div>
          </button>
        ))}

        {/* Selected team confirmation */}
        {!loading && selectedTeam && (
          <div className="rounded-2xl bg-primary/10 border border-primary/25 p-5 space-y-3">
            <div className="flex items-center gap-3">
              {selectedClub && <img src={selectedClub.logo} alt="" className="h-12 w-12 rounded-xl object-contain bg-white/5 shrink-0" />}
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-primary">{selectedClub?.name}</p>
                <p className="text-lg font-headline font-black uppercase text-white leading-tight">{selectedTeam.displayGrade}</p>
                <p className="text-[8px] font-bold uppercase tracking-widest text-white/30">{selectedTeam.count} fixtures this season</p>
              </div>
              <Star size={18} className="text-primary fill-primary ml-auto shrink-0" />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pb-10 pt-3 space-y-3 shrink-0 border-t border-white/5">
        <Button
          onClick={handleSave}
          disabled={!selectedTeam}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest neon-glow disabled:opacity-30"
        >
          {selectedTeam ? `Set ${selectedTeam.displayGrade} as My Team` : 'Select a team above'}
        </Button>
        {onSkip && (
          <button onClick={onSkip} className="w-full text-center text-[8px] font-bold uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors">
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}
