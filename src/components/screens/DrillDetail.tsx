"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Play, Clock, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
  const thumb = PlaceHolderImages.find(img => img.id === 'drill-video-thumbnail');
  const [resolvedVideoId, setResolvedVideoId] = useState<string | null>(item.videoId ?? null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUnavailable, setVideoUnavailable] = useState(false);

  const searchQuery = item.youtubeSearchQuery || `${item.activity} sports drill tutorial`;
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;

  const handlePlay = async () => {
    if (resolvedVideoId) { setIsPlaying(true); return; }

    setLoadingVideo(true);
    setVideoUnavailable(false);
    try {
      const res = await fetch(`/api/drill-video?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.videoId) {
        setResolvedVideoId(data.videoId);
        setIsPlaying(true);
      } else {
        setVideoUnavailable(true);
      }
    } catch {
      setVideoUnavailable(true);
    } finally {
      setLoadingVideo(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background animate-in slide-in-from-right-8 duration-500">
      <div className="px-6 pt-10 pb-4 flex items-center gap-4 shrink-0">
        <button onClick={onBack} className="p-3 rounded-full bg-white/5 border border-white/10 active:scale-90 transition-all">
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-lg font-headline font-black italic uppercase flex-1 text-center pr-10">Drill Intel</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-32">
        <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/5 shadow-xl">
          {isPlaying && resolvedVideoId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${resolvedVideoId}?autoplay=1&rel=0&modestbranding=1`}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : videoUnavailable ? (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 px-6 text-center">
              {thumb && <Image src={thumb.imageUrl} alt="thumbnail" fill className="object-cover opacity-20" />}
              <div className="relative z-10 flex flex-col items-center gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Video Unavailable</p>
                <button
                  onClick={() => window.open(youtubeSearchUrl, '_blank')}
                  className="px-4 py-2 rounded-xl bg-primary/20 border border-primary/30 text-primary text-[9px] font-black uppercase tracking-widest"
                >
                  Search on YouTube
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handlePlay}
              disabled={loadingVideo}
              className="absolute inset-0 w-full h-full group cursor-pointer active:scale-[0.98] transition-all disabled:cursor-default"
            >
              {thumb && <Image src={thumb.imageUrl} alt="thumbnail" fill className="object-cover" />}
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                <div className={cn(
                  "h-14 w-14 rounded-full backdrop-blur-md flex items-center justify-center border transition-colors",
                  loadingVideo
                    ? "bg-white/10 border-white/20 text-white/60"
                    : "bg-primary/20 border-primary/30 text-primary group-hover:bg-primary group-hover:text-black"
                )}>
                  {loadingVideo
                    ? <Loader2 size={28} className="animate-spin" />
                    : <Play size={32} className="fill-current" />
                  }
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                  {loadingVideo ? 'Finding Video...' : 'Play Drill Video'}
                </p>
              </div>
            </button>
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
            <p className="text-sm italic leading-relaxed text-white/80 font-medium">
              "{item.intel}"
            </p>
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
