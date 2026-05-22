"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Clock, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

function parseSteps(intel: string): string[] {
  // Check if already numbered: "1. ...", "1) ...", "Step 1: ..."
  const byNumber = intel.split(/(?<!\w)(?:\d+[.)]\s+|Step\s+\d+[.:]\s*)/i).filter(s => s.trim().length > 0);
  if (byNumber.length > 1) return byNumber.map(s => s.trim().replace(/\.?\s*$/, ''));
  // Fall back: split on sentence boundaries before capital letters
  return intel.split(/\.\s+(?=[A-Z])/).map(s => s.trim()).filter(s => s.length > 0);
}

export default function DrillDetail({
  onBack,
  item,
  onComplete,
  isCompleted
}: {
  onBack: () => void,
  item: { activity: string, intel: string, youtubeSearchQuery?: string, videoId?: string },
  onComplete: (title: string) => void,
  isCompleted: boolean
}) {
  const [resolvedVideoId, setResolvedVideoId] = useState<string | null>(item.videoId ?? null);
  const [loadingVideo, setLoadingVideo] = useState(!item.videoId);
  const [videoUnavailable, setVideoUnavailable] = useState(false);

  const searchQuery = item.youtubeSearchQuery || `${item.activity} sports drill tutorial`;
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
  const steps = parseSteps(item.intel);

  useEffect(() => {
    if (item.videoId) { setLoadingVideo(false); return; }
    setLoadingVideo(true);
    fetch(`/api/drill-video?q=${encodeURIComponent(searchQuery)}`)
      .then(r => r.json())
      .then(data => {
        if (data.videoId) setResolvedVideoId(data.videoId);
        else setVideoUnavailable(true);
      })
      .catch(() => setVideoUnavailable(true))
      .finally(() => setLoadingVideo(false));
  }, []);

  return (
    <div className="flex flex-col h-full bg-background animate-in slide-in-from-right-8 duration-500">
      <div className="px-6 pt-10 pb-4 flex items-center gap-4 shrink-0">
        <button onClick={onBack} className="p-3 rounded-full bg-white/5 border border-white/10 active:scale-90 transition-all">
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-lg font-headline font-black italic uppercase flex-1 text-center pr-10">Drill Intel</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-32">
        <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/5 shadow-xl bg-black">
          {loadingVideo ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 size={32} className="text-primary animate-spin" />
              <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Loading Video...</p>
            </div>
          ) : resolvedVideoId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${resolvedVideoId}?rel=0&modestbranding=1`}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Video Unavailable</p>
              <button
                onClick={() => window.open(youtubeSearchUrl, '_blank')}
                className="px-4 py-2 rounded-xl bg-primary/20 border border-primary/30 text-primary text-[9px] font-black uppercase tracking-widest"
              >
                Search on YouTube
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-headline font-black italic uppercase tracking-tighter leading-none">{item.activity}</h1>
          <div className="flex gap-2">
            <Badge className="bg-white/5 text-white/40 border-none px-3 py-1.5 flex items-center gap-2 font-black uppercase tracking-widest text-[8px]">
              <Clock size={10} /> Position Specific
            </Badge>
            <Badge
              onClick={() => window.open(youtubeSearchUrl, '_blank')}
              className="bg-primary/10 text-primary border-primary/20 px-3 py-1.5 flex items-center gap-2 font-black uppercase tracking-widest text-[8px] cursor-pointer"
            >
              <ExternalLink size={10} /> Watch on YouTube
            </Badge>
          </div>

          <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Execution Brief</p>
            <div className="space-y-4">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-primary font-black text-sm shrink-0 mt-0.5 w-5">{i + 1}.</span>
                  <p className="text-sm leading-relaxed text-white/80 font-medium">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/90 to-transparent">
        <Button
          onClick={() => !isCompleted && onComplete(item.activity)}
          disabled={isCompleted}
          className={cn(
            "w-full h-14 rounded-xl text-md font-black uppercase italic transition-all duration-300",
            isCompleted ? "bg-white/10 text-white/40" : "bg-primary text-primary-foreground neon-glow"
          )}
        >
          {isCompleted ? <><CheckCircle2 size={20} className="mr-2" /> Protocol Logged</> : "Log Completion"}
        </Button>
      </div>
    </div>
  );
}
