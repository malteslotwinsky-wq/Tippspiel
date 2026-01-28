import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  noPadding?: boolean;
}

export default function Card({
  children,
  className = '',
  title,
  subtitle,
  action,
  noPadding = false
}: CardProps) {
  return (
    <div className={`card ${className}`}>
      {(title || action) && (
        <div className="card-header flex items-center justify-between">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-slate-600 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && (
            <div className="flex-shrink-0">{action}</div>
          )}
        </div>
      )}
      <div className={noPadding ? '' : 'card-body'}>{children}</div>
    </div>
  );
}
