import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  minHeight?: string;
}

export default function LoadingState({
  message = 'Loading records...',
  minHeight = 'min-h-[220px]',
}: LoadingStateProps) {
  return (
    <div className={`w-full flex flex-col items-center justify-center ${minHeight} p-8 text-center`}>
      <Loader2 className="w-6 h-6 text-brand-tealLight animate-spin" />
      <p className="mt-3 text-xs text-gray-400 font-medium tracking-wide">{message}</p>
    </div>
  );
}
