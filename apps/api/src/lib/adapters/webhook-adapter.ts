import { logger } from '../logger';
import { metrics } from '../metrics';

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface WebhookDestination {
  url: string;
  secret?: string;
  events?: string[]; // If specified, only send these event types
}

export interface IWebhookAdapter {
  registerWebhook(destination: WebhookDestination): void;
  sendWebhook(payload: WebhookPayload): Promise<void>;
  listWebhooks(): WebhookDestination[];
}

/**
 * In-memory stub implementation for local development
 * In production, this would make HTTP calls to registered webhooks
 */
export class InMemoryWebhookAdapter implements IWebhookAdapter {
  private webhooks: WebhookDestination[] = [];
  private sentPayloads: Array<{ destination: string; payload: WebhookPayload }> = [];

  registerWebhook(destination: WebhookDestination): void {
    logger.info('Registering webhook (in-memory stub)', {
      url: destination.url,
      events: destination.events || ['*'],
    });

    this.webhooks.push(destination);
  }

  async sendWebhook(payload: WebhookPayload): Promise<void> {
    for (const webhook of this.webhooks) {
      // Check if this webhook wants this event type
      if (webhook.events && !webhook.events.includes(payload.event)) {
        continue;
      }

      logger.info('Sending webhook (in-memory stub)', {
        url: webhook.url,
        event: payload.event,
      });

      // In production, make HTTP POST request here
      // await fetch(webhook.url, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     ...(webhook.secret && { 'X-Webhook-Secret': webhook.secret }),
      //   },
      //   body: JSON.stringify(payload),
      // });

      this.sentPayloads.push({
        destination: webhook.url,
        payload,
      });

      metrics.incrementCounter('webhooks_sent_total', {
        event: payload.event,
        destination: webhook.url,
      });
    }
  }

  listWebhooks(): WebhookDestination[] {
    return [...this.webhooks];
  }

  // Helper methods for testing/debugging
  getSentPayloads(): Array<{ destination: string; payload: WebhookPayload }> {
    return [...this.sentPayloads];
  }

  clear(): void {
    this.webhooks = [];
    this.sentPayloads = [];
  }
}

// Singleton instance
export const webhookAdapter: IWebhookAdapter = new InMemoryWebhookAdapter();
