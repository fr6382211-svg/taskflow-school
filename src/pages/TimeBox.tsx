import { ThemeProvider, ConstellationsBackground, useTheme } from '@schoolhub/ui';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ClockSection } from '@/components/ClockSection';
import { ScheduleSection } from '@/components/ScheduleSection';
import { MediaBox } from '@/components/MediaBox';
import { Footer } from '@/components/Footer';
import { WatchPartyProvider } from '@/context/WatchPartyContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import '@/timebox-ui.css';

function TimeBoxWorkspace(){
  const { isDark, toggleThemeMode } = useTheme();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const panel = searchParams.get('panel');
    if (!panel) return;
    const timer = window.setTimeout(() => {
      document.getElementById('timebox-media')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  return <WatchPartyProvider>
    <LanguageSwitcher className="fixed top-4 right-18 sm:right-20 z-40" hideOnFullscreen />
    <ConstellationsBackground particleCount={40} />
    <div className="timebox-shell timebox-scope relative z-10 min-h-[calc(100dvh-2rem)] w-full rounded-2xl border border-white/10 bg-[#090a0f]/95 p-3 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-4 md:p-5 lg:p-6">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-[1880px] flex-col gap-4">
        <Header theme={isDark ? 'dark' : 'light'} toggleTheme={toggleThemeMode} />
        <div className="timebox-main flex flex-col gap-4 py-2 md:gap-5">
          <ClockSection />
          <main className="timebox-grid timebox-content-grid items-stretch">
            <ScheduleSection />
            <section id="timebox-media" className="min-w-0 scroll-mt-24">
              <MediaBox />
            </section>
          </main>
        </div>
        <Footer />
      </div>
    </div>
  </WatchPartyProvider>;
}

export default function TimeBox(){
  return <ThemeProvider><LanguageProvider><TimeBoxWorkspace/></LanguageProvider></ThemeProvider>;
}
