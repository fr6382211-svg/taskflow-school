import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
export default function Card({children,className}:{children:ReactNode;className?:string}){return <section className={cn('rounded-2xl border border-slate-200/70 bg-white shadow-[0_10px_35px_rgba(15,23,42,.05)]',className)}>{children}</section>}
