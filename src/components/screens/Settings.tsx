
"use client";

import React, { useState } from 'react';
import {
  ChevronLeft, LogOut, User, Ruler, Clock, Shield, Globe, Search,
  Loader2, CheckCircle2, Activity, Bandage, Thermometer, Sun, Moon,
  Palette, Info, Mail, ExternalLink, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import type { UserProfile, ScreenState } from '../GamedayFlow';
import { COUNTRIES, leaguesForCountry, leagueById } from '@/lib/global-leagues';
import { SPORT_NAMES, getSportConfig } from '@/lib/sports-config';
import { cn } from '@/lib/utils';
import NavBar from '@/components/NavBar';

export type AppTheme = 'dark' | 'light' | 'blossom' | 'royal' | 'mono';

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

const THEMES: { id: AppTheme; label: string; swatch: string; desc: string }[] = [
  { id: 'dark',    label: 'Dark',    swatch: '#ffffff', desc: 'Default'        },
  { id: 'light',   label: 'Light',   swatch: '#000000', desc: 'Bright mode'   },
  { id: 'blossom', label: 'Blossom', swatch: '#f472b6', desc: 'Pink accent'   },
  { id: 'royal',   label: 'Royal',   swatch: '#fbbf24', desc: 'Gold accent'   },
  { id: 'mono',    label: 'Mono',    swatch: '#94a3b8', desc: 'Slate accent'  },
];

export default function Settings({
  profile,
  onBack,
  onNavClick,
  onChangeTeam,
  onUpdateProfile,
  onFixtureScanner,
  theme,
  onSetTheme,
}: {
  profile: UserProfile;
  onBack: () => void;
  onNavClick: (screen: ScreenState) => void;
  onChangeTeam: () => void;
  onUpdateProfile: (data: Partial<UserProfile>) => void;
  onFixtureScanner: () => void;
  theme?: AppTheme;
  onSetTheme?: (t: AppTheme) => void;
}) {
  const auth = useAuth();

  const [proCountry, setProCountry] = useState(() =>
    profile.proLeagueId ? (leagueById(profile.proLeagueId)?.country ?? '') : ''
  );
  const [proLeagueId, setProLeagueId] = useState(profile.proLeagueId ?? '');
  const [proClubId, setProClubId] = useState(profile.proClubId ?? '');
  const [displayName, setDisplayName] = useState(profile.displayName ?? '');
  const [fullName, setFullName] = useState(profile.fullName ?? '');

  const proLeagues = proCountry ? leaguesForCountry(proCountry) : [];
  const proClubs = proLeagueId ? (leagueById(proLeagueId)?.clubs ?? []) : [];

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

  function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
          <span className="text-primary">{icon}</span>
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">{title}</h4>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background animate-in slide-in-from-right-10 duration-500 relative overflow-hidden">
      <div className="px-8 pt-12 pb-6 flex items-center gap-4 shrink-0">
        <button onClick={onBack} className="p-3 bg-white/5 rounded-full text-white hover:bg-white/10 transition-all">
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-xl font-headline font-bold uppercase flex-1 tracking-tight text-center pr-10">Settings</h3>
      </div>

      <ScrollArea className="flex-1 px-8">
        <div className="space-y-10 pb-40">

          {/* ── PROFILE ── */}
          <Section icon={<User size={14} />} title="Profile">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">Username</Label>
                <Input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  onBlur={() => { if (displayName !== profile.displayName) onUpdateProfile({ displayName }); }}
                  placeholder="@yourhandle"
                  className="h-11 bg-white/5 border-white/10 text-xs placeholder:text-white/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">Full Name</Label>
                <Input
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  onBlur={() => { if (fullName !== profile.fullName) onUpdateProfile({ fullName }); }}
                  placeholder="Your full name"
                  className="h-11 bg-white/5 border-white/10 text-xs placeholder:text-white/20"
                />
              </div>
            </div>
          </Section>

          {/* ── APPEARANCE ── */}
          {onSetTheme && (
            <Section icon={<Palette size={14} />} title="Appearance">
              <div className="grid grid-cols-5 gap-2">
                {THEMES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => onSetTheme(t.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 py-3 rounded-2xl border transition-all active:scale-95",
                      theme === t.id
                        ? "bg-white/8 border-primary"
                        : "bg-white/3 border-white/8 hover:border-white/20"
                    )}
                  >
                    <div
                      className="h-5 w-5 rounded-full border border-white/10"
                      style={{ backgroundColor: t.swatch }}
                    />
                    <span className={cn(
                      "text-[7px] font-black uppercase tracking-widest",
                      theme === t.id ? "text-primary" : "text-white/40"
                    )}>{t.label}</span>
                  </button>
                ))}
              </div>
            </Section>
          )}

          {/* ── TRAINING STATUS ── */}
          <Section icon={<Activity size={14} />} title="Training Status">
            <p className="text-[9px] text-white/25 font-medium uppercase tracking-wider">Affects today's AI plan — resets daily</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'healthy', label: 'Healthy',  icon: <Activity size={14} />,    active: 'bg-primary/15 border-primary text-primary'          },
                { value: 'injured', label: 'Injured',  icon: <Bandage size={14} />,     active: 'bg-amber-500/15 border-amber-500 text-amber-400'     },
                { value: 'sick',    label: 'Sick',     icon: <Thermometer size={14} />, active: 'bg-blue-500/15 border-blue-500 text-blue-400'        },
              ] as const).map(({ value, label, icon, active }) => {
                const isActive = (profile.trainingStatus ?? 'healthy') === value;
                return (
                  <button
                    key={value}
                    onClick={() => onUpdateProfile({ trainingStatus: value })}
                    className={cn(
                      "flex flex-col items-center gap-2 py-3 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all active:scale-95",
                      isActive ? active : "bg-white/4 border-white/8 text-white/30 hover:border-white/20"
                    )}
                  >
                    {icon}{label}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* ── ATHLETE IDENTITY ── */}
          <Section icon={<User size={14} />} title="Athlete Identity">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">Sport</Label>
                <Select value={profile.sport} onValueChange={(val) => onUpdateProfile({ sport: val })}>
                  <SelectTrigger className="h-12 bg-white/5 border-white/10 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-white/20">
                    {SPORT_NAMES.map(sport => <SelectItem key={sport} value={sport}>{sport}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">Position</Label>
                <Select value={profile.position} onValueChange={(val) => onUpdateProfile({ position: val })}>
                  <SelectTrigger className="h-12 bg-white/5 border-white/10 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-white/20">
                    {getSportConfig(profile.sport).positions.map(pos => <SelectItem key={pos} value={pos}>{pos}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Section>

          {/* ── PHYSICAL CALIBRATION ── */}
          <Section icon={<Ruler size={14} />} title="Body Stats">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">Height</Label>
                <Select value={profile.height || ""} onValueChange={(val) => onUpdateProfile({ height: val })}>
                  <SelectTrigger className="h-10 bg-white/5 border-white/10 text-[10px]"><SelectValue placeholder="--" /></SelectTrigger>
                  <SelectContent className="bg-card border-white/20">
                    {heightOptions.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">Weight</Label>
                <Select value={profile.weight || ""} onValueChange={(val) => onUpdateProfile({ weight: val })}>
                  <SelectTrigger className="h-10 bg-white/5 border-white/10 text-[10px]"><SelectValue placeholder="--" /></SelectTrigger>
                  <SelectContent className="bg-card border-white/20">
                    {weightOptions.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">Age</Label>
                <Select value={profile.age || ""} onValueChange={(val) => onUpdateProfile({ age: val })}>
                  <SelectTrigger className="h-10 bg-white/5 border-white/10 text-[10px]"><SelectValue placeholder="--" /></SelectTrigger>
                  <SelectContent className="bg-card border-white/20">
                    {ageOptions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Section>

          {/* ── SCHEDULE ── */}
          <Section icon={<Clock size={14} />} title="Schedule">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">School Start</Label>
                <Select value={profile.schoolStartTime} onValueChange={(val) => onUpdateProfile({ schoolStartTime: val })}>
                  <SelectTrigger className="h-12 bg-white/5 border-white/10 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-white/20">
                    {TIME_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">School End</Label>
                <Select value={profile.schoolEndTime} onValueChange={(val) => onUpdateProfile({ schoolEndTime: val })}>
                  <SelectTrigger className="h-12 bg-white/5 border-white/10 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-white/20">
                    {TIME_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">Training Days</Label>
              <div className="flex gap-2 flex-wrap">
                {DAYS_OF_WEEK.map(day => {
                  const active = (profile.trainingDays ?? []).includes(day);
                  return (
                    <button
                      key={day}
                      onClick={() => {
                        const current = profile.trainingDays ?? [];
                        onUpdateProfile({ trainingDays: active ? current.filter(d => d !== day) : [...current, day] });
                      }}
                      className={cn(
                        "px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                        active ? "bg-primary border-primary text-primary-foreground" : "bg-transparent border-white/10 text-white/40"
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
                <SelectTrigger className="h-12 bg-white/5 border-white/10 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-white/20">
                  {TIME_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </Section>

          {/* ── FOLLOW A PRO TEAM ── */}
          <Section icon={<Globe size={14} />} title="Follow a Pro Team">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">Country</Label>
                <Select value={proCountry} onValueChange={(val) => { setProCountry(val); setProLeagueId(''); setProClubId(''); }}>
                  <SelectTrigger className="h-12 bg-white/5 border-white/10 text-xs"><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent className="bg-card border-white/20">
                    {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {proCountry && (
                <div className="space-y-2">
                  <Label className="text-[8px] font-bold uppercase text-white/30 tracking-widest">League</Label>
                  <Select value={proLeagueId} onValueChange={(val) => { setProLeagueId(val); setProClubId(''); }}>
                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-xs"><SelectValue placeholder="Select league" /></SelectTrigger>
                    <SelectContent className="bg-card border-white/20">
                      {proLeagues.map(l => <SelectItem key={l.id} value={l.id}>{l.flag} {l.name}</SelectItem>)}
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
                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-xs"><SelectValue placeholder="Select club" /></SelectTrigger>
                    <SelectContent className="bg-card border-white/20">
                      {proClubs.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {profile.proClubName && (
                <p className="text-[9px] font-black uppercase tracking-widest text-primary">Following: {profile.proClubName}</p>
              )}
            </div>
          </Section>

          {/* ── MY PLAYING TEAM ── */}
          {profile.sport !== 'Soccer' && (
            <Section icon={<Search size={14} />} title="My Playing Team">
              {linkedTeam && (
                <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
                  {linkedTeam.strBadge && <img src={linkedTeam.strBadge} alt="" className="h-8 w-8 object-contain rounded" />}
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">{linkedTeam.strTeam}</p>
                    <p className="text-[8px] text-white/30 uppercase tracking-wider">Linked for live fixtures</p>
                  </div>
                  <button
                    onClick={() => { try { localStorage.removeItem('gameday_sportsdb_team'); } catch {} setLinkedTeam(null); }}
                    className="text-[8px] font-bold uppercase tracking-widest text-white/30 hover:text-white/60"
                  >Remove</button>
                </div>
              )}
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
                    <button key={t.idTeam} onClick={() => linkTeam(t)} className="w-full flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-left hover:bg-white/10 transition-all active:scale-[0.98]">
                      {t.strBadge && <img src={t.strBadge} alt="" className="h-8 w-8 object-contain rounded shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black uppercase tracking-wider truncate">{t.strTeam}</p>
                        <p className="text-[8px] text-white/40 uppercase tracking-widest">{t.strLeague} • {t.strCountry}</p>
                      </div>
                      <CheckCircle2 size={16} className="text-primary/40 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* ── ABOUT ── */}
          <Section icon={<Info size={14} />} title="About">
            <div className="space-y-3">
              <div className="px-4 py-4 rounded-2xl bg-white/3 border border-white/6 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Gameday</p>
                <p className="text-[8px] text-white/30 font-medium">Built by Marco & team</p>
                <p className="text-[8px] text-white/20 font-medium">AI performance coaching for athletes</p>
              </div>
              <a
                href="https://tiktok.com/@thegamedayapp"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/3 border border-white/8 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-3">
                  <Sparkles size={15} className="text-primary" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-white/70">TikTok</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-white/30">@thegamedayapp</span>
                  <ExternalLink size={12} className="text-white/20" />
                </div>
              </a>
              <a
                href="mailto:gamedayapp@outlook.com"
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/3 border border-white/8 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-3">
                  <Mail size={15} className="text-primary" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-white/70">Contact</span>
                </div>
                <span className="text-[9px] font-bold text-white/30">gamedayapp@outlook.com</span>
              </a>
              <a
                href="mailto:gamedayapp@outlook.com?subject=Feature%20Suggestion"
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-primary/8 border border-primary/15 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-3">
                  <Sparkles size={15} className="text-primary" />
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-wider text-primary">Suggest a Feature</p>
                    <p className="text-[8px] text-white/25 font-medium">Tell us what to build next</p>
                  </div>
                </div>
                <ExternalLink size={12} className="text-primary/40" />
              </a>
            </div>
          </Section>

          {/* ── ACTIONS ── */}
          <div className="pt-6 border-t border-white/5 flex flex-col gap-3">
            <Button variant="outline" className="h-14 rounded-xl border-white/10 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/5" onClick={onFixtureScanner}>
              <Search size={16} /> Scan Fixture Schedule
            </Button>
            <Button variant="outline" className="h-14 rounded-xl border-white/10 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/5" onClick={onChangeTeam}>
              <Shield size={16} /> Change My Team
            </Button>
            <Button variant="destructive" className="h-14 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2" onClick={handleLogout}>
              <LogOut size={16} /> Logout
            </Button>
          </div>

        </div>
      </ScrollArea>

      <NavBar active="settings" onNavClick={onNavClick} />
    </div>
  );
}
