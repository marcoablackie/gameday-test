"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Camera, Loader2, CheckCircle2, AlertCircle, Plus, Zap, Scan, RefreshCw, PenLine, Search, Lock } from 'lucide-react';
import NavBar from '@/components/NavBar';
import type { AnalyzeFoodOutput } from '@/ai/flows/analyze-food-photo';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import type { ScreenState, DailyStats } from '../GamedayFlow';
import { aiLimit, incrementAI, FREE_LIMITS } from '@/lib/ai-limits';

type Mode = 'scan' | 'type';

type FoodLogEntry = { name: string; calories: number; protein: number; carbs: number; fats: number; sugar: number };

export default function FoodTracker({
  onBack,
  onNavClick,
  onLogMeal,
  uid,
  hasAccess,
}: {
  onBack: () => void,
  onNavClick: (screen: ScreenState) => void,
  onLogMeal: (stats: DailyStats, foodName: string) => void,
  uid?: string,
  hasAccess?: boolean,
}) {
  const [mode, setMode] = useState<Mode>('scan');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeFoodOutput | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logged, setLogged] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [limitHit, setLimitHit] = useState(false);

  // Manual text mode
  const [foodText, setFoodText] = useState('');

  // Recent food history from today's log
  const recentFoods: FoodLogEntry[] = React.useMemo(() => {
    if (!uid) return [];
    try {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
      const raw = localStorage.getItem(`gameday_food_log_${uid}_${today}`);
      const entries: FoodLogEntry[] = raw ? JSON.parse(raw) : [];
      // Deduplicate by name, most recent first
      const seen = new Set<string>();
      return entries.filter(e => { if (seen.has(e.name)) return false; seen.add(e.name); return true; }).reverse().slice(0, 5);
    } catch { return []; }
  }, [uid]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === 'scan' && !result && !preview) {
      startCamera();
    } else if (mode === 'type') {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode, result, preview]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch {
      setCameraActive(false);
      setError("Camera access denied. Allow camera permissions or use Type mode.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const compressToDataUri = (src: HTMLVideoElement | HTMLImageElement, maxDim = 900): string => {
    const canvas = canvasRef.current!;
    const iw = src instanceof HTMLVideoElement ? src.videoWidth : src.naturalWidth;
    const ih = src instanceof HTMLVideoElement ? src.videoHeight : src.naturalHeight;
    const scale = Math.min(1, maxDim / Math.max(iw, ih, 1));
    canvas.width = Math.round(iw * scale);
    canvas.height = Math.round(ih * scale);
    canvas.getContext('2d')!.drawImage(src, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.75);
  };

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      processPhoto(compressToDataUri(videoRef.current));
    }
  };

  const processPhoto = async (base64: string) => {
    const lim = aiLimit('food-scan', !!hasAccess);
    if (!lim.allowed) { setLimitHit(true); return; }
    setAnalyzing(true);
    setPreview(base64);
    setResult(null);
    setError(null);
    setLogged(false);
    stopCamera();
    incrementAI('food-scan');
    try {
      const res = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoDataUri: base64 }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      setResult(data as AnalyzeFoodOutput);
    } catch (err: any) {
      setError(err?.message || "Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const lookupFood = async () => {
    if (!foodText.trim()) return;
    const lim = aiLimit('food-scan', !!hasAccess);
    if (!lim.allowed) { setLimitHit(true); return; }
    setAnalyzing(true);
    setResult(null);
    setError(null);
    setLogged(false);
    incrementAI('food-scan');
    try {
      const res = await fetch('/api/lookup-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodDescription: foodText.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      setResult(data as AnalyzeFoodOutput);
    } catch (err: any) {
      setError(err?.message || "Lookup failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = document.createElement('img');
    img.onload = () => {
      if (!canvasRef.current) return;
      processPhoto(compressToDataUri(img));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleLog = () => {
    if (!result) return;
    onLogMeal({
      calories: result.calories,
      protein: result.macros.protein,
      carbs: result.macros.carbs,
      fats: result.macros.fats,
      sugar: result.macros.sugar,
    }, result.foodName);
    setLogged(true);
  };

  const resetScanner = () => {
    setResult(null);
    setPreview(null);
    setError(null);
    setLogged(false);
    setLimitHit(false);
    setFoodText('');
    if (mode === 'scan') startCamera();
  };

  const quickLog = (entry: FoodLogEntry) => {
    onLogMeal({ calories: entry.calories, protein: entry.protein, carbs: entry.carbs, fats: entry.fats, sugar: entry.sugar }, entry.name);
    setLogged(true);
    setResult({ foodName: entry.name, calories: entry.calories, macros: { protein: entry.protein, carbs: entry.carbs, fats: entry.fats, sugar: entry.sugar }, confidence: 1, analysis: 'Re-logged from your history today.' });
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setResult(null);
    setPreview(null);
    setError(null);
    setLogged(false);
    setLimitHit(false);
    setFoodText('');
  };

  return (
    <div className="flex flex-col h-full bg-black relative overflow-hidden">

      {/* Fullscreen camera / preview background — only in scan mode */}
      {mode === 'scan' && (
        <div className="absolute inset-0">
          {preview ? (
            <Image src={preview} alt="Capture" fill className="object-cover" />
          ) : (
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
          )}
        </div>
      )}

      {/* Dark background for type mode */}
      {mode === 'type' && <div className="absolute inset-0 bg-background" />}

      {/* Top gradient + header */}
      <div className="relative z-10">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
        <div className="relative px-6 pt-10 pb-4 flex items-center gap-4">
          <button onClick={onBack} className="p-3 rounded-full bg-black/40 border border-white/20 backdrop-blur-sm active:scale-90 transition-all">
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-lg font-headline font-black italic uppercase flex-1 text-center tracking-tight drop-shadow-lg">Macro Vision</h3>
          <div className="w-11" />
        </div>

        {/* Mode toggle */}
        <div className="relative px-6 pb-4">
          <div className="flex bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-1 gap-1">
            <button
              onClick={() => switchMode('scan')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                mode === 'scan' ? "bg-primary text-primary-foreground" : "text-white/40"
              )}
            >
              <Camera size={12} /> Scan
            </button>
            <button
              onClick={() => switchMode('type')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                mode === 'type' ? "bg-primary text-primary-foreground" : "text-white/40"
              )}
            >
              <PenLine size={12} /> Type It
            </button>
          </div>
        </div>
      </div>

      {/* TYPE MODE — manual input */}
      {mode === 'type' && !result && !analyzing && (
        <div className="relative z-10 flex-1 flex flex-col px-6 pt-4 gap-4 overflow-y-auto pb-36">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30">What did you eat?</p>
          <textarea
            value={foodText}
            onChange={e => setFoodText(e.target.value)}
            placeholder="e.g. 2 eggs on toast with avocado, bowl of oats with banana, 200g chicken rice..."
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-white/20 resize-none focus:outline-none focus:border-primary/50 font-medium"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); lookupFood(); } }}
          />
          <Button
            onClick={lookupFood}
            disabled={!foodText.trim()}
            className="w-full h-13 rounded-xl font-black uppercase italic bg-primary text-primary-foreground neon-glow disabled:opacity-40"
          >
            <Search size={16} className="mr-2" /> Analyse
          </Button>
          <p className="text-[9px] font-black uppercase tracking-widest text-white/20 text-center">
            Tip: include amounts for best accuracy — e.g. "2 eggs", "large bowl"
          </p>

          {recentFoods.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Quick re-add</p>
              <div className="flex flex-col gap-2">
                {recentFoods.map((food, i) => (
                  <button
                    key={i}
                    onClick={() => quickLog(food)}
                    className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-left hover:bg-white/10 active:scale-[0.98] transition-all"
                  >
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-white/80 truncate">{food.name}</p>
                      <p className="text-[8px] text-white/30 font-medium">{food.calories} kcal · {food.protein}g protein</p>
                    </div>
                    <Plus size={14} className="text-primary/60 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SCAN MODE helpers */}
      {mode === 'scan' && !preview && cameraActive && !analyzing && (
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center gap-3">
          <div className="relative w-64 h-64">
            <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-white/70 rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-white/70 rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-white/70 rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-white/70 rounded-br-xl" />
          </div>
          <p className="text-[9px] font-black uppercase tracking-widest text-white/50">Point at your food</p>
        </div>
      )}

      {/* Analyzing overlay */}
      {analyzing && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
          <Loader2 className="h-14 w-14 text-primary animate-spin" />
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Analysing Fuel...</p>
        </div>
      )}

      {/* Limit hit overlay */}
      {limitHit && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-5 z-20 px-8">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Lock size={24} className="text-primary" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-primary">Daily Limit Reached</p>
            <h3 className="text-xl font-headline font-black uppercase leading-tight">Food Scan Limit Hit</h3>
            <p className="text-[11px] text-white/40 font-medium leading-relaxed">
              You've used all {FREE_LIMITS['food-scan'].max} free food scans for today. Upgrade for unlimited scanning.
            </p>
          </div>
          <button
            onClick={() => onNavClick('paywall')}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground text-sm font-black uppercase italic neon-glow active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Zap size={16} className="fill-current" />
            Unlock Pro
          </button>
          <button onClick={() => setLimitHit(false)} className="text-[8px] font-bold uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors">
            Go Back
          </button>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="absolute top-36 left-4 right-4 z-20 bg-destructive/90 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3 text-white animate-in slide-in-from-top-2">
          <AlertCircle size={16} />
          <p className="text-[10px] font-black uppercase italic flex-1">{error}</p>
          {mode === 'scan' && (
            <button onClick={() => fileInputRef.current?.click()} className="text-[9px] font-black uppercase underline whitespace-nowrap">
              Upload
            </button>
          )}
        </div>
      )}

      {/* Capture button (scan mode) */}
      {mode === 'scan' && !preview && cameraActive && !analyzing && (
        <div className="absolute bottom-32 left-0 right-0 z-20 flex justify-center">
          <button
            onClick={capture}
            className="h-20 w-20 rounded-full border-4 border-white/40 flex items-center justify-center bg-black/20 backdrop-blur-sm active:scale-95 transition-transform"
          >
            <div className="h-14 w-14 rounded-full bg-white shadow-2xl flex items-center justify-center">
              <Scan size={24} className="text-black" />
            </div>
          </button>
        </div>
      )}

      {/* Results bottom sheet */}
      {result && !analyzing && (
        <div className="absolute bottom-0 left-0 right-0 z-20 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-background/95 backdrop-blur-xl rounded-t-[2.5rem] px-6 pt-4 pb-36 border-t border-white/10 max-h-[65vh] overflow-y-auto space-y-5">
            <div className="flex justify-center mb-1">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] italic truncate">{result.foodName}</p>
                  {result.confidence != null && (
                    <span className={cn(
                      "text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                      result.confidence >= 0.8 ? "bg-emerald-500/15 text-emerald-400" :
                      result.confidence >= 0.6 ? "bg-yellow-500/15 text-yellow-400" :
                      "bg-red-500/15 text-red-400"
                    )}>
                      {result.confidence >= 0.8 ? 'High confidence' : result.confidence >= 0.6 ? 'Estimate' : 'Low confidence'}
                    </span>
                  )}
                </div>
                <h4 className="text-4xl font-headline font-black italic uppercase tracking-tighter leading-none">
                  {result.calories} <span className="text-xs font-black text-white/20 not-italic uppercase tracking-widest">kcal</span>
                </h4>
              </div>
              <button onClick={resetScanner} className="p-2 rounded-full bg-white/5 border border-white/10 active:scale-90 transition-all shrink-0">
                <RefreshCw size={16} className="text-white/50" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Protein', value: result.macros.protein },
                { label: 'Carbs', value: result.macros.carbs },
                { label: 'Fats', value: result.macros.fats },
                { label: 'Sugar', value: result.macros.sugar },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col items-center">
                  <p className="text-[7px] text-white/40 font-black uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-base font-black italic">{value}g</p>
                </div>
              ))}
            </div>

            <p className="text-[10px] italic text-white/50 leading-relaxed">"{result.analysis}"</p>

            <Button
              onClick={handleLog}
              disabled={logged}
              className={cn(
                "w-full h-14 rounded-2xl font-black uppercase italic transition-all",
                logged
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-primary text-primary-foreground neon-glow"
              )}
            >
              {logged
                ? <><CheckCircle2 size={16} className="mr-2" /> Logged</>
                : <><Plus size={16} className="mr-2" /> Log Meal</>}
            </Button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

      <NavBar active="food_tracker" onNavClick={onNavClick} />
    </div>
  );
}
