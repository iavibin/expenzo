import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
  minHeight?: string;
}

export default function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  actionText,
  onAction,
  minHeight = 'min-h-[220px]',
}: EmptyStateProps) {
  return (
    <div
      className={`w-full flex flex-col items-center justify-center ${minHeight} p-8 text-center rounded-xl border border-foundation-border bg-foundation-surface/60`}
    >
      <div className="w-11 h-11 rounded-lg bg-foundation-surfaceElevated border border-foundation-borderSubtle flex items-center justify-center text-gray-400 mb-3">
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <h4 className="text-sm font-semibold text-gray-200">{title}</h4>
      <p className="text-xs text-gray-400 mt-1 max-w-sm leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-3.5 py-2 rounded-lg bg-brand-teal hover:bg-brand-tealLight text-white text-xs font-medium transition-colors cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
