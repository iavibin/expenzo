import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  minHeight?: string;
}

export default function LoadingState({
  message = 'Loading data from server...',
  minHeight = 'min-h-[250px]',
}: LoadingStateProps) {
  return (
    <div className={`w-full flex flex-col items-center justify-center ${minHeight} p-8 text-center`}>
      <div className="relative flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
        <Loader2 className="w-5 h-5 text-blue-400 absolute animate-pulse" />
      </div>
      <p className="mt-3 text-sm text-gray-400 font-medium">{message}</p>
    </div>
  );
}
