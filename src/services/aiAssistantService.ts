// FAZET AI — direct client-side calls, by explicit request of the app owner
// (Fathur & Mazet only, private-use app). These keys ship inside the app
// bundle/APK, which means anyone who gets hold of the APK file could
// extract and reuse them — not just the two intended users. Keep this in
// mind if the app is ever shared, uploaded, or a device is lost/sold.
const GEMINI_API_KEY = 'AQ.Ab8RN6LNo359g21E7BcCuYlHfpSE6d49MzmNScgRzZ4XyoX96Q';
const OPENROUTER_API_KEY = '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';
const DEEPSEEK_API_KEY = 'sk-9c29abfbeec34ae59429dcefbce6a920';

const GEMINI_MODEL = 'gemini-flash-latest';
const OPENROUTER_MODEL = 'google/gemini-2.5-pro'; // Gemini "Pro", not Flash.
const DEEPSEEK_MODEL = 'deepseek-chat';

export interface AiChatTurn { role: 'user' | 'model'; text: string; }

function toOpenAiMessages(history: AiChatTurn[], prompt: string, workspace: 'fathur' | 'mazet') {
  const workspaceLabel = workspace === 'mazet' ? 'Mazet (college workspace)' : 'Fathur (school workspace)';
  return [
    {
      role: 'system' as const,
      content: `You are the FAZET assistant, helping a student in the ${workspaceLabel}. Be concise, friendly, and practical. Reply in the same language the student used (usually Indonesian).`,
    },
    ...history.map((turn) => ({ role: (turn.role === 'model' ? 'assistant' : 'user') as 'assistant' | 'user', content: turn.text })),
    { role: 'user' as const, content: prompt },
  ];
}

function systemPromptFor(workspace: 'fathur' | 'mazet') {
  const workspaceLabel = workspace === 'mazet' ? 'Mazet (college workspace)' : 'Fathur (school workspace)';
  return `You are the FAZET assistant, helping a student in the ${workspaceLabel}. Be concise, friendly, and practical. Reply in the same language the student used (usually Indonesian).`;
}

async function callGemini(history: AiChatTurn[], prompt: string, workspace: 'fathur' | 'mazet'): Promise<string> {
  const contents = [
    ...history.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
    { role: 'user' as const, parts: [{ text: prompt }] },
  ];
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': GEMINI_API_KEY },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemPromptFor(workspace) }] },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini error ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('');
  if (!text) throw new Error('Gemini returned an empty response');
  return text as string;
}

async function callOpenRouter(history: AiChatTurn[], prompt: string, workspace: 'fathur' | 'mazet'): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://pelajaranfathur.vercel.app',
      'X-Title': 'FAZET',
    },
    body: JSON.stringify({ model: OPENROUTER_MODEL, messages: toOpenAiMessages(history, prompt, workspace) }),
  });
  if (!res.ok) throw new Error(`OpenRouter error ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenRouter returned an empty response');
  return text as string;
}

async function callDeepSeek(history: AiChatTurn[], prompt: string, workspace: 'fathur' | 'mazet'): Promise<string> {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
    body: JSON.stringify({ model: DEEPSEEK_MODEL, messages: toOpenAiMessages(history, prompt, workspace) }),
  });
  if (!res.ok) throw new Error(`DeepSeek error ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('DeepSeek returned an empty response');
  return text as string;
}

/**
 * Asks the FAZET AI assistant. Tries Gemini directly first (Google's own
 * API); if that fails (rate limit, outage, bad key) it falls back to
 * OpenRouter's Gemini 2.5 Pro, and if that also fails, to DeepSeek — so
 * Fathur & Mazet still get an answer as long as one provider is up.
 */
export async function askAiAssistant(args: { prompt: string; history?: AiChatTurn[]; workspace: 'fathur' | 'mazet' }): Promise<string> {
  const history = args.history ?? [];
  try {
    return await callGemini(history, args.prompt, args.workspace);
  } catch (geminiError) {
    console.error('[FAZET AI] Gemini (direct) failed, falling back to OpenRouter:', geminiError);
    try {
      return await callOpenRouter(history, args.prompt, args.workspace);
    } catch (openRouterError) {
      console.error('[FAZET AI] OpenRouter failed, falling back to DeepSeek:', openRouterError);
      try {
        return await callDeepSeek(history, args.prompt, args.workspace);
      } catch (deepSeekError) {
        console.error('[FAZET AI] DeepSeek fallback also failed:', deepSeekError);
        throw new Error('AI sedang tidak bisa dihubungi (ketiga provider gagal). Coba lagi sebentar lagi.');
      }
    }
  }
}
