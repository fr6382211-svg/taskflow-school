import { useEffect,useMemo,useState } from 'react';
import { subscribeAllTasks,subscribeUserTasks } from '../services/taskService';
import { useAuth } from '../context/AuthContext';
import { isOverdue } from '../lib/utils';
import type { Task } from '../types';
export function useTasks(admin=false){const {user}=useAuth();const [tasks,setTasks]=useState<Task[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState<unknown>(null);useEffect(()=>{if(!user){setTasks([]);setLoading(false);return}setLoading(true);const unsub=admin?subscribeAllTasks(setTasks,e=>{setError(e);setLoading(false)}):subscribeUserTasks(user.id,setTasks,e=>{setError(e);setLoading(false)});return()=>unsub()},[user,admin]);useEffect(()=>setLoading(false),[tasks]);return {tasks:tasks.map(t=>isOverdue(t)&&t.status!=='overdue'?{...t,status:'overdue' as const}:t),loading,error}}
export function useTaskStats(tasks:Task[]){return useMemo(()=>({total:tasks.length,pending:tasks.filter(t=>t.status==='pending').length,inProgress:tasks.filter(t=>t.status==='in_progress').length,completed:tasks.filter(t=>t.status==='completed').length,submitted:tasks.filter(t=>t.status==='submitted').length,overdue:tasks.filter(t=>isOverdue(t)).length}),[tasks])}
