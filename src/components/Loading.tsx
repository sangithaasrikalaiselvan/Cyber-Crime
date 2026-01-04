import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
}

export default function Loading({ message = 'Loading...' }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-12 w-12 text-khaki-dark animate-spin mb-4" />
      <p className="text-textSecondary text-lg">{message}</p>
    </div>
  );
}
