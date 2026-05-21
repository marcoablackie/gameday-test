"use client";

import React, { useState, useRef } from 'react';
import { ChevronLeft, Camera, Upload, CheckCircle2, AlertCircle, Loader2, Calendar, MapPin, Home, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { extractFixtures } from '@/ai/flows/extract-fixtures';
import type { GameFixture } from '@/ai/flows/extract-fixtures';
import type { ScreenState } from '../GamedayFlow';

type SavedGame = GameFixture & { id: string; debrief?: object };

type Props = {
  onBack: () => void;
  onNavClick: (screen: ScreenState) => void;
  savedGames: SavedGame[];
  onSaveGames: (games: GameFixture[]) => void;
  onDeleteGame: (id: string) => void;
};

function formatGameDate(dateStr: string) {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

function daysUntil(dateStr: string, timeStr: string) {
  const gameDate = new Date(`${dateStr}T${timeStr || '00:00'}:00`);
  const now = new Date();
  const diff = gameDate.getTime() - now.getTime();
  if (diff < 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days === 0) return `${hours}h away`;
  if (days === 1) return 'Tomorrow';
  return `${days} days`;
}

export default function Fixtures({ onBack, onNavClick, savedGames, onSaveGames, onDeleteGame }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [extractedGames, setExtractedGames] = useState<GameFixture[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Please upload an image file.'); return; }
    setLoading(true);
    setError(null);
    setExtractedGames(null);
    setSaved(false);

    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    try {
      const reader = new FileReader();
      const dataUri = await new Promise<string>((res, rej) => {
        reader.onload = () => res(reader.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });

      const result = await extractFixtures({ photoDataUri: dataUri });

      if (result.confidence < 0.3 || result.games.length === 0) {
        setError(result.note || "Couldn't find any fixtures in that image. Try a clearer screenshot of your schedule.");
        setLoading(false);
        return;
      }

      setExtractedGames(result.games);
    } catch {
      setError('Failed to analyse the image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!extractedGames) return;
    onSaveGames(extractedGames);
    setSaved(true);
    setExtractedGames(null);
    setPreviewUrl(null);
  };

  const upcomingGames = savedGames.filter(g => new Date(g.date + 'T00:00:00') >= new Date(new Date().toDateString()));
  const pastGames = savedGames.filter(g => new Date(g.date + 'T00:00:00') < new Date(new Date().toDateString()));

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden animate-in fade-in slide-in-from-right-10 duration-700">
      <div className="px-6 pt-12 pb-4 flex items-center gap-4 shrink-0">
        <button onClick={onBack} className="p-3 bg-white/5 rounded-full text-white hover:bg-white/10 transition-all">
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-xl font-headline font-bold uppercase flex-1 tracking-tight">Fixtures</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-10">

        {/* Upload zone */}
        {!loading && !extractedGames && (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-3xl border-2 border-dashed border-white/10 bg-white/3 p-8 flex flex-col items-center gap-3 text-center hover:border-white/20 hover:bg-white/5 transition-all active:scale-[0.98]"
          >
            <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Camera size={22} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-white">Scan Fixture List</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mt-1">Upload a screenshot from your league app</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <Upload size={10} className="text-white/40" />
              <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Dribl · PlayHQ · SportsTG · Any App</span>
            </div>
          </button>
        )}

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

        {/* Loading */}
        {loading && (
          <div className="w-full rounded-3xl bg-white/5 border border-white/5 p-10 flex flex-col items-center gap-4">
            {previewUrl && <img src={previewUrl} alt="Preview" className="w-full max-h-40 object-contain rounded-xl opacity-40" />}
            <Loader2 size={28} className="text-primary animate-spin" />
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 animate-pulse">Reading fixtures...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-5 flex gap-3 items-start">
            <AlertCircle size={16} className="text-destructive shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-xs text-white/60 font-medium leading-snug">{error}</p>
              <button onClick={() => { setError(null); setPreviewUrl(null); }} className="text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white">Try again</button>
            </div>
          </div>
        )}

        {/* Extracted preview */}
        {extractedGames && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">{extractedGames.length} games found</p>
              <button onClick={() => { setExtractedGames(null); setPreviewUrl(null); }} className="text-[8px] font-black uppercase tracking-widest text-white/20 hover:text-white">Cancel</button>
            </div>
            {extractedGames.map((g, i) => (
              <div key={i} className="rounded-2xl bg-white/5 border border-white/8 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-headline font-black uppercase text-white">{g.opponent}</p>
                  <span className={cn("text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded", g.isHome ? "bg-primary/20 text-primary" : "bg-white/10 text-white/40")}>
                    {g.isHome ? 'Home' : 'Away'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest text-white/40">
                  <div className="flex items-center gap-1"><Calendar size={10} />{formatGameDate(g.date)} · {g.time}</div>
                  {g.venue !== 'TBC' && <div className="flex items-center gap-1"><MapPin size={10} />{g.venue}</div>}
                </div>
              </div>
            ))}
            {saved ? (
              <div className="flex items-center justify-center gap-2 py-3">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Saved to your schedule</p>
              </div>
            ) : (
              <Button onClick={handleConfirm} className="w-full h-12 rounded-2xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest neon-glow">
                Save {extractedGames.length} Games
              </Button>
            )}
          </div>
        )}

        {/* Saved upcoming games */}
        {upcomingGames.length > 0 && (
          <div className="space-y-3">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 border-b border-white/5 pb-2">Upcoming</p>
            {upcomingGames.map((g) => {
              const countdown = daysUntil(g.date, g.time);
              return (
                <div key={g.id} className="rounded-2xl bg-white/5 border border-white/8 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-headline font-black uppercase text-white">{g.opponent}</p>
                    <div className="flex items-center gap-2">
                      {countdown && <span className="text-[8px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">{countdown}</span>}
                      <button onClick={() => onDeleteGame(g.id)} className="text-white/20 hover:text-destructive transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest text-white/40">
                    <div className="flex items-center gap-1"><Calendar size={10} />{formatGameDate(g.date)}</div>
                    {g.time !== '00:00' && <span>{g.time}</span>}
                    {g.venue !== 'TBC' && <div className="flex items-center gap-1"><MapPin size={10} />{g.venue}</div>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Home size={9} className={g.isHome ? "text-primary" : "text-white/20"} />
                    <span className="text-[8px] font-bold uppercase tracking-widest text-white/30">{g.isHome ? 'Home' : 'Away'} · {g.competition}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Past games */}
        {pastGames.length > 0 && (
          <div className="space-y-3">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 border-b border-white/5 pb-2">Past Games</p>
            {pastGames.map((g) => (
              <div key={g.id} className={cn("rounded-2xl border p-4 space-y-2", g.debrief ? "bg-emerald-500/5 border-emerald-500/15" : "bg-white/3 border-white/5 opacity-50")}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-headline font-black uppercase text-white/60">{g.opponent}</p>
                  <div className="flex items-center gap-2">
                    {g.debrief
                      ? <span className="text-[7px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Logged</span>
                      : <span className="text-[7px] font-black uppercase tracking-widest text-white/20 bg-white/5 px-2 py-0.5 rounded-full">No debrief</span>
                    }
                    <button onClick={() => onDeleteGame(g.id)} className="text-white/20 hover:text-destructive transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">{formatGameDate(g.date)}</p>
              </div>
            ))}
          </div>
        )}

        {savedGames.length === 0 && !loading && !extractedGames && !error && (
          <p className="text-center text-[9px] font-bold uppercase tracking-widest text-white/20 py-4">No fixtures saved yet</p>
        )}
      </div>
    </div>
  );
}
