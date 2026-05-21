
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Zap, Mail, Lock, Loader2, ArrowRight, AlertTriangle, PlayCircle, UserPlus, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AuthScreen() {
  const auth = useAuth();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemoBypass = () => {
    window.dispatchEvent(new CustomEvent('demo-bypass'));
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Simulation Mode: If Firebase is not configured, simulate success to let the user see the app
    if (!auth || !auth.app.options.apiKey) {
      setLoading(true);
      
      toast({
        title: "Simulation Mode Active",
        description: "Firebase API Key missing. Simulating authentication for testing.",
      });

      setTimeout(() => {
        handleDemoBypass();
        setLoading(false);
      }, 1000);
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      let message = "Authentication failed. Please try again.";
      if (err.code === 'auth/invalid-credential') message = "Invalid email or password.";
      if (err.code === 'auth/user-not-found') message = "No athlete profile found with this email.";
      if (err.code === 'auth/wrong-password') message = "Incorrect password.";
      if (err.code === 'auth/email-already-in-use') message = "This email is already registered.";
      if (err.code === 'auth/weak-password') message = "Password must be at least 6 characters.";
      if (err.code === 'auth/invalid-email') message = "Please enter a valid email address.";
      if (err.code === 'auth/operation-not-allowed') message = "Authentication method not enabled. Please contact support.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    if (!auth || !auth.app.options.apiKey) {
      toast({
        title: "Simulation Mode Active",
        description: "Simulating Google Sync for testing.",
      });
      handleDemoBypass();
      return;
    }

    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      let message = "Google Sync failed. Please try again.";
      if (err.code === 'auth/popup-closed-by-user') message = "Sign-in cancelled.";
      if (err.code === 'auth/operation-not-allowed') message = "Google sign-in is not enabled. Please contact support.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background p-8 pt-20 animate-in fade-in duration-200">
      <div className="space-y-6 mb-12">
        <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground neon-glow mb-8">
          <Zap size={32} className="fill-current" />
        </div>
        <h1 className="text-4xl font-headline font-black italic uppercase leading-none tracking-tighter">
          {isLogin ? 'Initialize' : 'Create'} <br /> Protocol
        </h1>
        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] italic">
          Athlete credentials required
        </p>
      </div>

      <form onSubmit={handleAuth} className="space-y-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-white/30">Athlete Email</Label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
            <Input 
              type="email" 
              placeholder="athlete@gameday.pro" 
              className="h-14 pl-12 bg-white/5 border-white/10 text-white rounded-xl focus:ring-primary"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-white/30">Athlete Password</Label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
            <Input 
              type="password" 
              placeholder="••••••••" 
              className="h-14 pl-12 bg-white/5 border-white/10 text-white rounded-xl focus:ring-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3 text-destructive animate-in slide-in-from-top-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <p className="text-[10px] font-black uppercase italic leading-relaxed">{error}</p>
          </div>
        )}

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full h-16 rounded-2xl bg-primary text-primary-foreground text-lg font-black uppercase italic hover:bg-white/90 transition-all neon-glow"
        >
          {loading ? <Loader2 className="animate-spin" /> : (
            <div className="flex items-center gap-2">
              {isLogin ? 'Log In' : 'Create Profile'}
              <ArrowRight size={20} />
            </div>
          )}
        </Button>
      </form>

      <div className="mt-8 space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
          <span className="relative bg-background px-4 text-[8px] font-black uppercase tracking-[0.3em] text-white/20">OR</span>
        </div>

        <Button 
          onClick={handleGoogleSignIn}
          disabled={loading}
          type="button"
          variant="outline" 
          className="w-full h-14 rounded-2xl border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10"
        >
          {loading && !email ? <Loader2 className="animate-spin mr-2" /> : null}
          Sync with Google
        </Button>

        <button 
          onClick={() => { setError(null); setIsLogin(!isLogin); }}
          className="w-full text-center text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors italic pt-4 flex items-center justify-center gap-2"
        >
          {isLogin ? (
            <><UserPlus size={14} /> Need a new account? Sign Up</>
          ) : (
            <><LogIn size={14} /> Already registered? Log In</>
          )}
        </button>

        {!auth?.app.options.apiKey && (
          <div className="pt-8 flex flex-col items-center">
            <p className="text-[8px] font-black uppercase text-white/10 mb-2 italic">Simulation Mode Active (No API Key)</p>
             <button 
              onClick={handleDemoBypass}
              className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/40 hover:text-primary transition-all flex items-center gap-2"
            >
              <PlayCircle size={12} /> Instant Demo Access
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
