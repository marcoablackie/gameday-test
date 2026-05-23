"use client";

import React, { useState, useRef } from 'react';
import { ChevronLeft, Camera, Upload, Loader2, X, Check, Calendar, MapPin, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ManualFixture = {
  id: string;
  date: string;
  time: string | null;
  opponent: string;
  venue: string | null;
  isHome: boolean | null;
};

export const MANUAL_FIXTURES_KEY = (uid: string) => `gameday_manual_fixtures_${uid}`;

function formatDisplayDate(iso: string) {
  try {
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch { return iso; }
}

function formatTime(t: string | null) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function FixtureScanner({
  uid,
  onBack,
  onSaved,
}: {
  uid: string;
  onBack: () => void;
  onSaved: () => void;
}) {
  const [step, setStep] = useState<'upload' | 'scanning' | 'review'>('upload');
  const [preview, setPreview] = useState<string | null>(null);
  const [fixtures, setFixtures] = useState<ManualFixture[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = canvasRef.current!;
        const maxDim = 1200;
        const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight, 1));
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const handleFile = async (file: File) => {
    setError(null);
    setSaved(false);
    try {
      const dataUri = await compressImage(file);
      setPreview(dataUri);
      setStep('scanning');

      const res = await fetch('/api/parse-fixtures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoDataUri: dataUri }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `Error ${res.status}`);

      const parsed: ManualFixture[] = (data.fixtures ?? []).map((f: any, i: number) => ({
        id: `manual_${Date.now()}_${i}`,
        date: f.date ?? '',
        time: f.time ?? null,
        opponent: f.opponent ?? 'Unknown',
        venue: f.venue ?? null,
        isHome: f.isHome ?? null,
      })).filter((f: ManualFixture) => f.date && f.opponent && f.opponent !== 'Unknown');

      if (parsed.length === 0) {
        setError("No fixtures found in this image. Make sure the schedule is clearly visible and try again.");
        setStep('upload');
        return;
      }

      setFixtures(parsed);
      setStep('review');
    } catch (err: any) {
      setError(err?.message || "Failed to read fixtures. Try again.");
      setStep('upload');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const removeFixture = (id: string) => {
    setFixtures(prev => prev.filter(f => f.id !== id));
  };

  const saveFixtures = () => {
    try {
      const existing: ManualFixture[] = JSON.parse(localStorage.getItem(MANUAL_FIXTURES_KEY(uid)) || '[]');
      // Merge: add new ones that don't already exist (match by date+opponent)
      const existingKeys = new Set(existing.map(f => `${f.date}_${f.opponent.toLowerCase()}`));
      const toAdd = fixtures.filter(f => !existingKeys.has(`${f.date}_${f.opponent.toLowerCase()}`));
      localStorage.setItem(MANUAL_FIXTURES_KEY(uid), JSON.stringify([...existing, ...toAdd]));
      setSaved(true);
      setTimeout(() => onSaved(), 1200);
    } catch {
      setError("Failed to save. Please try again.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-background animate-in slide-in-from-right-10 duration-500">
      {/* Header */}
      <div className="px-6 pt-10 pb-4 flex items-center gap-4 shrink-0">
        <button onClick={onBack} className="p-3 rounded-full bg-white/5 border border-white/10 active:scale-90 transition-all">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
          <h3 className="text-xl font-headline font-black italic uppercase leading-tight">Fixture Scanner</h3>
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">Photo → Schedule</p>
        </div>
      </div>

      {/* Upload step */}
      {step === 'upload' && (
        <div className="flex-1 flex flex-col px-6 gap-6 pt-4">
          <p className="text-sm text-white/50 leading-relaxed">
            Screenshot your team's upcoming fixtures from WhatsApp, your club website, or any app — then upload it here. AI will extract all the games automatically.
          </p>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4">
              <p className="text-xs text-destructive font-medium">{error}</p>
            </div>
          )}

          {preview && (
            <div className="relative rounded-2xl overflow-hidden border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview" className="w-full object-contain max-h-48" />
            </div>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 max-h-48 rounded-3xl border-2 border-dashed border-white/15 flex flex-col items-center justify-center gap-4 text-white/30 hover:border-primary/40 hover:text-primary/60 transition-all active:scale-[0.98]"
          >
            <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center">
              <ImageIcon size={28} />
            </div>
            <div className="text-center">
              <p className="text-sm font-black uppercase italic tracking-wider">Upload Screenshot</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/20 mt-1">Tap to choose from gallery or take a photo</p>
            </div>
          </button>

          <div className="space-y-2 pb-8">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/20 text-center">Tips for best results</p>
            <div className="grid grid-cols-2 gap-2 text-[8px] text-white/30 font-medium">
              <div className="bg-white/5 rounded-xl p-3">Screenshot the full fixture list, not just one game</div>
              <div className="bg-white/5 rounded-xl p-3">Make sure dates and times are clearly visible</div>
              <div className="bg-white/5 rounded-xl p-3">WhatsApp group messages work great</div>
              <div className="bg-white/5 rounded-xl p-3">Club website or team app screenshots too</div>
            </div>
          </div>
        </div>
      )}

      {/* Scanning step */}
      {step === 'scanning' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
          {preview && (
            <div className="relative rounded-2xl overflow-hidden border border-white/10 w-full max-h-48">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Scanning" className="w-full object-contain max-h-48 opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 size={40} className="text-primary animate-spin" />
              </div>
            </div>
          )}
          <div className="text-center space-y-2">
            <p className="text-sm font-black uppercase italic tracking-widest text-primary animate-pulse">Reading Fixtures...</p>
            <p className="text-[9px] text-white/30 font-medium uppercase tracking-widest">AI is extracting your schedule</p>
          </div>
        </div>
      )}

      {/* Review step */}
      {step === 'review' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pb-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/30">
              Found {fixtures.length} fixture{fixtures.length !== 1 ? 's' : ''} — remove any that look wrong
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-3">
            {fixtures.map(f => (
              <div key={f.id} className="bg-white/5 border border-white/8 rounded-2xl p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase italic tracking-wider truncate">{f.opponent}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-[8px] text-white/40 font-bold uppercase tracking-widest">
                      <Calendar size={9} /> {formatDisplayDate(f.date)}{f.time ? ` · ${formatTime(f.time)}` : ''}
                    </span>
                    {f.venue && (
                      <span className="flex items-center gap-1 text-[8px] text-white/30 font-bold uppercase tracking-widest">
                        <MapPin size={9} /> {f.venue}
                      </span>
                    )}
                    {f.isHome !== null && (
                      <span className={cn(
                        "text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                        f.isHome ? "bg-primary/15 text-primary" : "bg-white/10 text-white/40"
                      )}>
                        {f.isHome ? 'Home' : 'Away'}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeFixture(f.id)}
                  className="p-2 rounded-full bg-white/5 text-white/30 hover:text-destructive hover:bg-destructive/10 transition-all active:scale-90 shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            {fixtures.length === 0 && (
              <div className="text-center py-12">
                <p className="text-white/20 text-xs font-black uppercase tracking-widest">All fixtures removed</p>
                <button onClick={() => setStep('upload')} className="mt-4 text-primary text-[10px] font-black uppercase tracking-widest">
                  Try another photo
                </button>
              </div>
            )}
          </div>

          <div className="px-6 pb-12 pt-3 flex flex-col gap-3 border-t border-white/5 shrink-0">
            <button
              onClick={saveFixtures}
              disabled={fixtures.length === 0 || saved}
              className={cn(
                "w-full h-14 rounded-2xl flex items-center justify-center gap-2 font-black uppercase italic text-sm tracking-wider transition-all",
                saved
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : fixtures.length > 0
                  ? "bg-primary text-black neon-glow active:scale-[0.98]"
                  : "bg-white/5 text-white/20"
              )}
            >
              {saved ? <><CheckCircle2 size={18} /> Saved!</> : <><Check size={18} /> Save {fixtures.length} Fixture{fixtures.length !== 1 ? 's' : ''}</>}
            </button>
            <button onClick={() => { setStep('upload'); setPreview(null); setFixtures([]); }}
              className="text-center text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors py-2">
              Scan another photo
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileInput}
      />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
