import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  badge?: {
    text: string;
    color: 'high' | 'medium' | 'low';
  };
}

export default function Card({ children, className = '', title, badge }: CardProps) {
  const badgeColors = {
    high: 'bg-priority-high',
    medium: 'bg-priority-medium',
    low: 'bg-priority-low',
  };

  return (
    <div className={`bg-white border-2 border-khaki rounded-lg shadow-md p-6 ${className}`}>
      {(title || badge) && (
        <div className="flex justify-between items-start mb-4">
          {title && <h3 className="text-xl font-bold text-textPrimary">{title}</h3>}
          {badge && (
            <span
              className={`${badgeColors[badge.color]} text-white px-3 py-1 rounded-full text-sm font-semibold`}
            >
              {badge.text}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
