'use client';

import { Badge } from '@comp/ui/badge';
import { Button } from '@comp/ui/button';
import { Card } from '@comp/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@comp/ui/dialog';
import confetti from 'canvas-confetti';
import {
  BookOpen,
  CheckCircle2,
  Code2,
  Headphones,
  LucideIcon,
  MessageSquare,
  Rocket,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useEffect, useState } from 'react';

type PlanType = 'starter' | 'done-for-you';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface PlanContent {
  title: string;
  description: string;
  badge: string;
  badgeDescription: string;
  badgeClass: string;
  cardClass: string;
  iconClass: string;
  iconColor: string;
  features: Feature[];
  buttonText: string;
  footerText: string;
}

export function CheckoutCompleteDialog() {
  const [checkoutComplete, setCheckoutComplete] = useQueryState('checkoutComplete', {
    defaultValue: '',
    clearOnDefault: true,
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (checkoutComplete === 'starter' || checkoutComplete === 'done-for-you') {
      const planType = checkoutComplete as PlanType;

      // Show the dialog
      setOpen(true);

      // Trigger confetti animation
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // Use different colors based on plan type
        const colors =
          planType === 'done-for-you'
            ? ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'] // Green for paid
            : ['#3b82f6', '#60a5fa', '#93bbfc', '#bfdbfe', '#dbeafe']; // Blue for starter

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors,
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors,
        });
      }, 250);

      // Clear the query parameter immediately so it doesn't linger in the URL
      setCheckoutComplete('');
    }
  }, [checkoutComplete, setCheckoutComplete]);

  const handleClose = () => {
    setOpen(false);
  };

  // Different content based on plan type
  const content: Record<PlanType, PlanContent> = {
    'done-for-you': {
      title: 'Welcome to Done For You!',
      description: 'Your subscription is active and your compliance journey begins now.',
      badge: '14 Day Money Back Guarantee',
      badgeDescription: "If you're not completely satisfied, we'll refund you in full",
      badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      cardClass: 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50',
      iconClass: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
      features: [
        {
          icon: Shield,
          title: 'SOC 2 or ISO 27001 Done For You',
          description: 'Complete compliance in 14 days or less',
        },
        {
          icon: Users,
          title: 'Dedicated Success Team',
          description: 'Your compliance experts are ready to help',
        },
        {
          icon: Sparkles,
          title: '3rd Party Audit Included',
          description: 'No hidden fees or surprise costs',
        },
        {
          icon: Headphones,
          title: '24x7x365 Support',
          description: "We're here whenever you need us",
        },
      ],
      buttonText: 'Get Started',
      footerText: 'Your success team will reach out within 24 hours',
    },
    starter: {
      title: 'Welcome to Comp AI!',
      description: "You're all set up with the Starter plan. Let's get you compliant!",
      badge: 'DIY Compliance',
      badgeDescription: 'Everything you need to achieve compliance on your own',
      badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      cardClass: 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50',
      iconClass: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      features: [
        {
          icon: Rocket,
          title: 'Access to all frameworks',
          description: 'SOC 2, ISO 27001, HIPAA, and more',
        },
        {
          icon: Code2,
          title: 'API access',
          description: 'Integrate compliance into your workflow',
        },
        {
          icon: BookOpen,
          title: 'Trust & Security Portal',
          description: 'Share your compliance status with customers',
        },
        {
          icon: MessageSquare,
          title: 'Community Support',
          description: 'Get help from the Comp AI community',
        },
      ],
      buttonText: 'Explore Frameworks',
      footerText: 'Upgrade anytime for Done-for-You compliance',
    },
  };

  // Get current content, default to done-for-you if the value is not a valid plan type
  const validPlanType =
    checkoutComplete === 'starter' || checkoutComplete === 'done-for-you'
      ? checkoutComplete
      : 'done-for-you';
  const currentContent = content[validPlanType];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center pb-2">
          <div
            className={`mx-auto mb-4 h-12 w-12 rounded-full ${currentContent.iconClass} flex items-center justify-center`}
          >
            <CheckCircle2 className={`h-6 w-6 ${currentContent.iconColor}`} />
          </div>
          <DialogTitle className="text-2xl font-semibold text-center">
            {currentContent.title}
          </DialogTitle>
          <DialogDescription className="text-center mt-2">
            {currentContent.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Card className={currentContent.cardClass}>
            <div className="p-4 text-center">
              <Badge className={`${currentContent.badgeClass} mb-2`}>{currentContent.badge}</Badge>
              <p className="text-sm text-muted-foreground mt-1">
                {currentContent.badgeDescription}
              </p>
            </div>
          </Card>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">What's included:</h3>
            <div className="grid gap-3">
              {currentContent.features.map((feature: Feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{feature.title}</p>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleClose} className="w-full" size="default">
            {currentContent.buttonText}
          </Button>
          <p className="text-xs text-center text-muted-foreground">{currentContent.footerText}</p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
