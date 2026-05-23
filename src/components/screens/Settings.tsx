
"use client";

import React, { useState } from 'react';
import { ChevronLeft, LogOut, User, Ruler, Clock, Shield, Globe, Search, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import type { UserProfile } from '../GamedayFlow';
import { COUNTRIES, leaguesForCountry, leagueById } from '@/lib/global-leagues';
import { SPORT_NAMES, getSportConfig } from '@/lib/sports-config';
import { cn } from '@/lib/utils';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TIME_OPTIONS = Array.from({ length: 24 }).map((_, i) => {
  const hour = i.toString().padStart(2, '0');
  const hNum = i % 12 || 12;
  const ampm = i >= 12 ? 'PM' : 'AM';
  return { value: `${hour}:00`, label: `${hNum}:00 ${ampm}` };
});

const heightOptions = Array.from({ length: 25 }).map((_, i) => {
  const totalInches = i + 60;
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'${inches}"`;
});

const weightOptions = Array.from({ length: 41 }).map((_, i) => `${(i * 5) + 100} lbs`);
const ageOptions = Array.from({ length: 14 }).map((_, i) => (i + 12).toString());

export default function Settings({
  profile,
  onBack,
  onChangeTeam,
  onUpdateProfile
}: {
  profile: UserProfile,
  onBack: () => void,
  onChangeTeam: () => void,
  onUpdateProfile: (data: Partial<UserProfile>) => void
}) {
  const auth = useAuth();

  const [proCountry, setProCountry] = useState(() =>
    profile.proLeagueId ? (leagueById(profile.proLeagueId)?.country ?? '') : ''
  );
  const [proLeagueId, setProLeagueId] = useState(profile.proLeagueId ?? '');
  const [proClubId, setProClubId] = useState(profile.proClubId ?? '');

  const proLeagues = proCountry ? leaguesForCountry(proCountry) : [];
  const proClubs = proLeagueId ? (leagueById(proLeagueId)?.clubs ?? []) : [];

  // My team search (TheSportsDB — for non-soccer / all sports live fixtures)
  const [teamQuery, setTeamQuery] = useState('');
  const [teamResults, setTeamResults] = useState<Array<{ idTeam: string; strTeam: string; strBadge: string; strLeague: string; strCountry: string }>>([]);
  const [teamSearching, setTeamSearching] = useState(false);
  const [linkedTeam, setLinkedTeam] = useState<{ idTeam: string; strTeam: string; strBadge: string } | null>(() => {
    try { const r = localStorage.getItem('gameday_sportsdb_team'); return r ? JSON.parse(r) : null; } catch { return null; }
  });

  const searchTeams = async () => {
    if (teamQuery.trim().length < 2) return;
    setTeamSearching(true);
    setTeamResults([]);
    try {
      const res = await fetch(`/api/search-teams?q=${encodeURIComponent(teamQuery.trim())}&sport=${encodeURIComponent(profile.sport)}`);
      const data = await res.json();
      setTeamResults(data.teams ?? []);
    } catch {}
    setTeamSearching(false);
  };

  const linkTeam = (t: { idTeam: string; strTeam: string; strBadge: string }) => {
    const entry = { idTeam: t.idTeam, strTeam: t.strTeam, strBadge: t.strBadge };
    try { localStorage.setItem('gameday_sportsdb_team', JSON.stringify(entry)); } catch {}
    setLinkedTeam(entry);
    setTeamResults([]);
    setTeamQuery('');
  };

  const handleLogout = async () => {
    try { localStorage.removeItem('gameday_last_uid'); } catch {}
    if (auth) await signOut(auth);
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-full bg-background animate-in slide-in-from-right-10 duration-500">
      <div className="px-8 pt-12 pb-6 flex items-center gap-4 shrink-0">
        <button onClick={onBack} className="p-3 bg-white/5 rounded-full text-white hover:bg-white/10 transition-all">
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-xl font-headline font-bold uppercase flex-1 tracking-tight text-center pr-10">Settings</h3>
      </div>

      <ScrollArea className="flex-1 px-8">
        <div className="space-y-10 pb-20">
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <User size={14} className="text-primary" />
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Athlete Identity</h4>
            </div>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">Sport</Label>
                <Select value={profile.sport} onValueChange={(val) => onUpdateProfile({ sport: val })}>
                  <SelectTrigger className="h-12 bg-white/5 border-white/10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/20">
                    {SPORT_NAMES.map(sport => (
                      <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">Position</Label>
                <Select value={profile.position} onValueChange={(val) => onUpdateProfile({ position: val })}>
                  <SelectTrigger className="h-12 bg-white/5 border-white/10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/20">
                    {getSportConfig(profile.sport).positions.map(pos => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Clock size={14} className="text-primary" />
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Schedule Lockout</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">School Start</Label>
                <Select value={profile.schoolStartTime} onValueChange={(val) => onUpdateProfile({ schoolStartTime: val })}>
                  <SelectTrigger className="h-12 bg-white/5 border-white/10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/20">
                    {TIME_OPTIONS.map(time => (
                      <SelectItem key={time.value} value={time.value}>{time.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">School End</Label>
                <Select value={profile.schoolEndTime} onValueChange={(val) => onUpdateProfile({ schoolEndTime: val })}>
                  <SelectTrigger className="h-12 bg-white/5 border-white/10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/20">
                    {TIME_OPTIONS.map(time => (
                      <SelectItem key={time.value} value={time.value}>{time.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Clock size={14} className="text-primary" />
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Training Schedule</h4>
            </div>

            <div className="space-y-3">
              <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">Training Days</Label>
              <p className="text-[9px] text-white/20 font-medium uppercase tracking-wider">Rest days are auto-calculated for recovery</p>
              <div className="flex gap-2 flex-wrap">
                {DAYS_OF_WEEK.map(day => {
                  const active = (profile.trainingDays ?? []).includes(day);
                  return (
                    <button
                      key={day}
                      onClick={() => {
                        const current = profile.trainingDays ?? [];
                        onUpdateProfile({
                          trainingDays: active ? current.filter(d => d !== day) : [...current, day]
                        });
                      }}
                      className={cn(
                        "px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                        active
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-transparent border-white/10 text-white/40 hover:border-white/30"
                      )}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">Training Time</Label>
              <Select value={profile.trainingTime || '16:00'} onValueChange={(val) => onUpdateProfile({ trainingTime: val })}>
                <SelectTrigger className="h-12 bg-white/5 border-white/10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/20">
                  {TIME_OPTIONS.map(time => (
                    <SelectItem key={time.value} value={time.value}>{time.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Ruler size={14} className="text-primary" />
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Physical Calibration</h4>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">Height</Label>
                <Select value={profile.height || ""} onValueChange={(val) => onUpdateProfile({ height: val })}>
                  <SelectTrigger className="h-10 bg-white/5 border-white/10 text-[10px]">
                    <SelectValue placeholder="--" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/20">
                    {heightOptions.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">Weight</Label>
                <Select value={profile.weight || ""} onValueChange={(val) => onUpdateProfile({ weight: val })}>
                  <SelectTrigger className="h-10 bg-white/5 border-white/10 text-[10px]">
                    <SelectValue placeholder="--" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/20">
                    {weightOptions.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">Age</Label>
                <Select value={profile.age || ""} onValueChange={(val) => onUpdateProfile({ age: val })}>
                  <SelectTrigger className="h-10 bg-white/5 border-white/10 text-[10px]">
                    <SelectValue placeholder="--" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/20">
                    {ageOptions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ── Global Pro Team ── */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Globe size={14} className="text-primary" />
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Follow a Pro Team</h4>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">Country</Label>
                <Select value={proCountry} onValueChange={(val) => { setProCountry(val); setProLeagueId(''); setProClubId(''); }}>
                  <SelectTrigger className="h-12 bg-white/5 border-white/10 text-xs">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/20">
                    {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {proCountry && (
                <div className="space-y-2">
                  <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">League</Label>
                  <Select value={proLeagueId} onValueChange={(val) => { setProLeagueId(val); setProClubId(''); }}>
                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-xs">
                      <SelectValue placeholder="Select league" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/20">
                      {proLeagues.map(l => (
                        <SelectItem key={l.id} value={l.id}>{l.flag} {l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {proLeagueId && (
                <div className="space-y-2">
                  <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">Club</Label>
                  <Select value={proClubId} onValueChange={(val) => {
                    setProClubId(val);
                    const club = proClubs.find(c => c.id === val);
                    if (club) onUpdateProfile({ proLeagueId, proClubId: val, proClubName: club.name });
                  }}>
                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-xs">
                      <SelectValue placeholder="Select club" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/20">
                      {proClubs.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {profile.proClubName && (
                <p className="text-[9px] font-black uppercase tracking-widest text-primary">
                  Following: {profile.proClubName}
                </p>
              )}
            </div>
          </div>

          {/* ── My Playing Team (live fixtures — non-soccer sports) ── */}
          {profile.sport !== 'Soccer' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <Search size={14} className="text-primary" />
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">My Playing Team</h4>
              </div>

              {linkedTeam && (
                <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
                  {linkedTeam.strBadge && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={linkedTeam.strBadge} alt="" className="h-8 w-8 object-contain rounded" />
                  )}
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">{linkedTeam.strTeam}</p>
                    <p className="text-[8px] text-white/30 uppercase tracking-wider">Linked for live fixtures</p>
                  </div>
                  <button
                    onClick={() => { try { localStorage.removeItem('gameday_sportsdb_team'); } catch {} setLinkedTeam(null); }}
                    className="text-[8px] font-bold uppercase tracking-widest text-white/30 hover:text-white/60"
                  >
                    Remove
                  </button>
                </div>
              )}

              <div className="space-y-3">
                <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">Search your team for live fixtures</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                    <Input
                      value={teamQuery}
                      onChange={e => setTeamQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && searchTeams()}
                      placeholder={`Search ${profile.sport} team…`}
                      className="pl-9 h-11 bg-white/5 border-white/10 text-xs placeholder:text-white/20"
                    />
                  </div>
                  <button
                    onClick={searchTeams}
                    disabled={teamSearching || teamQuery.trim().length < 2}
                    className="h-11 px-4 rounded-xl bg-primary text-black text-[10px] font-black uppercase tracking-widest disabled:opacity-40 flex items-center gap-1"
                  >
                    {teamSearching ? <Loader2 size={14} className="animate-spin" /> : 'Search'}
                  </button>
                </div>

                {teamResults.length > 0 && (
                  <div className="space-y-2">
                    {teamResults.map(t => (
                      <button
                        key={t.idTeam}
                        onClick={() => linkTeam(t)}
                        className="w-full flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-left hover:bg-white/10 transition-all active:scale-[0.98]"
                      >
                        {t.strBadge && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.strBadge} alt="" className="h-8 w-8 object-contain rounded shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black uppercase tracking-wider truncate">{t.strTeam}</p>
                          <p className="text-[8px] text-white/40 uppercase tracking-widest">{t.strLeague} • {t.strCountry}</p>
                        </div>
                        <CheckCircle2 size={16} className="text-primary/40 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                {!teamSearching && teamResults.length === 0 && teamQuery.length > 0 && (
                  <p className="text-[9px] text-white/30 text-center py-2">No results — try a different name</p>
                )}
              </div>
            </div>
          )}

          <div className="pt-10 border-t border-white/5 flex flex-col gap-4">
             <Button
               variant="outline"
               className="h-14 rounded-xl border-white/10 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/5"
               onClick={onChangeTeam}
             >
               <Shield size={16} /> Change My Team
             </Button>
             <Button
               variant="destructive"
               className="h-14 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
               onClick={handleLogout}
             >
               <LogOut size={16} /> Logout athlete
             </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
