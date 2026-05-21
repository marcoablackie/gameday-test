"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Search, MapPin, Calendar, Clock, Star, X, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import fscData from '@/data/fsc_clean_season_database.json';
import type { ScreenState } from '../GamedayFlow';

type Club = { id: string; name: string; logo: string };
type TeamData = { name: string; logo: string; score: number | null };
type Fixture = {
  id: string;
  matchDate: string;
  round: string;
  status: string;
  competitionGroup: string;
  leagueTierName: string;
  groundLocation: string;
  fieldNumber: string;
  homeTeam: TeamData;
  awayTeam: TeamData;
};

const clubs = fscData.clubs as Club[];
const fixtures = fscData.fixtures as Fixture[];

function parseTeamName(teamName: string): { clubName: string; grade: string } {
  // Double-space separator used for Premier League teams
  if (teamName.includes('  ')) {
    const idx = teamName.indexOf('  ');
    return { clubName: teamName.slice(0, idx).trim(), grade: teamName.slice(idx).trim() };
  }
  // Try matching against known club names (longest match first)
  const sorted = [...clubs].sort((a, b) => b.name.length - a.name.length);
  for (const club of sorted) {
    if (teamName.toLowerCase().startsWith(club.name.toLowerCase())) {
      const grade = teamName.slice(club.name.length).trim();
      return { clubName: club.name, grade };
    }
  }
  // Fallback: whole string is club name
  return { clubName: teamName, grade: '' };
}

function formatMatchTime(isoString: string) {
  // Treat as local time — Dribl stores AEST with Z suffix
  const [datePart, timePart] = isoString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  const d = new Date(year, month - 1, day, hour, minute);
  return {
    date: d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }),
    time: d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }),
  };
}

function clubFixtures(clubName: string): Fixture[] {
  return fixtures.filter(f => {
    const home = parseTeamName(f.homeTeam.name).clubName.toLowerCase();
    const away = parseTeamName(f.awayTeam.name).clubName.toLowerCase();
    const search = clubName.toLowerCase();
    return home === search || away === search;
  }).sort((a, b) => a.matchDate.localeCompare(b.matchDate));
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-white/10 text-white/40',
  'washout reschedule': 'bg-amber-500/20 text-amber-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
  cancelled: 'bg-destructive/20 text-destructive',
};

export default function Fixtures({
  onBack,
  onNavClick,
}: {
  onBack: () => void;
  onNavClick: (screen: ScreenState) => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [myClubId, setMyClubId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('gameday_my_club');
      if (saved) {
        const parsed = JSON.parse(saved);
        setMyClubId(parsed.id);
      }
    } catch {}
  }, []);

  const saveMyClub = (club: Club) => {
    try {
      localStorage.setItem('gameday_my_club', JSON.stringify({ id: club.id, name: club.name, logo: club.logo }));
    } catch {}
    setMyClubId(club.id);
  };

  const filteredClubs = useMemo(() => {
    if (!search.trim()) return clubs;
    const q = search.toLowerCase();
    return clubs.filter(c => c.name.toLowerCase().includes(q));
  }, [search]);

  const fixturesForClub = useMemo(
    () => (selectedClub ? clubFixtures(selectedClub.name) : []),
    [selectedClub]
  );

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden animate-in fade-in slide-in-from-right-10 duration-700">

      {/* Header */}
      <div className="px-6 pt-12 pb-3 flex items-center gap-4 shrink-0">
        <button
          onClick={selectedClub ? () => setSelectedClub(null) : onBack}
          className="p-3 bg-white/5 rounded-full text-white hover:bg-white/10 transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-xl font-headline font-bold uppercase flex-1 tracking-tight">
          {selectedClub ? selectedClub.name : 'Fixtures'}
        </h3>
        {selectedClub && (
          <img src={selectedClub.logo} alt="" className="h-9 w-9 rounded-xl object-contain bg-white/5" />
        )}
      </div>

      {/* Search bar — shown on club list view */}
      {!selectedClub && (
        <div className="px-6 pb-3 shrink-0">
          <div className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-2xl px-4 h-12">
            <Search size={16} className="text-white/30 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search club name..."
              className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-white/30 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Club list */}
      {!selectedClub && (
        <div className="flex-1 overflow-y-auto px-6 space-y-2 pb-10">
          {filteredClubs.length === 0 && (
            <p className="text-center text-[9px] font-bold uppercase tracking-widest text-white/20 py-8">No clubs found</p>
          )}
          {filteredClubs.map(club => (
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
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-white leading-tight">{club.name}</p>
                <p className="text-[8px] font-bold uppercase tracking-widest text-white/30 mt-0.5">
                  {clubFixtures(club.name).length} fixture{clubFixtures(club.name).length !== 1 ? 's' : ''}
                </p>
              </div>
              {myClubId === club.id && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/15 border border-primary/25">
                  <Star size={8} className="text-primary fill-primary" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-primary">My Club</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Fixture list for selected club */}
      {selectedClub && (
        <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-10">

          {/* My Club button */}
          <button
            onClick={() => saveMyClub(selectedClub)}
            className={cn(
              "w-full h-10 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              myClubId === selectedClub.id
                ? "bg-primary/15 border-primary/30 text-primary"
                : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20"
            )}
          >
            <Star size={11} className={myClubId === selectedClub.id ? "fill-primary text-primary" : ""} />
            {myClubId === selectedClub.id ? 'My Club — Saved' : 'Set as My Club'}
          </button>

          {fixturesForClub.length === 0 && (
            <p className="text-center text-[9px] font-bold uppercase tracking-widest text-white/20 py-8">
              No fixtures found for this club
            </p>
          )}

          {fixturesForClub.map(fixture => {
            const { date, time } = formatMatchTime(fixture.matchDate);
            const home = parseTeamName(fixture.homeTeam.name);
            const away = parseTeamName(fixture.awayTeam.name);
            const isMyTeamHome = home.clubName.toLowerCase() === selectedClub.name.toLowerCase();
            const statusStyle = STATUS_STYLES[fixture.status.toLowerCase()] ?? STATUS_STYLES.pending;
            const hasScore = fixture.homeTeam.score !== null && fixture.awayTeam.score !== null;

            return (
              <div key={fixture.id} className="rounded-3xl bg-white/5 border border-white/8 p-5 space-y-4">

                {/* Top meta row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-white/10 text-white/50">
                      {fixture.round}
                    </span>
                    <span className={cn("text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded", statusStyle)}>
                      {fixture.status}
                    </span>
                  </div>
                  {isMyTeamHome
                    ? <span className="text-[7px] font-black uppercase tracking-widest text-primary">Home</span>
                    : <span className="text-[7px] font-black uppercase tracking-widest text-white/30">Away</span>
                  }
                </div>

                {/* Teams */}
                <div className="flex items-center gap-3">
                  {/* Home team */}
                  <div className="flex-1 flex flex-col items-center gap-2">
                    <img
                      src={fixture.homeTeam.logo}
                      alt={home.clubName}
                      className="h-12 w-12 object-contain rounded-xl bg-white/5"
                    />
                    <div className="text-center">
                      <p className={cn(
                        "text-[10px] font-black uppercase leading-tight tracking-tight",
                        home.clubName.toLowerCase() === selectedClub.name.toLowerCase() ? "text-white" : "text-white/50"
                      )}>
                        {home.clubName}
                      </p>
                      {home.grade && (
                        <p className="text-[7px] font-bold uppercase tracking-widest text-white/25 mt-0.5">{home.grade}</p>
                      )}
                    </div>
                  </div>

                  {/* Score / VS */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    {hasScore ? (
                      <span className="text-2xl font-black text-white tabular-nums">
                        {fixture.homeTeam.score} – {fixture.awayTeam.score}
                      </span>
                    ) : (
                      <span className="text-xs font-black text-white/20 uppercase tracking-widest">vs</span>
                    )}
                  </div>

                  {/* Away team */}
                  <div className="flex-1 flex flex-col items-center gap-2">
                    <img
                      src={fixture.awayTeam.logo}
                      alt={away.clubName}
                      className="h-12 w-12 object-contain rounded-xl bg-white/5"
                    />
                    <div className="text-center">
                      <p className={cn(
                        "text-[10px] font-black uppercase leading-tight tracking-tight",
                        away.clubName.toLowerCase() === selectedClub.name.toLowerCase() ? "text-white" : "text-white/50"
                      )}>
                        {away.clubName}
                      </p>
                      {away.grade && (
                        <p className="text-[7px] font-bold uppercase tracking-widest text-white/25 mt-0.5">{away.grade}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Competition tier */}
                <p className="text-center text-[7px] font-bold uppercase tracking-widest text-white/25">
                  {fixture.leagueTierName}
                </p>

                {/* Footer: date, time, ground */}
                <div className="flex items-center justify-center gap-4 pt-1 border-t border-white/5">
                  <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-white/40">
                    <Calendar size={9} />
                    {date}
                  </div>
                  <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-white/40">
                    <Clock size={9} />
                    {time}
                  </div>
                  <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-white/40">
                    <MapPin size={9} />
                    {fixture.groundLocation} F{fixture.fieldNumber}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
