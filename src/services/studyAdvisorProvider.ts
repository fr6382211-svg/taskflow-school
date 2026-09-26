import type { ScheduleItem, Task } from '../types';
import type { FocusStreak } from './focusService';
import { computeSmartPlan, type SmartPlan } from './smartAdvisorService';

export interface StudyAdvisorInput { now: Date; tasks: Task[]; schedule: ScheduleItem[]; streak: FocusStreak; attendance?: Record<string, unknown>[]; userSettings?: Record<string, unknown>; }
export interface StudyAdvisorOutput { summary:string; riskLevel:'aman'|'waspada'|'kritis'; recommendations:string[]; focusBlocks:SmartPlan['blocks']; explanation:string[]; provider:'rule'|'ai'; }
export interface StudyAdvisorProvider { advise(input:StudyAdvisorInput):Promise<StudyAdvisorOutput>; }

export class RuleBasedProvider implements StudyAdvisorProvider { async advise(input:StudyAdvisorInput){const plan=computeSmartPlan(input.now,input.tasks,input.schedule,input.streak);return {summary:plan.headline,riskLevel:plan.riskLevel,recommendations:[plan.tip,...plan.reasons].slice(0,5),focusBlocks:plan.blocks,explanation:plan.reasons,provider:'rule' as const};} }

export class AIProvider implements StudyAdvisorProvider {
  constructor(private readonly gatewayUrl:string) {}
  async advise(input:StudyAdvisorInput):Promise<StudyAdvisorOutput>{
    if(!this.gatewayUrl) throw new Error('AI gateway belum dikonfigurasi.');
    const response=await fetch(this.gatewayUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tasks:input.tasks,schedule:input.schedule,focusHistory:input.streak,attendance:input.attendance??[],userSettings:input.userSettings??{}})});
    if(!response.ok) throw new Error(`AI gateway returned ${response.status}`);
    const payload=await response.json() as Partial<StudyAdvisorOutput>;
    if(!payload.summary || !payload.riskLevel || !Array.isArray(payload.recommendations)) throw new Error('Respons AI tidak valid.');
    return {summary:payload.summary,riskLevel:payload.riskLevel as StudyAdvisorOutput['riskLevel'],recommendations:payload.recommendations,focusBlocks:Array.isArray(payload.focusBlocks)?payload.focusBlocks:[],explanation:Array.isArray(payload.explanation)?payload.explanation:[],provider:'ai'};
  }
}

export async function getStudyAdvice(input:StudyAdvisorInput):Promise<StudyAdvisorOutput>{
  const fallback=new RuleBasedProvider();
  const gateway=typeof import.meta!=='undefined' ? String(import.meta.env.VITE_AI_GATEWAY_URL??'') : '';
  if(!gateway) return fallback.advise(input);
  try{return await new AIProvider(gateway).advise(input);}catch(error){console.warn('[StudyAdvisor] AI unavailable; deterministic fallback used.',error);return fallback.advise(input);}
}
