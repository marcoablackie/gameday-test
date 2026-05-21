"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Camera, Loader2, CheckCircle2, Home, Dumbbell, BarChart2, AlertCircle, Plus, Zap, Scan, RefreshCw } from 'lucide-react';
import type { AnalyzeFoodOutput } from '@/ai/flows/analyze-food-photo';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import type { ScreenState, DailyStats } from '../GamedayFlow';

export default function FoodTracker({
  onBack,
  onNavClick,
  onLogMeal
}: {
  onBack: () => void,
  onNavClick: (screen: ScreenState) => void,
  onLogMeal: (stats: DailyStats) => void
}) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeFoodOutput | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logged, setLogged] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!result && !preview) {
      startCamera();
    }
    return () => stopCamera();
  }, [result, preview]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setCameraActive(false);
      setError("Camera access denied. Allow camera permissions to use the scanner.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
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
    setAnalyzing(true);
    setPreview(base64);
    setResult(null);
    setError(null);
    setLogged(false);
    stopCamera();

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
      console.error("Food photo analysis failed:", err);
      setError(err?.message || "Analysis failed. Please try again.");
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
    });
    setLogged(true);
  };

  const resetScanner = () => {
    setResult(null);
    setPreview(null);
    setError(null);
    setLogged(false);
    startCamera();
  };

  return (
    <div className="flex flex-col h-full bg-black relative overflow-hidden">

      {/* Fullscreen camera / preview background */}
      <div className="absolute inset-0">
        {preview ? (
          <Image src={preview} alt="Capture" fill className="object-cover" />
        ) : cameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-4">
            <Camera size={48} className="text-white/20" />
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Camera Access Required</p>
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="text-[10px] border-white/20">
              Upload Photo
            </Button>
          </div>
        )}
      </div>

      {/* Top gradient + header */}
      <div className="relative z-10">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
        <div className="relative px-6 pt-10 pb-6 flex items-center gap-4">
          <button onClick={onBack} className="p-3 rounded-full bg-black/40 border border-white/20 backdrop-blur-sm active:scale-90 transition-all">
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-lg font-headline font-black italic uppercase flex-1 text-center pr-10 tracking-tight drop-shadow-lg">Macro Vision</h3>
        </div>
      </div>

      {/* Viewfinder corners */}
      {!preview && cameraActive && !analyzing && (
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
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
          <Loader2 className="h-14 w-14 text-primary animate-spin" />
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Analyzing Fuel...</p>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="absolute top-28 left-4 right-4 z-20 bg-destructive/90 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3 text-white animate-in slide-in-from-top-2">
          <AlertCircle size={16} />
          <p className="text-[10px] font-black uppercase italic flex-1">{error}</p>
          <button onClick={() => fileInputRef.current?.click()} className="text-[9px] font-black uppercase underline whitespace-nowrap">
            Upload
          </button>
        </div>
      )}

      {/* Capture button */}
      {!preview && cameraActive && !analyzing && (
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
          <div className="bg-background/95 backdrop-blur-xl rounded-t-[2.5rem] px-6 pt-4 pb-36 border-t border-white/10 max-h-[62vh] overflow-y-auto space-y-5">
            <div className="flex justify-center mb-1">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] italic">{result.foodName}</p>
                <h4 className="text-4xl font-headline font-black italic uppercase tracking-tighter leading-none">
                  {result.calories} <span className="text-xs font-black text-white/20 not-italic uppercase tracking-widest">kcal</span>
                </h4>
              </div>
              <button onClick={resetScanner} className="p-2 rounded-full bg-white/5 border border-white/10 active:scale-90 transition-all">
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

      {/* Bottom nav */}
      <div className="absolute bottom-0 left-0 right-0 h-28 glass-nav flex items-center justify-around px-4 pb-8 z-30">
        <button onClick={() => onNavClick('dashboard')} className="flex flex-col items-center gap-2 text-white/40 hover:text-white transition-colors">
          <Home size={20} /> <span className="text-[8px] font-bold uppercase tracking-[0.1em]">Daily</span>
        </button>
        <button onClick={() => onNavClick('drills_library')} className="flex flex-col items-center gap-2 text-white/40 hover:text-white transition-colors">
          <Dumbbell size={20} /> <span className="text-[8px] font-bold uppercase tracking-[0.1em]">Drills</span>
        </button>
        <button onClick={() => onNavClick('quests')} className="flex flex-col items-center gap-2 text-white/40 hover:text-white transition-colors">
          <Zap size={20} /> <span className="text-[8px] font-bold uppercase tracking-[0.1em]">Bonus</span>
        </button>
        <button onClick={() => onNavClick('food_tracker')} className="flex flex-col items-center gap-2 text-white transition-colors">
          <div className="h-1 w-8 bg-primary rounded-full mb-1" />
          <Camera size={20} /> <span className="text-[8px] font-bold uppercase tracking-[0.1em]">Scan</span>
        </button>
        <button onClick={() => onNavClick('stats')} className="flex flex-col items-center gap-2 text-white/40 hover:text-white transition-colors">
          <BarChart2 size={20} /> <span className="text-[8px] font-bold uppercase tracking-[0.1em]">Stats</span>
        </button>
      </div>
    </div>
  );
}
