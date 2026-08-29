import Badge from './Badge';
import type { TaskStatus, Priority } from '../../types';
export function StatusBadge({status}:{status:TaskStatus}){const map:Record<TaskStatus,[string,'green'|'amber'|'red'|'blue'|'slate']>={pending:['Belum selesai','slate'],in_progress:['Dikerjakan','blue'],submitted:['Dikumpulkan','purple' as 'blue'],completed:['Selesai','green'],overdue:['Terlambat','red']};const [label,tone]=map[status];return <Badge tone={tone}>{label}</Badge>}
export function PriorityBadge({priority}:{priority:Priority}){const map:Record<Priority,[string,'green'|'amber'|'red'|'purple'|'slate']>={low:['Low','green'],medium:['Medium','amber'],high:['High','red'],urgent:['Urgent','purple']};const [l,t]=map[priority];return <Badge tone={t}>{l}</Badge>}
