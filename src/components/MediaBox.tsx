import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button } from '@schoolhub/ui';
import { QRCodeSVG } from 'qrcode.react';
import { useWatchParty } from '@/context/WatchPartyContext';
import { useTranslation } from '@/context/LanguageContext';
import { YouTubePlayer } from '@/components/YouTubePlayer';
import { parseYouTubeVideoId } from '@/lib/roomUtils';
import {
  AlertTriangle, Check, ChevronDown, ChevronUp, CircleUserRound, Copy, ExternalLink,
  Film, Fullscreen, Keyboard, Link2, ListVideo, Lock, Maximize2, Mic2, Minimize2,
  Pause, Play, Plus, Radio, RefreshCw, ScanLine, Settings2, ShieldCheck, SkipForward,
  Sparkles, Trash2, Unlock, Volume2, VolumeX, X, Users, WandSparkles, Clock3,
} from 'lucide-react';

export const MediaBox: React.FC = () => {
  const { t } = useTranslation();
  const {
    roomCode,
    roomState,
    queue,
    memberCount,
    creating,
    showQrModal,
    setShowQrModal,
    muted,
    setMuted,
    remoteUrl,
    handleCreateRoom,
    handleEndRoom,
    handlePlayNextInQueue,
    handleTogglePlayPause,
    handleAddUrlHost,
    handleRemoveQueueItem,
    handleToggleFullscreen,
    handleToggleRoomLock,
    handleToggleAutoplay,
    handleToggleCountdown,
    copyRemoteLink,
  } = useWatchParty();

  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [roomError, setRoomError] = useState('');
  const [queueOpen, setQueueOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [clock, setClock] = useState(new Date());

  const isPlaying = roomState?.playback?.status === 'playing';
  const isLocked = Boolean(roomState?.isLocked);
  const isAutoplay = Boolean(roomState?.isAutoplay);
  const isCountdown = Boolean(roomState?.isCountdownEnabled);
  const isFullscreen = Boolean(roomState?.isFullscreen);
  const volume = roomState?.playback?.volume ?? 80;
  const currentTitle = roomState?.currentlyPlayingTitle || 'Belum ada video diputar';
  const currentUrl = roomState?.currentlyPlaying || '';

  const status = useMemo(() => {
    if (!currentUrl) return 'IDLE';
    if (isPlaying) return 'PLAYING';
    return 'PAUSED';
  }, [currentUrl, isPlaying]);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!showQrModal) return;
    setSecondsLeft(30);
    const timer = window.setInterval(() => setSecondsLeft((v) => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [showQrModal]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.code === 'Space' && roomCode) { event.preventDefault(); void handleTogglePlayPause(); }
      if (event.key.toLowerCase() === 'm') setMuted((v) => !v);
      if (event.key.toLowerCase() === 'q') setQueueOpen((v) => !v);
      if (event.key.toLowerCase() === 'f' && roomCode) void handleToggleFullscreen();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleToggleFullscreen, handleTogglePlayPause, roomCode, setMuted]);

  const createRoom = async () => {
    setRoomError('');
    try {
      await handleCreateRoom();
    } catch (error) {
      setRoomError(error instanceof Error ? error.message : 'Gagal membuat ruang party.');
    }
  };

  const addVideo = async () => {
    setUrlError('');
    const value = url.trim();
    if (!value) return;
    if (!parseYouTubeVideoId(value)) {
      setUrlError('Masukkan URL YouTube yang valid.');
      return;
    }
    try {
      const ok = await handleAddUrlHost(value);
      if (ok) setUrl('');
    } catch (error) {
      setUrlError(error instanceof Error ? error.message : 'Video gagal ditambahkan.');
    }
  };

  const copyRoom = async () => {
    await copyRemoteLink();
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const formatClock = clock.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <Card className={`${isFullscreen ? 'fixed inset-0 z-[200] rounded-none border-0' : 'w-full'} overflow-hidden p-0 bg-slate-950 text-white`}>
      <div className="flex h-full min-h-[560px] flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
              <Film className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                <span>Media Box</span>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] tracking-widest text-white/45">{status}</span>
              </div>
              <p className="truncate text-sm font-semibold text-white/90">{currentTitle}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] text-white/55 sm:flex">
              <Users className="h-3.5 w-3.5 text-cyan-300" /> {memberCount} peserta
            </div>
            {roomCode && <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1.5 font-mono text-[10px] text-emerald-300">ROOM {roomCode}</div>}
          </div>
        </div>

        {!roomCode ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-400/[0.08] via-white/[0.03] to-violet-500/[0.06] p-7 text-center shadow-2xl">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 shadow-[0_0_50px_rgba(34,211,238,.12)]">
                <Radio className="h-9 w-9" />
              </div>
              <h3 className="text-2xl font-black tracking-tight">Watch Party siap digunakan</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/45">Buat ruang nyata di Firebase untuk menyinkronkan YouTube, antrean, Remote, QR, kontrol playback, dan semua peserta.</p>
              {roomError && <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-left text-xs text-red-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{roomError}</div>}
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Button disabled={creating} onClick={() => void createRoom()} className="h-11 rounded-xl bg-cyan-300 px-6 font-black text-slate-950 hover:bg-cyan-200">
                  {creating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4 fill-current" />}
                  {creating ? 'MEMBUAT RUANG…' : 'BUAT RUANG PARTY'}
                </Button>
                <Button variant="ghost" onClick={() => window.open(remoteUrl, '_blank', 'noopener,noreferrer')} className="h-11 rounded-xl border border-white/10 bg-white/5 text-white/75 hover:bg-white/10">
                  <ExternalLink className="mr-2 h-4 w-4" /> Open Remote
                </Button>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2 text-left sm:grid-cols-4">
                {[
                  [ShieldCheck, 'Firebase Sync'], [ListVideo, 'Smart Queue'], [ScanLine, 'QR Remote'], [WandSparkles, 'Autoplay'],
                ].map(([Icon, label]) => (
                  <div key={label as string} className="rounded-xl border border-white/10 bg-black/20 p-3"><Icon className="mb-2 h-4 w-4 text-cyan-300" /><p className="text-[10px] font-semibold text-white/60">{label as string}</p></div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="relative flex-1 bg-black">
              <div className="absolute left-3 top-3 z-30 flex items-center gap-2 rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-[10px] text-white/65 backdrop-blur-xl">
                <Clock3 className="h-3.5 w-3.5 text-cyan-300" /> {formatClock}
                {isLocked && <span className="text-amber-300">• LOCKED</span>}
              </div>
              <div className="absolute right-3 top-3 z-30 flex gap-2">
                <Button size="icon" variant="ghost" onClick={() => setShowQrModal(true)} className="h-9 w-9 rounded-xl border border-white/10 bg-black/60 text-white/70 hover:text-white" title="QR Remote"><ScanLine className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => void handleToggleFullscreen()} className="h-9 w-9 rounded-xl border border-white/10 bg-black/60 text-white/70 hover:text-white" title="Fullscreen">{isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</Button>
              </div>

              {currentUrl ? (
                <div className="absolute inset-0">
                  <YouTubePlayer url={currentUrl} isPlaying={isPlaying && !isLocked} volume={volume} muted={muted} onEnded={handlePlayNextInQueue} />
                </div>
              ) : (
                <div className="flex h-full min-h-[330px] items-center justify-center bg-[radial-gradient(circle_at_center,rgba(34,211,238,.08),transparent_45%),#020617] p-6 text-center">
                  <div className="max-w-md">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.04] text-white/40"><Film className="h-9 w-9" /></div>
                    <h3 className="mt-5 text-lg font-bold">Tambahkan video pertama</h3>
                    <p className="mt-2 text-sm text-white/40">Masukkan link YouTube di panel bawah. Video pertama langsung diputar, video berikutnya masuk antrean.</p>
                  </div>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black via-black/80 to-transparent px-4 pb-4 pt-16">
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div className="min-w-0"><p className="truncate text-sm font-bold">{currentTitle}</p><p className="mt-1 text-[10px] uppercase tracking-widest text-white/35">Volume {volume}% · {muted ? 'Muted' : 'Audio aktif'}</p></div>
                  <div className="hidden items-center gap-1 text-[9px] uppercase tracking-widest text-white/30 sm:flex"><Keyboard className="h-3 w-3" /> Space · M · F · Q</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="icon" onClick={() => void handleTogglePlayPause()} disabled={isLocked || !currentUrl} className="h-11 w-11 rounded-xl bg-white text-slate-950 hover:bg-white/90">{isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}</Button>
                  <Button size="icon" onClick={() => void handlePlayNextInQueue()} disabled={isLocked || queue.length === 0} className="h-11 w-11 rounded-xl border border-white/10 bg-white/10 text-white hover:bg-white/15"><SkipForward className="h-5 w-5" /></Button>
                  <Button size="icon" onClick={() => setMuted((v) => !v)} className="h-11 w-11 rounded-xl border border-white/10 bg-white/10 text-white hover:bg-white/15">{muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}</Button>
                  <Button size="icon" onClick={() => setQueueOpen((v) => !v)} className={`h-11 w-11 rounded-xl border ${queueOpen ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300' : 'border-white/10 bg-white/10 text-white'} hover:bg-white/15`}><ListVideo className="h-5 w-5" /></Button>
                  <Button size="icon" onClick={() => void handleToggleRoomLock()} className={`h-11 w-11 rounded-xl border ${isLocked ? 'border-amber-400/30 bg-amber-400/10 text-amber-300' : 'border-white/10 bg-white/10 text-white'} hover:bg-white/15`}>{isLocked ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}</Button>
                  <Button size="icon" onClick={() => void handleToggleAutoplay()} className={`h-11 w-11 rounded-xl border ${isAutoplay ? 'border-violet-400/30 bg-violet-400/10 text-violet-300' : 'border-white/10 bg-white/10 text-white'} hover:bg-white/15`}><Sparkles className="h-5 w-5" /></Button>
                  <Button size="icon" onClick={() => void handleToggleCountdown()} className={`h-11 w-11 rounded-xl border ${isCountdown ? 'border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-300' : 'border-white/10 bg-white/10 text-white'} hover:bg-white/15`}><Clock3 className="h-5 w-5" /></Button>
                </div>
              </div>

              {queueOpen && (
                <aside className="absolute inset-y-0 right-0 z-40 w-full max-w-sm border-l border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-2xl sm:w-[370px]">
                  <div className="flex items-center justify-between"><div><p className="text-sm font-bold">Antrean Video</p><p className="mt-1 text-[10px] text-white/35">{queue.length} item menunggu</p></div><Button size="icon" variant="ghost" onClick={() => setQueueOpen(false)} className="h-8 w-8"><X className="h-4 w-4" /></Button></div>
                  <div className="mt-4 space-y-2 overflow-auto pr-1" style={{ maxHeight: 'calc(100% - 95px)' }}>
                    {queue.length === 0 && <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-xs text-white/35">Antrean masih kosong.</div>}
                    {queue.map((item, index) => (
                      <div key={item.id} className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <span className="font-mono text-xs text-cyan-300">{String(index + 1).padStart(2, '0')}</span>
                        <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-white/80">{item.title || item.url}</p><p className="mt-1 truncate text-[9px] text-white/30">{item.addedBy}</p></div>
                        <Button size="icon" variant="ghost" onClick={() => void handleRemoveQueueItem(item.id)} className="h-8 w-8 text-white/35 opacity-70 hover:text-red-300 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    ))}
                  </div>
                </aside>
              )}
            </div>

            <div className="border-t border-white/10 bg-white/[0.02] p-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-1.5 focus-within:border-cyan-400/30">
                    <Link2 className="ml-2 h-4 w-4 text-cyan-300/70" />
                    <input value={url} onChange={(e) => { setUrl(e.target.value); setUrlError(''); }} onKeyDown={(e) => { if (e.key === 'Enter') void addVideo(); }} placeholder="Tempel URL YouTube di sini…" className="min-w-0 flex-1 bg-transparent px-1 text-xs text-white outline-none placeholder:text-white/25" />
                    <Button onClick={() => void addVideo()} className="h-9 rounded-lg bg-cyan-300 px-3 text-xs font-bold text-slate-950 hover:bg-cyan-200"><Plus className="mr-1.5 h-4 w-4" /> Tambah</Button>
                  </div>
                  {urlError && <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-red-300"><AlertTriangle className="h-3 w-3" />{urlError}</div>}
                </div>
                <div className="grid grid-cols-4 gap-2 sm:flex">
                  <Button size="sm" variant="ghost" onClick={() => setQueueOpen((v) => !v)} className="border border-white/10 bg-white/[0.03] text-white/65"><ListVideo className="mr-1.5 h-3.5 w-3.5" />Queue {queue.length}</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowQrModal(true)} className="border border-white/10 bg-white/[0.03] text-white/65"><ScanLine className="mr-1.5 h-3.5 w-3.5" />QR</Button>
                  <Button size="sm" variant="ghost" onClick={() => void copyRoom()} className="border border-white/10 bg-white/[0.03] text-white/65"><Copy className="mr-1.5 h-3.5 w-3.5" />{copied ? 'OK' : 'Share'}</Button>
                  <Button size="sm" variant="ghost" onClick={() => void handleEndRoom()} className="border border-red-400/15 bg-red-400/[0.04] text-red-300/80"><X className="mr-1.5 h-3.5 w-3.5" />End</Button>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-[9px] uppercase tracking-[0.15em] text-white/25">
                <div className="flex items-center gap-3"><span className="flex items-center gap-1.5"><CircleUserRound className="h-3 w-3 text-cyan-300/60" /> {memberCount} peserta</span><span className="hidden sm:inline">{isAutoplay ? 'AUTO NEXT ON' : 'AUTO NEXT OFF'}</span><span className="hidden sm:inline">{isCountdown ? 'COUNTDOWN ON' : 'COUNTDOWN OFF'}</span></div>
                <button type="button" className="flex items-center gap-1 hover:text-white/50" onClick={() => setDetailsOpen((v) => !v)}>{detailsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />} status</button>
              </div>
              {detailsOpen && <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-white/35 sm:grid-cols-4"><div className="rounded-lg bg-white/[0.03] p-2"><p className="text-white/20">Playback</p><p className="mt-1 font-semibold text-white/55">{status}</p></div><div className="rounded-lg bg-white/[0.03] p-2"><p className="text-white/20">Volume</p><p className="mt-1 font-semibold text-white/55">{volume}%</p></div><div className="rounded-lg bg-white/[0.03] p-2"><p className="text-white/20">Room</p><p className="mt-1 font-mono font-semibold text-cyan-300/70">{roomCode}</p></div><div className="rounded-lg bg-white/[0.03] p-2"><p className="text-white/20">Remote</p><p className="mt-1 font-semibold text-emerald-300/60">READY</p></div></div>}
            </div>
          </>
        )}
      </div>

      {showQrModal && roomCode && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Remote Access</p><h3 className="mt-1 text-lg font-bold">Scan untuk kontrol dari HP</h3></div><Button size="icon" variant="ghost" onClick={() => setShowQrModal(false)} className="h-8 w-8"><X className="h-4 w-4" /></Button></div>
            <div className="mt-5 flex justify-center"><div className="rounded-2xl border-4 border-white bg-white p-3"><QRCodeSVG value={remoteUrl} size={190} level="M" /></div></div>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center"><p className="text-[9px] uppercase tracking-[0.2em] text-white/30">Kode ruang</p><p className="mt-1 font-mono text-3xl font-black tracking-[0.25em] text-cyan-300">{roomCode}</p><p className="mt-2 text-[10px] text-white/30">QR tertutup otomatis dalam {secondsLeft} detik</p></div>
            <div className="mt-4 flex gap-2"><Button onClick={() => void copyRoom()} className="flex-1 bg-cyan-300 text-slate-950 hover:bg-cyan-200"><Copy className="mr-2 h-4 w-4" />Copy Link</Button><Button variant="ghost" onClick={() => window.open(remoteUrl, '_blank', 'noopener,noreferrer')} className="flex-1 border border-white/10 bg-white/[0.03]"><ExternalLink className="mr-2 h-4 w-4" />Open Remote</Button></div>
          </div>
        </div>
      )}
    </Card>
  );
};
