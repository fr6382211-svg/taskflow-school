export type Role = 'user' | 'admin';
export type UserStatus = 'active' | 'disabled';
export type TaskStatus = 'pending' | 'in_progress' | 'submitted' | 'completed' | 'overdue';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type ScheduleType = 'subject' | 'break' | 'ceremony' | 'religious_break' | 'school_activity';
export interface UserProfile { uid:string; name:string; email:string; photoURL?:string; role:Role; status:UserStatus; createdAt?:string; updatedAt?:string; lastLoginAt?:string; }
export interface Task { id:string; title:string; description:string; subjectId:string; subjectName:string; teacherName:string; createdBy:string; createdByName:string; assignedTo:string; dueDate:string; dueTime:string; dueAt?:string; status:TaskStatus; priority:Priority; fileUrl?:string; fileName?:string; fileType?:string; fileSize?:number; storagePath?:string; createdAt?:string; updatedAt?:string; completedAt?:string; submissionStatus?:string; notes?:string; }
export interface ScheduleItem { id:string; day:'Senin'|'Selasa'|'Rabu'|'Kamis'|'Jumat'; startTime:string; endTime:string; subject:string; teacher?:string; type:ScheduleType; active:boolean; createdAt?:string; updatedAt?:string; }
export interface Subject { id:string; name:string; teacher?:string; active:boolean; createdAt?:string; updatedAt?:string; }
export interface Teacher { id:string; name:string; email?:string; subject?:string; active:boolean; createdAt?:string; updatedAt?:string; }
export interface Notification { id:string; userId:string; title:string; message:string; type:'deadline'|'task'|'system'|'announcement'|'security'; read:boolean; createdAt?:string; actionUrl?:string; }
export interface Announcement { id:string; title:string; body:string; priority:'low'|'medium'|'high'; createdBy:string; createdAt?:string; expiresAt?:string; active:boolean; }
export interface AuditLog { id:string; userId:string; userEmail:string; action:string; targetType?:string; targetId?:string; timestamp?:string; metadata?:Record<string,unknown>; }
