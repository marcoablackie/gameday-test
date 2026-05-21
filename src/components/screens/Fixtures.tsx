"use client";

import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { ChevronLeft, Search, X, MapPin, Clock, Star, Loader2, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  loadFSCData, fixturesForClub, groupByDate,
  parseMatchDate, formatDayHeader, formatKickoff, parseTeamName,
  type FSCData, type FSCClub, type FSCFixture,
} from '@/lib/fsc-data';
import type { ScreenState } from '../GamedayFlow';

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  pending:             { bg: 'bg-white/8',           text: 'text-white/40' },
  complete:            { bg: 'bg-emerald-500/15',     text: 'text-emerald-400' },
  'washout reschedule':{ bg: 'bg-amber-500/15',       text: 'text-amber-400' },
  cancelled:           { bg: 'bg-destructive/15',     text: 'text-destructive' },
  postponed:           { bg: 'bg-amber-500/15',       text: 'text-amber-400' },
};

function statusStyle(s: string) {
  return STATUS_STYLE[s.toLowerCase()] ?? STATUS_STYLE.pending;
}

export default function Fixtures({
  onBack,
}: {
  onBack: () => void;
  onNavClick?: (screen: ScreenState) => void;
}) {
  const [data, setData] = useState<FSCData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClub, setSelectedClub] = useState<FSCClub | null>(null);
  const [myClubId, setMyClubId] = useState<string | null>(null);

  // Defer the search value so keystrokes never block
  const deferredSearch = useDeferredValue(search);

  // Load JSON once on mount
  useEffect(() => {
    loadFSCData()
      .then(d => { setData(d); setDataLoading(false); })
      .catch(() => setDataLoading(false));
  }, []);

  // Read saved club from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gameday_my_club');
      if (saved) {
        const { id } = JSON.parse(saved);
        setMyClubId(id);
      }
    } catch {}
  }, []);

  const saveMyClub = (club: FSCClub) => {
    try {
      localStorage.setItem('gameday_my_club', JSON.stringify({ id: club.id, name: club.name, logo: club.logo }));
    } catch {}
    setMyClubId(club.id);
  };

  // Filter club list — 65 clubs so this is instant even without deferring
  const filteredClubs = useMemo(() => {
    if (!data) return [];
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return data.clubs;
    return data.clubs.filter(c => c.name.toLowerCase().includes(q));
  }, [data, deferredSearch]);

  // Club's fixtures — only computed when a club is selected
  const clubFixtures = useMemo(
    () => (data && selectedClub ? fixturesForClub(data.fixtures, selectedClub.name) : []),
    [data, selectedClub]
  );

  // Group by local date
  const fixtureGroups = useMemo(() => groupByDate(clubFixtures), [clubFixtures]);

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden animate-in fade-in slide-in-from-right-10 duration-700">

      {/* ── Header ── */}
      <div className="px-6 pt-12 pb-3 flex items-center gap-4 shrink-0">
        <button
          onClick={selectedClub ? () => { setSelectedClub(null); setSearch(''); } : onBack}
          className="p-3 bg-white/5 rounded-full text-white hover:bg-white/10 transition-all active:scale-95"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-headline font-bold uppercase tracking-tight truncate">
            {selectedClub ? selectedClub.name : 'Fixtures'}
          </h3>
          {selectedClub && (
            <p className="text-[8px] font-bold uppercase tracking-widest text-white/30 mt-0.5">
              {clubFixtures.length} fixture{clubFixtures.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {selectedClub && (
          <img src={selectedClub.logo} alt="" className="h-9 w-9 rounded-xl object-contain bg-white/5 shrink-0" />
        )}
      </div>

      {/* ── Search bar (club list view only) ── */}
      {!selectedClub && (
        <div className="px-6 pb-3 shrink-0">
          <div className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-2xl px-4 h-12">
            <Search size={15} className="text-white/30 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search your club..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-white/30 hover:text-white transition-colors">
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {dataLoading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 size={24} className="text-primary animate-spin" />
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 animate-pulse">Loading season data...</p>
        </div>
      )}

      {/* ── Club list ── */}
      {!dataLoading && !selectedClub && (
        <div className="flex-1 overflow-y-auto px-6 space-y-2 pb-10">
          {filteredClubs.length === 0 && (
            <p className="text-center text-[9px] font-bold uppercase tracking-widest text-white/20 py-10">No clubs found</p>
          )}
          {filteredClubs.map(club => {
            const count = data ? fixturesForClub(data.fixtures, club.name).length : 0;
            return (
              <button
                key={club.id}
                onClick={() => setSelectedClub(club)}
                className="w-full flex items-center gap-4 bg-white/5 border border-white/8 rounded-2xl px-4 py-3 hover:bg-white/8 active:scale-[0.98] transition-all"
              >
                <img
                  src={club.logo}
                  alt={club.name}
                  className="h-10 w-10 rounded-xl object-contain bg-white/5 shrink-0"
                />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-bold text-white leading-tight truncate">{club.name}</p>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-white/30 mt-0.5">
                    {count} fixture{count !== 1 ? 's' : ''}
                  </p>
                </div>
                {myClubId === club.id && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/15 border border-primary/25 shrink-0">
                    <Star size={8} className="text-primary fill-primary" />
                    <span className="text-[7px] font-black uppercase tracking-widest text-primary">My Club</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Fixture list for selected club ── */}
      {!dataLoading && selectedClub && (
        <div className="flex-1 overflow-y-auto pb-10">

          {/* My Club button */}
          <div className="px-6 pb-4">
            <button
              onClick={() => saveMyClub(selectedClub)}
              className={cn(
                "w-full h-10 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                myClubId === selectedClub.id
                  ? "bg-primary/15 border-primary/30 text-primary"
                  : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20"
              )}
            >
              <Star size={10} className={myClubId === selectedClub.id ? "fill-primary text-primary" : ""} />
              {myClubId === selectedClub.id ? 'My Club — Saved' : 'Set as My Club'}
            </button>
          </div>

          {fixtureGroups.length === 0 && (
            <p className="text-center text-[9px] font-bold uppercase tracking-widest text-white/20 py-10 px-6">
              No fixtures found for this club
            </p>
          )}

          {/* Date groups */}
          {fixtureGroups.map(group => (
            <div key={group.dateKey}>
              {/* Sticky date header */}
              <div className="sticky top-0 z-10 px-6 py-2 bg-background/90 backdrop-blur-sm border-b border-white/5">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
                  {group.dayLabel}
                </p>
              </div>

              {/* Fixtures for this date */}
              <div className="px-6 space-y-3 pt-3 pb-4">
                {group.fixtures.map(fixture => (
                  <FixtureCard
                    key={fixture.id}
                    fixture={fixture}
                    clubs={data!.clubs}
                    myClubName={selectedClub.name}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Fixture card ──────────────────────────────────────────────────────────────

function FixtureCard({
  fixture,
  clubs,
  myClubName,
}: {
  fixture: FSCFixture;
  clubs: FSCClub[];
  myClubName: string;
}) {
  const local = parseMatchDate(fixture.matchDate);
  const kickoff = formatKickoff(local);

  const home = parseTeamName(fixture.homeTeam.name, clubs);
  const away = parseTeamName(fixture.awayTeam.name, clubs);

  const myQ = myClubName.toLowerCase();
  const iAmHome = (fixture.homeTeam.name ?? '').toLowerCase().includes(myQ);
  const hasScore = fixture.homeTeam.score !== null && fixture.awayTeam.score !== null;

  const ss = statusStyle(fixture.status);

  return (
    <div className="rounded-2xl bg-white/5 border border-white/8 overflow-hidden">
      {/* Meta row */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-white/10 text-white/50">
            {fixture.round}
          </span>
          <span className={cn("text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded", ss.bg, ss.text)}>
            {fixture.status}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Shield size={8} className={iAmHome ? 'text-primary' : 'text-white/20'} />
          <span className={cn("text-[7px] font-black uppercase tracking-widest", iAmHome ? 'text-primary' : 'text-white/30')}>
            {iAmHome ? 'Home' : 'Away'}
          </span>
        </div>
      </div>

      {/* Teams */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-3">
          {/* Home */}
          <div className="flex-1 flex flex-col items-center gap-1.5 text-center">
            <img
              src={fixture.homeTeam.logo}
              alt={home.clubName}
              className="h-11 w-11 object-contain rounded-xl bg-white/5"
            />
            <div>
              <p className={cn(
                "text-[9px] font-black uppercase leading-tight tracking-tight",
                (fixture.homeTeam.name ?? '').toLowerCase().includes(myQ) ? "text-white" : "text-white/45"
              )}>
                {home.clubName}
              </p>
              {home.grade && (
                <p className="text-[7px] font-bold text-white/25 mt-0.5 uppercase tracking-widest leading-none">{home.grade}</p>
              )}
            </div>
          </div>

          {/* Score / VS */}
          <div className="shrink-0 flex flex-col items-center gap-0.5">
            {hasScore ? (
              <span className="text-2xl font-black text-white tabular-nums tracking-tight">
                {fixture.homeTeam.score} – {fixture.awayTeam.score}
              </span>
            ) : (
              <>
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">vs</span>
              </>
            )}
          </div>

          {/* Away */}
          <div className="flex-1 flex flex-col items-center gap-1.5 text-center">
            <img
              src={fixture.awayTeam.logo}
              alt={away.clubName}
              className="h-11 w-11 object-contain rounded-xl bg-white/5"
            />
            <div>
              <p className={cn(
                "text-[9px] font-black uppercase leading-tight tracking-tight",
                (fixture.awayTeam.name ?? '').toLowerCase().includes(myQ) ? "text-white" : "text-white/45"
              )}>
                {away.clubName}
              </p>
              {away.grade && (
                <p className="text-[7px] font-bold text-white/25 mt-0.5 uppercase tracking-widest leading-none">{away.grade}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer: time + venue + tier */}
      <div className="border-t border-white/5 px-4 py-2.5 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-white/40">
            <Clock size={9} />
            {kickoff}
          </div>
          <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-white/40">
            <MapPin size={9} />
            {fixture.groundLocation} — Field {fixture.fieldNumber}
          </div>
        </div>
        <p className="text-[7px] font-bold uppercase tracking-widest text-white/20 truncate max-w-[130px]">
          {fixture.leagueTierName}
        </p>
      </div>
    </div>
  );
}
