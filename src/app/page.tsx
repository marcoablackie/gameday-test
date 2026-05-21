import GamedayFlow from '@/components/GamedayFlow';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-0 md:p-4 bg-black/95">
      <div className="w-full max-w-[440px] h-[100dvh] md:h-[850px] bg-background md:rounded-[3rem] md:shadow-2xl md:border-8 md:border-muted overflow-hidden relative flex flex-col">
        <GamedayFlow />
      </div>
    </main>
  );
}