import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface Props {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'aside';
}

export default function Reveal({ children, delay = 0, className, as = 'div' }: Props) {
  const Tag = as;
  const style: CSSProperties = { animationDelay: `${delay}ms` };
  return (
    <Tag className={cn('reveal-item', className)} style={style}>
      {children}
    </Tag>
  );
}
