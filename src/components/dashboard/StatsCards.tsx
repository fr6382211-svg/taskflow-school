import { AlertTriangle, CheckCircle2, ClipboardList, Clock3, CircleDot, type LucideIcon } from 'lucide-react';
import Card from '../ui/Card';
type Props={stats:{total:number;pending:number;inProgress:number;completed:number;overdue:number}};
export default function StatsCards({stats}:Props){
  const data:Array<{label:string;value:number;Icon:LucideIcon;cls:string}>=[
    {label:'Total Tugas',value:stats.total,Icon:ClipboardList,cls:'text-blue-600 bg-blue-50'},
    {label:'Belum Selesai',value:stats.pending,Icon:CircleDot,cls:'text-slate-600 bg-slate-100'},
    {label:'Dikerjakan',value:stats.inProgress,Icon:Clock3,cls:'text-amber-600 bg-amber-50'},
    {label:'Selesai',value:stats.completed,Icon:CheckCircle2,cls:'text-emerald-600 bg-emerald-50'},
    {label:'Terlambat',value:stats.overdue,Icon:AlertTriangle,cls:'text-rose-600 bg-rose-50'}
  ];
  return <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">{data.map(({label,value,Icon,cls})=><Card key={label} className="p-4"><div className="flex items-start justify-between gap-3"><div><div className="text-xs font-semibold text-slate-500">{label}</div><div className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{value}</div></div><div className={`rounded-xl p-2.5 ${cls}`}><Icon size={18}/></div></div></Card>)}</div>;
}
