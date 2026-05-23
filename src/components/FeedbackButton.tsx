"use client";

import React, { useState } from 'react';
import { MessageSquare, X, Send, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function FeedbackButton({ uid }: { uid?: string }) {
  const db = useFirestore();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      if (db) {
        await addDoc(collection(db, 'feedback'), {
          uid: uid || 'anonymous',
          message: text.trim(),
          timestamp: new Date().toISOString(),
          appVersion: '1.5.0',
        });
      }
      setSent(true);
      setText('');
      setTimeout(() => { setSent(false); setOpen(false); }, 2000);
    } catch {
      // Still close gracefully if Firestore fails
      setSent(true);
      setTimeout(() => { setSent(false); setOpen(false); }, 2000);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-32 right-4 z-40 h-10 w-10 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm flex items-center justify-center text-white/30 hover:text-white/60 hover:border-white/20 transition-all active:scale-90"
        aria-label="Send feedback"
      >
        <MessageSquare size={16} />
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full bg-background border-t border-white/10 rounded-t-3xl px-6 pt-5 pb-10 space-y-4 animate-in slide-in-from-bottom-6 duration-300">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black uppercase italic tracking-widest">Send Feedback</h4>
              <button onClick={() => setOpen(false)} className="p-2 rounded-full bg-white/5 active:scale-90 transition-all">
                <X size={16} />
              </button>
            </div>

            {sent ? (
              <div className="flex flex-col items-center gap-2 py-6 animate-in fade-in duration-300">
                <CheckCircle2 size={32} className="text-emerald-400" />
                <p className="text-sm font-black uppercase tracking-widest text-white/50">Thanks!</p>
              </div>
            ) : (
              <>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Bug, idea, or anything on your mind..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/20 resize-none focus:outline-none focus:border-white/30 font-medium"
                  autoFocus
                />
                <button
                  onClick={submit}
                  disabled={!text.trim() || sending}
                  className={cn(
                    "w-full h-12 rounded-xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all",
                    text.trim() && !sending
                      ? "bg-white text-black"
                      : "bg-white/10 text-white/30"
                  )}
                >
                  <Send size={14} /> {sending ? 'Sending...' : 'Send'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
