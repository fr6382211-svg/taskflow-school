import { createClient } from 'jsr:@supabase/supabase-js@2';
const APP_URL=Deno.env.get('ALLOWED_ORIGIN')??'https://pelajaranfathur.vercel.app';
const cors={'Access-Control-Allow-Origin':APP_URL,'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Vary':'Origin'};
Deno.serve(async(req)=>{if(req.method==='OPTIONS')return new Response('ok',{headers:cors});try{
  const auth=req.headers.get('Authorization'); if(!auth) return Response.json({error:'Unauthorized'},{status:401,headers:cors});
  const sb=createClient(Deno.env.get('SUPABASE_URL')??'',Deno.env.get('SUPABASE_ANON_KEY')??'',{global:{headers:{Authorization:auth}}});
  const {data:{user},error}=await sb.auth.getUser(); if(error||!user) return Response.json({error:'Unauthorized'},{status:401,headers:cors});
  const model=Deno.env.get('AI_MODEL')??''; const apiKey=Deno.env.get('AI_API_KEY')??''; if(!model||!apiKey) return Response.json({error:'AI gateway not configured'},{status:503,headers:cors});
  const input=await req.json();
  const prompt=`You are a deterministic school productivity coach. Return JSON only with keys summary,riskLevel,recommendations,focusBlocks,explanation. Do not invent facts. Base advice on this data:\n${JSON.stringify(input)}`;
  const response=await fetch(Deno.env.get('AI_API_URL')??'',{method:'POST',headers:{'Authorization':`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model,messages:[{role:'system',content:'Return strict JSON.'},{role:'user',content:prompt}]})});
  if(!response.ok) throw new Error(`AI upstream ${response.status}`); const raw=await response.json(); const text=raw?.choices?.[0]?.message?.content; if(!text) throw new Error('AI returned empty response');
  let parsed; try{parsed=JSON.parse(text)}catch{throw new Error('AI response was not JSON')};
  return Response.json(parsed,{headers:{...cors,'Content-Type':'application/json'}});
}catch(e){return Response.json({error:e instanceof Error?e.message:'Gateway error'},{status:500,headers:cors})}});
