import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const RESEND_FROM = Deno.env.get('RESEND_FROM_EMAIL') ?? '';
const APP_URL = Deno.env.get('APP_URL') ?? 'https://pelajaranfathur.vercel.app';
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;
const DAY_INDEX: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const MAZET_SCHEDULE: Record<string, Array<{ waktu: string; mata_kuliah: string; dosen?: string; ruang?: string }>> = {
  Senin: [
    { waktu: '07.00-09.30', mata_kuliah: 'Language Assessment', dosen: 'Dr. Metty Augustine Primary, S.Pd., M.Pd.', ruang: 'ING-4 (ZOOM)' },
    { waktu: '09.35-12.05', mata_kuliah: 'Quantitative Research in ELT', dosen: 'Nita Sari Narulita Dewi, S.Pd., M.Pd.', ruang: 'ING-3 (ZOOM)' },
  ],
  Selasa: [
    { waktu: '07.00-09.30', mata_kuliah: 'Qualitative Research in ELT', dosen: 'Dr. Agis Andriani, S.Pd., M.Hum.', ruang: 'ING-6 (ZOOM)' },
    { waktu: '09.35-12.05', mata_kuliah: 'Methodology in ELT', dosen: 'Dr. Yusup Supriyono, M.Pd.', ruang: 'C.2.2' },
    { waktu: '14.45-16.25', mata_kuliah: 'Micro-Teaching', dosen: 'Junjun Muhamad Ramdani, S.Pd., M.Pd., Ph.D.', ruang: 'MT.1 - Micro Teaching 1' },
  ],
  Rabu: [],
  Kamis: [
    { waktu: '13.00-14.40', mata_kuliah: 'Language Material Evaluation and Design', dosen: 'Dr. Asri Siti Fatimah, M.Pd.', ruang: 'ING-5 (ZOOM)' },
    { waktu: '15.35-17.15', mata_kuliah: 'Lesson Planning in ELT', dosen: 'Dr. Metty Augustine Primary, S.Pd., M.Pd.', ruang: 'C.2.2' },
  ],
  Jumat: [
    { waktu: '13.00-15.30', mata_kuliah: 'English for Tourism', dosen: 'Dr. Ratu Sarah Pujasari, M.Pd.', ruang: 'ING-2 (ZOOM)' },
  ],
  Sabtu: [
    { waktu: '13.00-14.40', mata_kuliah: 'Literasi Teknologi Informasi', dosen: 'Dr. Ratu Sarah Pujasari, M.Pd. - Santiana, S.S., M.Pd.', ruang: 'ING-2 (ZOOM)' },
  ],
};

function jakartaNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
}

function isoDate(date: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(date);
}

function nextDate() {
  const d = jakartaNow();
  d.setDate(d.getDate() + 1);
  return isoDate(d);
}

async function loadLessons(workspaceId: string, targetDate: string) {
  if (workspaceId === 'mazet') {
    const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', weekday: 'long' }).format(new Date(`${targetDate}T12:00:00+07:00`));
    return MAZET_SCHEDULE[DAY_NAMES[DAY_INDEX[weekday] ?? 0]] ?? [];
  }

  const { data, error } = await supabase
    .from('schedule')
    .select('day,start_time,end_time,subject,teacher,type,active')
    .eq('active', true)
    .eq('type', 'subject')
    .order('start_time');
  if (error) throw error;

  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', weekday: 'long' }).format(new Date(`${targetDate}T12:00:00+07:00`));
  const dayName = DAY_NAMES[DAY_INDEX[weekday] ?? 0];
  return (data ?? []).filter((item) => item.day === dayName);
}

function esc(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function renderLessons(lessons: Array<Record<string, string>>) {
  if (!lessons.length) return `<div style="padding:16px;border:1px dashed #d1d5db;border-radius:12px;color:#64748b">Tidak ada pelajaran terjadwal besok.</div>`;
  return lessons.map((lesson) => {
    const time = String(lesson.waktu ?? `${lesson.start_time ?? ''}–${lesson.end_time ?? ''}`).replace('.', ':');
    const subject = lesson.mata_kuliah ?? lesson.subject ?? '';
    const teacher = lesson.dosen ?? lesson.teacher ?? '';
    const room = lesson.ruang ?? lesson.location ?? '';
    return `<div style="padding:14px 0;border-bottom:1px solid #e5e7eb"><div style="font-weight:700;color:#111827">${esc(subject)}</div><div style="font-size:12px;color:#64748b;margin-top:4px">${esc(time)} WIB${teacher ? ` • ${esc(teacher)}` : ''}${room ? ` • ${esc(room)}` : ''}</div></div>`;
  }).join('');
}

function renderTasks(tasks: Array<Record<string, unknown>>) {
  if (!tasks.length) return `<div style="padding:16px;border:1px dashed #d1d5db;border-radius:12px;color:#64748b">Besok tidak ada tugas aktif. Tetap siap untuk pelajaran besok.</div>`;
  return tasks.map((task) => `<div style="padding:14px 0;border-bottom:1px solid #e5e7eb"><div style="font-weight:700;color:#111827">${esc(String(task.title ?? 'Tugas'))}</div><div style="font-size:12px;color:#64748b;margin-top:4px">${esc(String(task.subjectName ?? ''))} • Deadline ${esc(String(task.dueTime ?? '23:59'))} WIB • ${esc(String(task.priority ?? 'medium'))}</div></div>`).join('');
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY || !RESEND_FROM) throw new Error('RESEND_API_KEY / RESEND_FROM_EMAIL belum diset.');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: RESEND_FROM, to: [to], subject, html }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.message ?? `Email provider returned ${response.status}`);
  return String(body?.id ?? '');
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  if (CRON_SECRET && req.headers.get('x-cron-secret') !== CRON_SECRET) return new Response('Unauthorized', { status: 401 });

  const targetDate = nextDate();
  const { data: targets, error } = await supabase.rpc('get_daily_digest_targets', { p_target_date: targetDate });
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  const results: Array<Record<string, unknown>> = [];

  for (const target of targets ?? []) {
    const { data: existing } = await supabase
      .from('daily_email_digest_log')
      .select('id')
      .eq('user_id', target.user_id)
      .eq('digest_date', targetDate)
      .maybeSingle();

    if (existing) {
      results.push({ email: target.email, skipped: true });
      continue;
    }

    try {
      const tasks = Array.isArray(target.tasks) ? target.tasks : [];
      const lessons = await loadLessons(String(target.workspace_id ?? 'fathur'), targetDate);
      const dateLabel = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'full' }).format(new Date(`${targetDate}T12:00:00+07:00`));

      const html = `<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;color:#111827"><div style="max-width:680px;margin:0 auto;padding:32px 18px"><div style="background:#111827;border-radius:18px;padding:24px;color:#fff"><div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#a5b4fc;font-weight:800">FATHUR SCHOOL HUB</div><h1 style="margin:8px 0 0;font-size:27px">Rencana untuk besok</h1><p style="margin:8px 0 0;color:#cbd5e1">${esc(dateLabel)} • Workspace ${esc(String(target.workspace_id ?? 'fathur'))}</p></div><div style="background:#fff;margin-top:14px;border-radius:18px;padding:22px;border:1px solid #e5e7eb"><h2 style="margin:0 0 10px">Halo, ${esc(String(target.name ?? 'Pengguna'))} 👋</h2><p style="color:#64748b;line-height:1.6">Berikut ringkasan tugas dan pelajaran untuk besok. Email ini dikirim setiap hari pukul 18:00 WIB.</p><h3 style="margin:22px 0 8px">Tugas besok</h3>${renderTasks(tasks)}<h3 style="margin:22px 0 8px">Pelajaran besok</h3>${renderLessons(lessons as Array<Record<string, string>>)}<p style="margin-top:24px"><a href="${APP_URL}/" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 16px;border-radius:10px;font-weight:700">Buka Fathur School Hub</a></p></div><div style="padding:18px 4px;color:#94a3b8;font-size:11px">Notifikasi otomatis • Fathur School Hub</div></div></body></html>`;
      const messageId = await sendEmail(String(target.email), `Agenda besok • ${dateLabel}`, html);

      await supabase.from('daily_email_digest_log').insert({
        user_id: target.user_id,
        digest_date: targetDate,
        task_count: tasks.length,
        lesson_count: lessons.length,
        provider_message_id: messageId || null,
      });

      results.push({ email: target.email, sent: true, taskCount: tasks.length, lessonCount: lessons.length });
    } catch (sendError) {
      results.push({ email: target.email, sent: false, error: sendError instanceof Error ? sendError.message : String(sendError) });
    }
  }

  return Response.json({ ok: true, targetDate, results });
});
