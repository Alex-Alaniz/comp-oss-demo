'use client';

import { generateCheckoutSessionAction } from '@/app/api/stripe/generate-checkout-session/generate-checkout-session';
import { SelectionIndicator } from '@/components/layout/SelectionIndicator';
import { ReviewSection } from '@/components/ReviewSection';
import { Badge } from '@comp/ui/badge';
import { Button } from '@comp/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@comp/ui/card';
import { ArrowRight, CheckIcon, Loader2 } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { BookingDialog } from './components/BookingDialog';

interface PricingCardsProps {
  organizationId: string;
  priceDetails: {
    managedMonthlyPrice: {
      id: string;
      unitAmount: number | null;
      currency: string;
      interval: string | null;
      productName: string | null;
    } | null;
    managedYearlyPrice: {
      id: string;
      unitAmount: number | null;
      currency: string;
      interval: string | null;
      productName: string | null;
    } | null;
    starterMonthlyPrice: {
      id: string;
      unitAmount: number | null;
      currency: string;
      interval: string | null;
      productName: string | null;
    } | null;
    starterYearlyPrice: {
      id: string;
      unitAmount: number | null;
      currency: string;
      interval: string | null;
      productName: string | null;
    } | null;
  };
}

interface PricingCardProps {
  planType: 'starter' | 'managed';
  isSelected: boolean;
  onClick: () => void;
  title: string;
  description: string;
  price: number;
  priceLabel: string;
  subtitle?: string;
  features: string[];
  badge?: string;
  footerText: string;
  yearlyPrice?: number;
  isYearly?: boolean;
}

const PricingCard = ({
  planType,
  isSelected,
  onClick,
  title,
  description,
  price,
  priceLabel,
  subtitle,
  features,
  badge,
  footerText,
  yearlyPrice,
  isYearly,
}: PricingCardProps) => {
  return (
    <Card
      className={`relative cursor-pointer transition-all h-full flex flex-col ${
        isSelected
          ? 'ring-2 ring-green-500 shadow-lg bg-green-50/50 dark:bg-primary/15 backdrop-blur-lg'
          : 'hover:shadow-md bg-card'
      } border border-border`}
      onClick={onClick}
    >
      <CardHeader className="p-6 pb-4">
        <div className="flex items-start gap-3">
          <SelectionIndicator isSelected={isSelected} variant="radio" />
          <div className="flex-1 -mt-0.5">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              {badge && (
                <Badge
                  className={
                    badge === '14-day trial'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 text-xs px-1.5 py-0'
                      : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs px-1.5 py-0'
                  }
                >
                  {badge}
                </Badge>
              )}
            </div>
            <CardDescription className="text-sm mt-0.5">{description}</CardDescription>
          </div>
        </div>
        <div className="mt-4">
          {isYearly && yearlyPrice ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">${price.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">/{priceLabel}</span>
              </div>
              {subtitle && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">{subtitle}</p>
              )}
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">${price.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">/{priceLabel}</span>
              </div>
              {subtitle && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">{subtitle}</p>
              )}
            </>
          )}
        </div>
      </CardHeader>

      <div className={`border-t ${isSelected ? 'border-green-500/30' : 'border-border'} mx-6`} />

      <CardContent className="px-6 flex flex-col h-full">
        <ul className="space-y-2 flex-1 py-3">
          {features.map((feature, idx) => {
            const isEverythingIn = idx === 0 && feature.includes('Everything in');
            const isAuditNote = feature.includes('Pay for your audit');

            return (
              <li
                key={feature}
                className={
                  isEverythingIn
                    ? 'pb-1'
                    : isAuditNote
                      ? 'mt-2 pt-2 border-t border-border'
                      : 'flex items-start gap-2'
                }
              >
                {!isEverythingIn && !isAuditNote && (
                  <CheckIcon className="h-3.5 w-3.5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                )}
                <span
                  className={`text-sm leading-relaxed ${
                    isEverythingIn
                      ? 'font-semibold text-muted-foreground block'
                      : isAuditNote
                        ? 'text-muted-foreground italic'
                        : ''
                  }`}
                >
                  {feature}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className={`border-t ${
            isSelected ? 'border-green-500/30' : 'border-border'
          } mt-auto pt-4`}
        >
          <p className="text-xs text-center text-muted-foreground">{footerText}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const starterFeatures = [
  '14-day free trial',
  'Access to all frameworks',
  'Trust & Security Portal',
  'AI Vendor Management',
  'AI Risk Management',
  'Unlimited team members',
  'API access',
  'Community Support',
];

const managedFeatures = [
  'Everything in Starter plus:',
  'SOC 2 or ISO 27001 Done For You',
  '3rd Party Audit Included',
  'Compliant in 14 Days or Less',
  '14 Day Money Back Guarantee',
  'Dedicated Success Team',
  '24x7x365 Support & SLA',
  'Slack Channel with Comp AI',
  '12-month minimum term',
];

export function PricingCards({ organizationId, priceDetails }: PricingCardsProps) {
  const router = useRouter();
  const [isYearly, setIsYearly] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'managed'>('managed');

  const { execute, isExecuting } = useAction(generateCheckoutSessionAction, {
    onSuccess: ({ data }) => {
      if (data?.checkoutUrl) {
        router.push(data.checkoutUrl);
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Failed to create checkout session');
    },
  });

  const baseUrl =
    typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}`
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const handleSubscribe = () => {
    let priceId: string | undefined;
    let planType: string;
    let trialPeriodDays: number | undefined;

    if (selectedPlan === 'starter') {
      // Use starter prices with 14-day trial
      priceId = isYearly
        ? priceDetails.starterYearlyPrice?.id
        : priceDetails.starterMonthlyPrice?.id;
      planType = 'starter';
      trialPeriodDays = 14;
    } else {
      // Use managed (Done For You) prices
      priceId = isYearly
        ? priceDetails.managedYearlyPrice?.id
        : priceDetails.managedMonthlyPrice?.id;
      planType = 'done-for-you';
      trialPeriodDays = undefined;
    }

    if (!priceId) {
      toast.error('Price information not available');
      return;
    }

    execute({
      organizationId,
      mode: 'subscription',
      priceId,
      successUrl: `${baseUrl}/api/stripe/success?organizationId=${organizationId}&planType=${planType}`,
      cancelUrl: `${baseUrl}/upgrade/${organizationId}`,
      allowPromotionCodes: true,
      trialPeriodDays,
      metadata: {
        organizationId,
        plan: selectedPlan,
        billingPeriod: isYearly ? 'yearly' : 'monthly',
      },
    });
  };

  // Calculate prices from Stripe data
  const starterMonthlyPrice = priceDetails.starterMonthlyPrice?.unitAmount
    ? Math.round(priceDetails.starterMonthlyPrice.unitAmount / 100)
    : 99; // fallback to $99

  const starterYearlyPriceTotal = priceDetails.starterYearlyPrice?.unitAmount
    ? Math.round(priceDetails.starterYearlyPrice.unitAmount / 100)
    : 948; // fallback with 20% discount (99 * 12 * 0.8)

  const managedMonthlyPrice = priceDetails.managedMonthlyPrice?.unitAmount
    ? Math.round(priceDetails.managedMonthlyPrice.unitAmount / 100)
    : 997; // fallback to $997

  const managedYearlyPriceTotal = priceDetails.managedYearlyPrice?.unitAmount
    ? Math.round(priceDetails.managedYearlyPrice.unitAmount / 100)
    : 9564; // fallback with 20% discount (997 * 12 * 0.8)

  // Calculate monthly equivalent for yearly pricing display
  const starterYearlyPriceMonthly = Math.round(starterYearlyPriceTotal / 12);
  const managedYearlyPriceMonthly = Math.round(managedYearlyPriceTotal / 12);

  const currentPrice =
    selectedPlan === 'starter'
      ? isYearly
        ? starterYearlyPriceMonthly
        : starterMonthlyPrice
      : isYearly
        ? managedYearlyPriceMonthly
        : managedMonthlyPrice;

  const currentYearlyTotal =
    selectedPlan === 'starter' ? starterYearlyPriceTotal : managedYearlyPriceTotal;
  const currentMonthlyPrice =
    selectedPlan === 'starter' ? starterMonthlyPrice : managedMonthlyPrice;
  const yearlySavings = currentMonthlyPrice * 12 - currentYearlyTotal;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Pricing Toggle */}
      <div className="flex flex-col items-center gap-2">
        <div className="bg-muted/50 p-1 rounded-lg flex items-center justify-center gap-1">
          <button
            onClick={() => setIsYearly(false)}
            className={`px-4 py-2 text-sm rounded-md transition-all ${
              !isYearly
                ? 'bg-background font-medium shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`px-4 py-2 text-sm rounded-md transition-all flex items-center gap-2 ${
              isYearly
                ? 'bg-background font-medium shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Yearly
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs px-1.5 py-0">
              Save 20%
            </Badge>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Plan Selection */}
        <div className="lg:col-span-2 grid md:grid-cols-2 gap-3">
          <PricingCard
            planType="starter"
            isSelected={selectedPlan === 'starter'}
            onClick={() => setSelectedPlan('starter')}
            title="Starter"
            description="Everything you need to get compliant, fast."
            price={isYearly ? starterYearlyPriceMonthly : starterMonthlyPrice}
            priceLabel="month"
            subtitle="DIY (Do It Yourself) Compliance"
            features={starterFeatures}
            footerText="DIY Compliance Solution"
            yearlyPrice={isYearly ? starterYearlyPriceTotal : undefined}
            isYearly={isYearly}
            badge="14-day trial"
          />

          <PricingCard
            planType="managed"
            isSelected={selectedPlan === 'managed'}
            onClick={() => setSelectedPlan('managed')}
            title="Done For You"
            description="For companies up to 25 people."
            price={isYearly ? managedYearlyPriceMonthly : managedMonthlyPrice}
            priceLabel="month"
            subtitle="White-glove compliance service"
            features={managedFeatures}
            badge="Popular"
            footerText="Done-for-you compliance"
            yearlyPrice={isYearly ? managedYearlyPriceTotal : undefined}
            isYearly={isYearly}
          />
        </div>

        {/* Right Column - Checkout */}
        <div className="space-y-3">
          {/* Checkout Summary */}
          <Card className="bg-card border border-border">
            <CardHeader className="pb-3 pt-4 bg-muted/50 dark:bg-muted/40 backdrop-blur-sm rounded-t-lg border-b border-muted/50">
              <CardTitle className="text-lg font-semibold text-center">Checkout</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {selectedPlan === 'starter' ? 'Starter' : 'Done For You'} Plan
                  </span>
                  <span className="text-sm font-semibold">
                    ${currentPrice.toLocaleString()}/month
                  </span>
                </div>
                {isYearly && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Billing frequency</span>
                      <span className="text-sm text-muted-foreground">Yearly</span>
                    </div>
                    <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                      <span className="text-sm font-medium text-muted-foreground">Discount</span>
                      <span className="text-sm font-medium">
                        ${yearlySavings.toLocaleString()} (20%)
                      </span>
                    </div>
                  </>
                )}
                {selectedPlan === 'starter' && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Trial period</span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      14 days free
                    </span>
                  </div>
                )}
                <div className="border-t-2 pt-4 mt-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-base font-semibold">Due today</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold">
                        $
                        {selectedPlan === 'starter'
                          ? 0
                          : isYearly
                            ? currentYearlyTotal.toLocaleString()
                            : currentPrice.toLocaleString()}
                      </span>
                      {selectedPlan === 'starter' ? (
                        <span className="text-sm text-muted-foreground block">
                          then $
                          {isYearly
                            ? currentYearlyTotal.toLocaleString()
                            : currentPrice.toLocaleString()}
                          /{isYearly ? 'year' : 'month'} after trial
                        </span>
                      ) : (
                        <>
                          {!isYearly && (
                            <span className="text-sm text-muted-foreground block">
                              then ${currentPrice.toLocaleString()}/month
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="px-6 pb-6">
              <Button
                onClick={handleSubscribe}
                disabled={isExecuting}
                size="default"
                className="w-full"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : selectedPlan === 'starter' ? (
                  'Start 14-Day Free Trial'
                ) : isYearly ? (
                  'Go to Checkout'
                ) : (
                  'Go to Checkout'
                )}
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardFooter>

            {/* Review Section Footer */}
            <div className="px-6 py-4 bg-muted/50 dark:bg-muted/40 backdrop-blur-sm rounded-b-lg border-t border-muted/50">
              <ReviewSection rating={4.7} reviewCount={100} />
            </div>
          </Card>

          {/* Help Section */}
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground text-center mb-3">
                Have questions? We're here to help
              </p>
              <BookingDialog />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
