'use client';

import { AiWorkPreviewAuthentic } from '@/components/ai-work-preview-authentic';
import { Button } from '@comp/ui/button';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface SetupLoadingStepProps {
  organizationId: string;
}

export function SetupLoadingStep({ organizationId }: SetupLoadingStepProps) {
  const router = useRouter();
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    // Enable continue after a longer time (8 seconds) to emphasize this takes time
    const minTimeTimer = setTimeout(() => {
      setCanContinue(true);
    }, 8000);

    return () => clearTimeout(minTimeTimer);
  }, []);

  const handleContinue = () => {
    router.push(`/upgrade/${organizationId}`);
  };

  return (
    <div className="relative min-h-[calc(100vh-42px)]">
      {/* Main content */}
      <div className="flex min-h-[calc(100vh-42px-72px)] items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="relative">
            <div className="relative bg-card/80 dark:bg-card/70 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-8 shadow-2xl">
              {/* Inner glow for depth */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              <div className="relative">
                <AiWorkPreviewAuthentic />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium footer */}
      <div className="sticky bottom-0 left-0 right-0 bg-card/60 dark:bg-card/50 backdrop-blur-md border-t border-white/10 dark:border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {canContinue
                  ? 'AI is working in the background (this will take 15-30 minutes)'
                  : 'AI workspace setup in progress...'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {canContinue
                  ? "You can safely continue - we'll notify you when everything is ready"
                  : 'Analyzing your infrastructure and compliance requirements'}
              </p>
            </div>
            <Button
              onClick={handleContinue}
              disabled={!canContinue}
              size="default"
              variant={canContinue ? 'default' : 'outline'}
              className={
                canContinue
                  ? 'min-w-[160px] shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all'
                  : 'min-w-[160px]'
              }
            >
              {canContinue ? (
                <>
                  Continue to Plans
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>Please wait...</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
