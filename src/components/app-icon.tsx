import { cn } from '@/lib/utils';
import type { UserRole } from '@/lib/types';
import type { ReactElement } from 'react';

export interface AppIconProps {
  id: string;
  label: string;
  icon: ReactElement;
  onClick: () => void;
  color?: string;
  roles?: UserRole[];
}

export function AppIcon({ label, icon, onClick, color }: AppIconProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={onClick}
        className={cn(
          'flex items-center justify-center w-20 h-20 rounded-2xl shadow-md transition-all duration-300 ease-in-out transform hover:scale-110 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-ring focus:ring-offset-background',
          color || 'bg-secondary'
        )}
        aria-label={`Open ${label} app`}
      >
        {icon}
      </button>
      <span className="text-sm font-medium text-center text-foreground/80">{label}</span>
    </div>
  );
}
