"use client";

import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { ChevronLeft, Search, X, MapPin, Clock, Star, Loader2, Shield, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  loadFSCData, teamsForClub, fixturesForTeam, groupByDate,
  parseMatchDate, formatKickoff, parseTeamName, getSavedTeam, saveTeam,
  type FSCData, type FSCClub, type TeamEntry, type FSCFixture,
} from '@/lib/fsc-data';
import type { ScreenState } from '../GamedayFlow';

// ── Status badge styles ──────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  pending:              { bg: 'bg-white/8',        text: 'text-white/40'   },
  complete:             { bg: 'bg-emerald-500/15',  text: 'text-emerald-400'},
  'washout reschedule': { bg: 'bg-amber-500/15',    text: 'text-amber-400'  },
  cancelled:            { bg: 'bg-destructive/15',  text: 'text-destructive'},
  postponed:            { bg: 'bg-amber-500/15',    text: 'text-amber-400'  },
};
function statusStyle(s: string) {
  return STATUS_STYLE[s.toLowerCase()] ?? STATUS_STYLE.pending;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function Fixtures({
  onBack,
}: {
  onBack: () => void;
  onNavClick?: (screen: ScreenState) => void;
}) {
  const [data, setData] = useState<FSCData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const [search, setSearch]             = useState('');
  const [selectedClub, setSelectedClub] = useState<FSCClub | null>(null);
  const [savedTeam, setSavedTeam]       = useState(getSavedTeam);
  // Pre-populate team from localStorage so the level starts at 'fixtures' as soon as data loads
  const [selectedTeam, setSelectedTeam] = useState<TeamEntry | null>(() => {
    const t = getSavedTeam();
    return t ? { gradeKey: t.gradeKey, displayGrade: t.displayGrade, count: 0 } : null;
  });

  const deferredSearch = useDeferredValue(search);

  // Load JSON once; set club in the same callback to avoid a flash of the club list
  useEffect(() => {
    const saved = getSavedTeam();
    loadFSCData()
      .then(d => {
        setData(d);
        if (saved) {
          const club = d.clubs.find(c => c.id === saved.clubId);
          if (club) setSelectedClub(club);
        }
        setDataLoading(false);
      })
      .catch(() => setDataLoading(false));
  }, []);

  const handleSave = (club: FSCClub, team: TeamEntry) => {
    const t = { clubId: club.id, clubName: club.name, clubLogo: club.logo, gradeKey: team.gradeKey, displayGrade: team.displayGrade };
    saveTeam(t);
    setSavedTeam(t);
  };

  // Back navigation: if viewing a saved team's fixtures, go straight to parent.
  // Manual browsing (different club/team) still steps back through the levels.
  const handleBack = () => {
    const isOnSavedTeam = savedTeam &&
      selectedClub?.id === savedTeam.clubId &&
      selectedTeam?.gradeKey === savedTeam.gradeKey;
    if (isOnSavedTeam) { onBack(); return; }
    if (selectedTeam) { setSelectedTeam(null); return; }
    if (selectedClub) { setSelectedClub(null); setSearch(''); return; }
    onBack();
  };

  // Filtered clubs
  const filteredClubs = useMemo(() => {
    if (!data) return [];
    const q = deferredSearch.trim().toLowerCase();
    return q ? data.clubs.filter(c => c.name.toLowerCase().includes(q)) : data.clubs;
  }, [data, deferredSearch]);

  // Teams within selected club
  const teams = useMemo(
    () => (data && selectedClub ? teamsForClub(data.fixtures, selectedClub.name, data.clubs) : []),
    [data, selectedClub]
  );

  // Fixtures for selected team, grouped by date
  const fixtureGroups = useMemo(() => {
    if (!data || !selectedClub || !selectedTeam) return [];
    return groupByDate(fixturesForTeam(data.fixtures, selectedClub.name, selectedTeam.gradeKey, data.clubs));
  }, [data, selectedClub, selectedTeam]);

  const totalFixtures = fixtureGroups.reduce((s, g) => s + g.fixtures.length, 0);

  const level = !selectedClub ? 'clubs' : !selectedTeam ? 'teams' : 'fixtures';

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden animate-in fade-in slide-in-from-right-10 duration-700">

      {/* ── Header ── */}
      <div className="px-6 pt-12 pb-3 flex items-center gap-4 shrink-0">
        <button
          onClick={handleBack}
          className="p-3 bg-white/5 rounded-full text-white hover:bg-white/10 transition-all active:scale-95"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-headline font-bold uppercase tracking-tight truncate">
            {level === 'clubs' && 'Fixtures'}
            {level === 'teams' && selectedClub!.name}
            {level === 'fixtures' && selectedTeam!.displayGrade}
          </h3>
          {level === 'teams' && (
            <p className="text-[8px] font-bold uppercase tracking-widest text-white/30 mt-0.5">{teams.length} team{teams.length !== 1 ? 's' : ''}</p>
          )}
          {level === 'fixtures' && (
            <p className="text-[8px] font-bold uppercase tracking-widest text-white/30 mt-0.5">{selectedClub!.name} · {totalFixtures} fixtures</p>
          )}
        </div>
        {level !== 'clubs' && (
          <img
            src={selectedClub!.logo}
            alt=""
            className="h-9 w-9 rounded-xl object-contain bg-white/5 shrink-0"
          />
        )}
      </div>

      {/* ── Search (club list only) ── */}
      {level === 'clubs' && (
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
      {!dataLoading && level === 'clubs' && (
        <div className="flex-1 overflow-y-auto px-6 space-y-2 pb-10">
          {filteredClubs.length === 0 && (
            <p className="text-center text-[9px] font-bold uppercase tracking-widest text-white/20 py-10">No clubs found</p>
          )}
          {filteredClubs.map(club => (
            <button
              key={club.id}
              onClick={() => setSelectedClub(club)}
              className="w-full flex items-center gap-4 bg-white/5 border border-white/8 rounded-2xl px-4 py-3 hover:bg-white/8 active:scale-[0.98] transition-all"
            >
              <img src={club.logo} alt={club.name} className="h-10 w-10 rounded-xl object-contain bg-white/5 shrink-0" />
              <p className="flex-1 text-left text-sm font-bold text-white leading-tight truncate">{club.name}</p>
              {savedTeam?.clubId === club.id && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/15 border border-primary/25 shrink-0">
                  <Star size={8} className="text-primary fill-primary" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-primary">My Club</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Team list ── */}
      {!dataLoading && level === 'teams' && (
        <div className="flex-1 overflow-y-auto px-6 space-y-2 pb-10">
          <p className="text-[8px] font-bold uppercase tracking-widest text-white/30 pb-1">
            Select your team
          </p>
          {teams.length === 0 && (
            <p className="text-center text-[9px] font-bold uppercase tracking-widest text-white/20 py-10">No teams found</p>
          )}
          {teams.map(team => {
            const isMine = savedTeam?.clubId === selectedClub!.id && savedTeam?.gradeKey === team.gradeKey;
            return (
              <button
                key={team.gradeKey}
                onClick={() => setSelectedTeam(team)}
                className="w-full flex items-center gap-4 bg-white/5 border border-white/8 rounded-2xl px-4 py-4 hover:bg-white/8 active:scale-[0.98] transition-all"
              >
                <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Users size={14} className="text-white/30" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-bold text-white truncate">{team.displayGrade}</p>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-white/30 mt-0.5">{team.count} fixture{team.count !== 1 ? 's' : ''}</p>
                </div>
                {isMine && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/15 border border-primary/25 shrink-0">
                    <Star size={8} className="text-primary fill-primary" />
                    <span className="text-[7px] font-black uppercase tracking-widest text-primary">My Team</span>
                  </div>
                )}
                <ChevronLeft size={14} className="text-white/20 rotate-180 shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {/* ── Fixture list ── */}
      {!dataLoading && level === 'fixtures' && (
        <div className="flex-1 overflow-y-auto pb-10">
          {/* My Team button */}
          <div className="px-6 pb-4">
            <button
              onClick={() => handleSave(selectedClub!, selectedTeam!)}
              className={cn(
                "w-full h-10 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                savedTeam?.clubId === selectedClub!.id && savedTeam?.gradeKey === selectedTeam!.gradeKey
                  ? "bg-primary/15 border-primary/30 text-primary"
                  : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20"
              )}
            >
              <Star size={10} className={savedTeam?.clubId === selectedClub!.id && savedTeam?.gradeKey === selectedTeam!.gradeKey ? "fill-primary text-primary" : ""} />
              {savedTeam?.clubId === selectedClub!.id && savedTeam?.gradeKey === selectedTeam!.gradeKey
                ? 'My Team — Saved'
                : 'Set as My Team'}
            </button>
          </div>

          {fixtureGroups.length === 0 && (
            <p className="text-center text-[9px] font-bold uppercase tracking-widest text-white/20 py-10 px-6">No fixtures found</p>
          )}

          {fixtureGroups.map(group => (
            <div key={group.dateKey}>
              <div className="sticky top-0 z-10 px-6 py-2 bg-background/90 backdrop-blur-sm border-b border-white/5">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">{group.dayLabel}</p>
              </div>
              <div className="px-6 space-y-3 pt-3 pb-4">
                {group.fixtures.map(fixture => (
                  <FixtureCard
                    key={fixture.id}
                    fixture={fixture}
                    clubs={data!.clubs}
                    myClubName={selectedClub!.name}
                    myGradeKey={selectedTeam!.gradeKey}
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
  fixture, clubs, myClubName, myGradeKey,
}: {
  fixture: FSCFixture;
  clubs: FSCClub[];
  myClubName: string;
  myGradeKey: string;
}) {
  const local = parseMatchDate(fixture.matchDate);
  const kickoff = formatKickoff(local);
  const home = parseTeamName(fixture.homeTeam.name, clubs);
  const away = parseTeamName(fixture.awayTeam.name, clubs);
  const myQ = myClubName.toLowerCase();

  const homeGradeKey = home.grade.replace(/\s+(Male|Female)$/i, '').trim().toLowerCase();
  const awayGradeKey = away.grade.replace(/\s+(Male|Female)$/i, '').trim().toLowerCase();
  const iAmHome = home.clubName.toLowerCase() === myQ && homeGradeKey === myGradeKey;
  const hasScore = fixture.homeTeam.score !== null && fixture.awayTeam.score !== null;
  const ss = statusStyle(fixture.status);

  return (
    <div className="rounded-2xl bg-white/5 border border-white/8 overflow-hidden">
      {/* Meta */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-white/10 text-white/50">{fixture.round}</span>
          <span className={cn("text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded", ss.bg, ss.text)}>{fixture.status}</span>
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
          <TeamCol logo={fixture.homeTeam.logo} name={home.clubName} grade={home.grade} highlight={iAmHome} />
          <div className="shrink-0 flex flex-col items-center">
            {hasScore
              ? <span className="text-2xl font-black text-white tabular-nums">{fixture.homeTeam.score} – {fixture.awayTeam.score}</span>
              : <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">vs</span>
            }
          </div>
          <TeamCol logo={fixture.awayTeam.logo} name={away.clubName} grade={away.grade} highlight={!iAmHome} />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/5 px-4 py-2.5 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-white/40">
            <Clock size={9} />{kickoff}
          </div>
          <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-white/40">
            <MapPin size={9} />{fixture.groundLocation} — Field {fixture.fieldNumber}
          </div>
        </div>
        <p className="text-[7px] font-bold uppercase tracking-widest text-white/20 truncate max-w-[130px]">
          {fixture.leagueTierName}
        </p>
      </div>
    </div>
  );
}

function TeamCol({ logo, name, grade, highlight }: { logo: string; name: string; grade: string; highlight: boolean }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-1.5 text-center">
      <img src={logo} alt={name} className="h-11 w-11 object-contain rounded-xl bg-white/5" />
      <div>
        <p className={cn("text-[9px] font-black uppercase leading-tight tracking-tight", highlight ? "text-white" : "text-white/45")}>{name}</p>
        {grade && <p className="text-[7px] font-bold text-white/25 mt-0.5 uppercase tracking-widest leading-none">{grade.replace(/\s+(Male|Female)$/i, '')}</p>}
      </div>
    </div>
  );
}
