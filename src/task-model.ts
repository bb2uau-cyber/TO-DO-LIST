export type Priority = 'normal' | 'important' | 'urgent';
export type Attachment = { id: string; url: string; name?: string };
export type Task = { id:string; title:string; category:string; priority:Priority; due:string; createdAt:string; note?:string; image?:string; done:boolean; startAt?:string; endAt?:string; allDay?:boolean; attachments?:Attachment[] };
const uid = () => crypto.randomUUID();
export const addHoursLocal=(value:string,hours:number)=>{const d=new Date(value);d.setHours(d.getHours()+hours);const pad=(n:number)=>String(n).padStart(2,'0');return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`};
export function migrateTask(task: Task): Task {
  const date=(task.startAt||task.due||new Date().toISOString()).slice(0,10);
  const time=(task.startAt||task.due||'').includes('T')?(task.startAt||task.due).slice(11,16):'09:00';
  const startAt=task.startAt||`${date}T${time}`;
  // Older local records may have been created with a UTC conversion, which can
  // make an end time appear earlier than its start time in the local timezone.
  // Repair those records during migration without touching the task itself.
  const endAt=!task.endAt||new Date(task.endAt)<=new Date(startAt)?addHoursLocal(startAt,2):task.endAt;
  return {...task,due:task.due||startAt,startAt,endAt,allDay:task.allDay??false,attachments:task.attachments||(task.image?[{id:uid(),url:task.image,name:'原附件'}]:[])};
}
export const migrateTasks=(tasks:Task[])=>tasks.map(migrateTask);
export const taskDate=(task:Task)=>(task.startAt||task.due).slice(0,10);
export const taskMinutes=(value:string)=>{const [,time='09:00']=value.split('T');const [h,m]=time.split(':').map(Number);return h*60+m};
