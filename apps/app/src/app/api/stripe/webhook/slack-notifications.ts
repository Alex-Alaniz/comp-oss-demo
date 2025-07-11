import { stripe } from '@/actions/organization/lib/stripe';
import { db } from '@comp/db';
import Stripe from 'stripe';
import { STRIPE_SUB_CACHE } from '../stripeDataToKv.type';

interface SlackBlock {
  type: string;
  text?: any;
  fields?: any[];
}

interface NotificationConfig {
  title: string;
  color: string;
  fields: Array<{ label: string; value: string }>;
  extraText?: string;
}

/**
 * Send notification to Slack sales channel
 */
export async function sendSlackNotification(blocks: SlackBlock[], color?: string) {
  const webhookUrl = process.env.SLACK_SALES_WEBHOOK;

  if (!webhookUrl) {
    console.log('[SLACK] Sales notifications webhook not configured');
    return;
  }

  try {
    const payload = color
      ? {
          attachments: [
            {
              color,
              blocks,
            },
          ],
        }
      : { blocks };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('[SLACK] Failed to send notification:', response.statusText);
    }
  } catch (error) {
    console.error('[SLACK] Error sending notification:', error);
  }
}

/**
 * Format currency amount for display
 */
function formatCurrency(amount: number | null | undefined, currency: string = 'usd'): string {
  if (!amount) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

/**
 * Get organization and customer details for Slack notifications
 */
async function getCustomerDetails(customerId: string) {
  try {
    const organization = await db.organization.findFirst({
      where: { stripeCustomerId: customerId },
      include: {
        members: {
          include: { user: true },
          where: { role: 'OWNER' },
          take: 1,
        },
      },
    });

    const customer = await stripe.customers.retrieve(customerId);

    if (typeof customer === 'string' || customer.deleted) {
      return null;
    }

    return {
      organization,
      customer,
      ownerEmail: organization?.members[0]?.user?.email || customer.email || 'Unknown',
      organizationName: organization?.name || customer.name || 'Unknown Organization',
    };
  } catch (error) {
    console.error('[STRIPE] Error getting customer details:', error);
    return null;
  }
}

/**
 * Build Slack notification blocks - compact version
 */
function buildNotificationBlocks(config: NotificationConfig): SlackBlock[] {
  // Combine all info into a single compact section
  const blocks: SlackBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${config.title}\n${config.fields.map((f) => `*${f.label}:* ${f.value}`).join(' • ')}${config.extraText ? `\n${config.extraText}` : ''}`,
      },
    },
  ];

  return blocks;
}

/**
 * Handle Stripe events and send Slack notifications
 */
export async function handleStripeEventNotification(
  event: Stripe.Event,
  subscriptionData: STRIPE_SUB_CACHE,
  customerId: string,
) {
  const customerDetails = await getCustomerDetails(customerId);
  if (!customerDetails) return;

  // Create clickable email with Stripe dashboard link
  const stripeCustomerUrl = `https://dashboard.stripe.com/customers/${customerId}`;
  const clickableEmail = `<${stripeCustomerUrl}|${customerDetails.ownerEmail}>`;

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode === 'subscription') {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const isTrialing = subscription.status === 'trialing';

        // Get amount and interval
        // For trials, get the price from the subscription, not the session (which would be $0)
        const price = subscription.items.data[0]?.price;
        const amount = isTrialing
          ? formatCurrency(price?.unit_amount, price?.currency || 'usd')
          : formatCurrency(session.amount_total, session.currency || 'usd');

        const interval = price?.recurring?.interval === 'year' ? 'Yearly' : 'Monthly';

        const config: NotificationConfig = isTrialing
          ? {
              title: `🎉 New Trial Started`,
              color: '#0084FF',
              fields: [
                { label: customerDetails.organizationName, value: clickableEmail },
                { label: amount, value: interval },
                { label: 'Subscription ID', value: subscription.id },
              ],
            }
          : {
              title: `💰 New Subscription`,
              color: '#36C537',
              fields: [
                { label: customerDetails.organizationName, value: clickableEmail },
                { label: amount, value: interval },
                { label: 'Subscription ID', value: subscription.id },
              ],
            };

        await sendSlackNotification(buildNotificationBlocks(config), config.color);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const previousAttributes = event.data.previous_attributes as any;

      // Trial conversion
      if (previousAttributes?.status === 'trialing' && subscription.status === 'active') {
        const price = subscription.items.data[0]?.price;
        const amount = formatCurrency(price?.unit_amount, price?.currency || 'usd');
        const billingInterval = price?.recurring?.interval === 'year' ? 'Yearly' : 'Monthly';

        const config: NotificationConfig = {
          title: '🚀 Trial Converted to Paid',
          color: '#9F40E6',
          fields: [
            { label: customerDetails.organizationName, value: clickableEmail },
            { label: amount, value: billingInterval },
            { label: 'Subscription ID', value: subscription.id },
          ],
        };

        await sendSlackNotification(buildNotificationBlocks(config), config.color);
      }

      // Cancellation
      if (!previousAttributes?.cancel_at_period_end && subscription.cancel_at_period_end) {
        const cancelDate = new Date(
          (subscription as any).current_period_end * 1000,
        ).toLocaleDateString();

        // Get amount and interval
        const price = subscription.items.data[0]?.price;
        const amount = formatCurrency(price?.unit_amount, price?.currency || 'usd');
        const interval = price?.recurring?.interval === 'year' ? 'Yearly' : 'Monthly';

        const config: NotificationConfig = {
          title:
            subscription.status === 'trialing' ? '❌ Trial Cancelled' : '❌ Subscription Cancelled',
          color: '#DC3545',
          fields: [
            { label: customerDetails.organizationName, value: clickableEmail },
            { label: `${amount} ${interval}`, value: `Ends ${cancelDate}` },
            { label: 'Subscription ID', value: subscription.id },
          ],
        };

        await sendSlackNotification(buildNotificationBlocks(config), config.color);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const reason = subscription.cancellation_details?.reason || 'Cancelled';

      const config: NotificationConfig = {
        title: '🚫 Subscription Ended',
        color: '#8B0000',
        fields: [
          { label: customerDetails.organizationName, value: clickableEmail },
          { label: 'Reason', value: reason },
          { label: 'Subscription ID', value: subscription.id },
        ],
      };

      await sendSlackNotification(buildNotificationBlocks(config), config.color);
      break;
    }
  }
}
