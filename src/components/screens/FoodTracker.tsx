"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft, Camera, Loader2, CheckCircle2, AlertCircle, Plus, Zap,
  Scan, RefreshCw, PenLine, Search, Lock, Clock, X, MessageSquare,
  UtensilsCrossed, Flame,
} from 'lucide-react';
import NavBar from '@/components/NavBar';
import type { AnalyzeFoodOutput } from '@/ai/flows/analyze-food-photo';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import type { ScreenState, DailyStats } from '../GamedayFlow';
import { aiLimit, incrementAI, FREE_LIMITS } from '@/lib/ai-limits';
import { MEALS, MEAL_CATEGORIES, type Meal, type MealCategory } from '@/lib/meals-data';

type MainTab = 'meals' | 'tracker';
type ScanMode = 'scan' | 'type';
type FoodLogEntry = { name: string; calories: number; protein: number; carbs: number; fats: number; sugar: number };

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Breakfast': { bg: 'bg-orange-500/10',  text: 'text-orange-400',  border: 'border-orange-500/20'  },
  'Lunch':     { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/20'    },
  'Dinner':    { bg: 'bg-purple-500/10',  text: 'text-purple-400',  border: 'border-purple-500/20'  },
  'Snack':     { bg: 'bg-yellow-500/10',  text: 'text-yellow-400',  border: 'border-yellow-500/20'  },
  'Pre-Game':  { bg: 'bg-primary/10',     text: 'text-primary',     border: 'border-primary/20'     },
  'Post-Game': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  'Recovery':  { bg: 'bg-blue-400/10',    text: 'text-blue-300',    border: 'border-blue-400/20'    },
};

export default function FoodTracker({
  onBack,
  onNavClick,
  onLogMeal,
  uid,
  hasAccess,
}: {
  onBack: () => void;
  onNavClick: (screen: ScreenState) => void;
  onLogMeal: (stats: DailyStats, foodName: string) => void;
  uid?: string;
  hasAccess?: boolean;
}) {
  // ─── Main tab ────────────────────────────────────────────────────────────
  const [mainTab, setMainTab] = useState<MainTab>('meals');

  // ─── Meals tab ───────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<MealCategory | 'All'>('All');
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  const filteredMeals = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MEALS.filter(m => {
      const matchCat = activeCategory === 'All' || m.category === activeCategory;
      const matchSearch = !q || m.name.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [search, activeCategory]);

  // ─── Tracker tab ─────────────────────────────────────────────────────────
  const [mode, setMode] = useState<ScanMode>('scan');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeFoodOutput | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logged, setLogged] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [limitHit, setLimitHit] = useState(false);
  const [foodText, setFoodText] = useState('');

  // "That's wrong" feedback
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSaved, setFeedbackSaved] = useState(false);

  const recentFoods: FoodLogEntry[] = useMemo(() => {
    if (!uid) return [];
    try {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
      const raw = localStorage.getItem(`gameday_food_log_${uid}_${today}`);
      const entries: FoodLogEntry[] = raw ? JSON.parse(raw) : [];
      const seen = new Set<string>();
      return entries
        .filter(e => { if (seen.has(e.name)) return false; seen.add(e.name); return true; })
        .reverse()
        .slice(0, 5);
    } catch { return []; }
  }, [uid]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mainTab === 'tracker' && mode === 'scan' && !result && !preview) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mainTab, mode, result, preview]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch {
      setCameraActive(false);
      setError('Camera access denied. Allow camera permissions or use Type mode.');
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

  const getRecentCorrections = () => {
    try {
      const raw = localStorage.getItem('gameday_food_corrections');
      return raw ? JSON.parse(raw).slice(-5) : [];
    } catch { return []; }
  };

  const resetFeedback = () => {
    setFeedbackOpen(false);
    setFeedbackText('');
    setFeedbackSaved(false);
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
    resetFeedback();
    stopCamera();
    incrementAI('food-scan');
    try {
      const res = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoDataUri: base64, corrections: getRecentCorrections() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      setResult(data as AnalyzeFoodOutput);
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Analysis failed. Please try again.');
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
    resetFeedback();
    incrementAI('food-scan');
    try {
      const res = await fetch('/api/lookup-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodDescription: foodText.trim(), corrections: getRecentCorrections() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      setResult(data as AnalyzeFoodOutput);
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Lookup failed. Please try again.');
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
    resetFeedback();
    if (mode === 'scan') startCamera();
  };

  const quickLog = (entry: FoodLogEntry) => {
    onLogMeal({ calories: entry.calories, protein: entry.protein, carbs: entry.carbs, fats: entry.fats, sugar: entry.sugar }, entry.name);
    setLogged(true);
    setResult({ foodName: entry.name, calories: entry.calories, macros: { protein: entry.protein, carbs: entry.carbs, fats: entry.fats, sugar: entry.sugar }, confidence: 1, analysis: 'Re-logged from your history today.' });
  };

  const switchMode = (m: ScanMode) => {
    setMode(m);
    setResult(null);
    setPreview(null);
    setError(null);
    setLogged(false);
    setLimitHit(false);
    setFoodText('');
    resetFeedback();
  };

  const switchMainTab = (tab: MainTab) => {
    if (tab === 'meals') stopCamera();
    setMainTab(tab);
  };

  const saveFeedback = () => {
    if (!result || !feedbackText.trim()) return;
    try {
      const raw = localStorage.getItem('gameday_food_corrections') || '[]';
      const corrections = JSON.parse(raw);
      corrections.push({
        foodName: result.foodName,
        aiResult: { calories: result.calories, macros: result.macros },
        correction: feedbackText.trim(),
        timestamp: Date.now(),
      });
      localStorage.setItem('gameday_food_corrections', JSON.stringify(corrections.slice(-50)));
    } catch { /* ignore */ }
    setFeedbackSaved(true);
    setFeedbackOpen(false);
    setFeedbackText('');
  };

  const isCameraMode = mainTab === 'tracker' && mode === 'scan';

  return (
    <div className={cn(
      'flex flex-col h-full relative overflow-hidden',
      isCameraMode ? 'bg-black' : 'bg-background',
    )}>

      {/* ── Camera background ──────────────────────────────────────────────── */}
      {isCameraMode && (
        <div className="absolute inset-0">
          {preview
            ? <Image src={preview} alt="Capture" fill className="object-cover" />
            : <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
          }
        </div>
      )}

      {/* ── Top section ────────────────────────────────────────────────────── */}
      <div className="relative z-10 shrink-0">
        {isCameraMode && (
          <div className="absolute inset-x-0 top-0 h-52 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
        )}

        {/* Header row */}
        <div className="relative px-6 pt-10 pb-3 flex items-center gap-4">
          <button
            onClick={onBack}
            className={cn(
              'p-3 rounded-full active:scale-90 transition-all',
              isCameraMode ? 'bg-black/40 border border-white/20 backdrop-blur-sm' : 'bg-white/5',
            )}
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className={cn(
            'text-lg font-headline font-black italic uppercase flex-1 text-center tracking-tight',
            isCameraMode && 'drop-shadow-lg',
          )}>
            {mainTab === 'meals' ? 'Meal Plans' : 'Macro Vision'}
          </h3>
          <div className="w-11" />
        </div>

        {/* Main tab switcher */}
        <div className="relative px-6 pb-3">
          <div className={cn(
            'flex border rounded-2xl p-1 gap-1',
            isCameraMode ? 'bg-black/40 backdrop-blur-sm border-white/10' : 'bg-white/5 border-white/10',
          )}>
            <button
              onClick={() => switchMainTab('meals')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                mainTab === 'meals' ? 'bg-primary text-primary-foreground' : 'text-white/40',
              )}
            >
              <UtensilsCrossed size={12} /> Meals
            </button>
            <button
              onClick={() => switchMainTab('tracker')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                mainTab === 'tracker' ? 'bg-primary text-primary-foreground' : 'text-white/40',
              )}
            >
              <Camera size={12} /> Tracker
            </button>
          </div>
        </div>

        {/* Sub-mode switcher — tracker tab only */}
        {mainTab === 'tracker' && (
          <div className="relative px-6 pb-3">
            <div className={cn(
              'flex border rounded-2xl p-1 gap-1',
              isCameraMode ? 'bg-black/40 backdrop-blur-sm border-white/10' : 'bg-white/5 border-white/10',
            )}>
              <button
                onClick={() => switchMode('scan')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                  mode === 'scan' ? 'bg-white/15 text-white' : 'text-white/35',
                )}
              >
                <Scan size={12} /> Scan
              </button>
              <button
                onClick={() => switchMode('type')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                  mode === 'type' ? 'bg-white/15 text-white' : 'text-white/35',
                )}
              >
                <PenLine size={12} /> Type It
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MEALS TAB ──────────────────────────────────────────────────────── */}
      {mainTab === 'meals' && (
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Search */}
          <div className="px-6 pb-2">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4">
              <Search size={14} className="text-white/30 shrink-0" />
              <input
                type="text"
                placeholder="Search meals..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent py-3 text-sm text-white placeholder:text-white/20 focus:outline-none font-medium"
              />
              {search && (
                <button onClick={() => setSearch('')}>
                  <X size={14} className="text-white/30" />
                </button>
              )}
            </div>
          </div>

          {/* Category filters */}
          <div className="px-6 pb-3">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {(['All', ...MEAL_CATEGORIES] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat as MealCategory | 'All')}
                  className={cn(
                    'shrink-0 px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border',
                    activeCategory === cat
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-white/5 text-white/40 border-white/10',
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Meal list */}
          <div className="flex-1 overflow-y-auto px-6 pb-36 space-y-3">
            {filteredMeals.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-white/20 text-sm font-medium">No meals found</p>
              </div>
            ) : filteredMeals.map(meal => {
              const style = CATEGORY_COLORS[meal.category] ?? CATEGORY_COLORS['Breakfast'];
              return (
                <button
                  key={meal.id}
                  onClick={() => setSelectedMeal(meal)}
                  className="w-full bg-white/5 border border-white/8 rounded-3xl p-5 text-left active:scale-[0.98] transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className={cn('text-[8px] font-black uppercase tracking-widest', style.text)}>
                        {meal.category}
                      </span>
                      <h4 className="text-base font-headline font-black uppercase tracking-tight text-white leading-tight mt-0.5">
                        {meal.name}
                      </h4>
                      <p className="text-[10px] text-white/40 font-medium mt-1.5 line-clamp-2 leading-relaxed">
                        {meal.why}
                      </p>
                    </div>
                    <div className={cn('shrink-0 px-3 py-2 rounded-xl border text-center', style.bg, style.border)}>
                      <p className={cn('text-xl font-headline font-black leading-none', style.text)}>{meal.calories}</p>
                      <p className="text-[7px] font-black uppercase tracking-widest text-white/30 mt-0.5">kcal</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <Flame size={10} className="text-orange-400" />
                      <p className="text-[9px] font-black uppercase text-white/40">{meal.protein}g Protein</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={10} className="text-white/25" />
                      <p className="text-[9px] font-black uppercase text-white/40">{meal.prepMins} min prep</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TRACKER TAB — type mode ─────────────────────────────────────────── */}
      {mainTab === 'tracker' && mode === 'type' && !result && !analyzing && (
        <div className="relative z-10 flex-1 flex flex-col px-6 pt-1 gap-4 overflow-y-auto pb-36">
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
            Tip: include amounts for best accuracy
          </p>

          {recentFoods.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Quick re-add</p>
              <div className="flex flex-col gap-2">
                {recentFoods.map((food, i) => (
                  <button
                    key={i}
                    onClick={() => quickLog(food)}
                    className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-left active:scale-[0.98] transition-all"
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

      {/* ── TRACKER TAB — scan viewfinder ───────────────────────────────────── */}
      {mainTab === 'tracker' && mode === 'scan' && !preview && cameraActive && !analyzing && (
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center gap-3">
          <div className="relative w-56 h-56">
            <div className="absolute top-0 left-0 w-9 h-9 border-t-2 border-l-2 border-white/70 rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-9 h-9 border-t-2 border-r-2 border-white/70 rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-9 h-9 border-b-2 border-l-2 border-white/70 rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-9 h-9 border-b-2 border-r-2 border-white/70 rounded-br-xl" />
          </div>
          <p className="text-[9px] font-black uppercase tracking-widest text-white/50">Point at your food</p>
        </div>
      )}

      {/* ── Overlays ───────────────────────────────────────────────────────── */}

      {analyzing && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
          <Loader2 className="h-14 w-14 text-primary animate-spin" />
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Analysing Fuel...</p>
        </div>
      )}

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
            <Zap size={16} className="fill-current" /> Unlock Pro
          </button>
          <button onClick={() => setLimitHit(false)} className="text-[8px] font-bold uppercase tracking-widest text-white/20">
            Go Back
          </button>
        </div>
      )}

      {error && mainTab === 'tracker' && (
        <div className="absolute top-52 left-4 right-4 z-20 bg-destructive/90 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3 text-white animate-in slide-in-from-top-2">
          <AlertCircle size={16} />
          <p className="text-[10px] font-black uppercase italic flex-1">{error}</p>
          {mode === 'scan' && (
            <button onClick={() => fileInputRef.current?.click()} className="text-[9px] font-black uppercase underline whitespace-nowrap">
              Upload
            </button>
          )}
        </div>
      )}

      {/* Capture button */}
      {mainTab === 'tracker' && mode === 'scan' && !preview && cameraActive && !analyzing && (
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

      {/* ── Results sheet ──────────────────────────────────────────────────── */}
      {result && !analyzing && mainTab === 'tracker' && (
        <div className="absolute bottom-0 left-0 right-0 z-20 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-background/95 backdrop-blur-xl rounded-t-[2.5rem] px-6 pt-4 pb-36 border-t border-white/10 max-h-[70vh] overflow-y-auto space-y-5">
            <div className="flex justify-center mb-1">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] italic truncate">{result.foodName}</p>
                  {result.confidence != null && (
                    <span className={cn(
                      'text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full',
                      result.confidence >= 0.8 ? 'bg-emerald-500/15 text-emerald-400' :
                      result.confidence >= 0.6 ? 'bg-yellow-500/15 text-yellow-400' :
                      'bg-red-500/15 text-red-400',
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
              {([
                { label: 'Protein', value: result.macros.protein },
                { label: 'Carbs',   value: result.macros.carbs },
                { label: 'Fats',    value: result.macros.fats },
                { label: 'Sugar',   value: result.macros.sugar },
              ] as const).map(({ label, value }) => (
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
                'w-full h-14 rounded-2xl font-black uppercase italic transition-all',
                logged
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : 'bg-primary text-primary-foreground neon-glow',
              )}
            >
              {logged
                ? <><CheckCircle2 size={16} className="mr-2" /> Logged</>
                : <><Plus size={16} className="mr-2" /> Log Meal</>}
            </Button>

            {/* That's wrong feedback */}
            {!logged && !feedbackSaved && (
              <div>
                {!feedbackOpen ? (
                  <button
                    onClick={() => setFeedbackOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-[9px] font-black uppercase tracking-widest text-white/25 hover:text-white/50 transition-colors"
                  >
                    <MessageSquare size={11} /> That&apos;s wrong?
                  </button>
                ) : (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/40">What&apos;s actually correct?</p>
                      <button onClick={() => { setFeedbackOpen(false); setFeedbackText(''); }}>
                        <X size={14} className="text-white/25" />
                      </button>
                    </div>
                    <textarea
                      value={feedbackText}
                      onChange={e => setFeedbackText(e.target.value)}
                      placeholder="e.g. This is 400 kcal not 800, it's a small bowl..."
                      rows={3}
                      autoFocus
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 resize-none focus:outline-none focus:border-primary/30 font-medium"
                    />
                    <button
                      onClick={saveFeedback}
                      disabled={!feedbackText.trim()}
                      className="w-full h-10 rounded-xl bg-white/8 border border-white/12 text-[9px] font-black uppercase tracking-widest text-white/60 disabled:opacity-30 transition-all active:scale-[0.98]"
                    >
                      Submit Correction
                    </button>
                  </div>
                )}
              </div>
            )}

            {feedbackSaved && (
              <div className="flex items-center justify-center gap-2 py-1.5">
                <CheckCircle2 size={12} className="text-emerald-400" />
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Correction saved — we&apos;ll learn from it</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Meal detail sheet ──────────────────────────────────────────────── */}
      {selectedMeal && (
        <div className="absolute inset-0 z-30 flex flex-col justify-end animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedMeal(null)} />
          <div className="relative bg-background rounded-t-[2.5rem] px-6 pt-5 pb-36 max-h-[82vh] overflow-y-auto border-t border-white/10 space-y-5 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-center mb-1">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Title */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {(() => {
                  const style = CATEGORY_COLORS[selectedMeal.category] ?? CATEGORY_COLORS['Breakfast'];
                  return (
                    <>
                      <span className={cn('text-[8px] font-black uppercase tracking-widest', style.text)}>{selectedMeal.category}</span>
                      <h3 className="text-2xl font-headline font-black uppercase tracking-tight text-white leading-tight mt-1">{selectedMeal.name}</h3>
                    </>
                  );
                })()}
              </div>
              <button onClick={() => setSelectedMeal(null)} className="p-2 rounded-full bg-white/5 border border-white/10 shrink-0 mt-1">
                <X size={16} className="text-white/50" />
              </button>
            </div>

            {/* Why it works */}
            <div className="bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3.5">
              <p className="text-[8px] font-black uppercase tracking-widest text-primary mb-1.5">Why it works</p>
              <p className="text-[11px] text-white/70 font-medium leading-relaxed">{selectedMeal.why}</p>
            </div>

            {/* Macros */}
            <div className="grid grid-cols-4 gap-2">
              {([
                { label: 'Calories', value: selectedMeal.calories, unit: 'kcal' },
                { label: 'Protein',  value: selectedMeal.protein,  unit: 'g' },
                { label: 'Carbs',    value: selectedMeal.carbs,    unit: 'g' },
                { label: 'Fats',     value: selectedMeal.fats,     unit: 'g' },
              ] as const).map(({ label, value, unit }) => (
                <div key={label} className="bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col items-center">
                  <p className="text-[7px] text-white/40 font-black uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-base font-black italic leading-tight">{value}</p>
                  <p className="text-[7px] text-white/25 font-bold">{unit}</p>
                </div>
              ))}
            </div>

            {/* Prep time */}
            <div className="flex items-center gap-2">
              <Clock size={12} className="text-white/30" />
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30">{selectedMeal.prepMins} minutes prep</p>
            </div>

            {/* Ingredients */}
            <div className="space-y-2.5">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Ingredients</p>
              <div className="space-y-2">
                {selectedMeal.ingredients.map((ing, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                    <p className="text-[11px] text-white/60 font-medium">{ing}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-2.5">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30">How to Make It</p>
              <div className="space-y-3">
                {selectedMeal.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                      <p className="text-[8px] font-black text-white/40">{i + 1}</p>
                    </div>
                    <p className="text-[11px] text-white/60 font-medium leading-relaxed flex-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

      <NavBar active="food_tracker" onNavClick={onNavClick} />
    </div>
  );
}
