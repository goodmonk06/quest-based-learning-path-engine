import { logger } from '../logger';

export interface NotificationMessage {
  recipientId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channels?: ('email' | 'sms' | 'push')[];
}

export interface INotificationAdapter {
  send(message: NotificationMessage): Promise<void>;
  sendBatch(messages: NotificationMessage[]): Promise<void>;
}

/**
 * In-memory stub implementation for local development
 * Replace with real implementation in production
 */
export class InMemoryNotificationAdapter implements INotificationAdapter {
  private sentNotifications: NotificationMessage[] = [];

  async send(message: NotificationMessage): Promise<void> {
    logger.info('Sending notification (in-memory stub)', {
      recipientId: message.recipientId,
      title: message.title,
      channels: message.channels || ['email'],
    });

    this.sentNotifications.push({
      ...message,
      data: {
        ...message.data,
        sentAt: new Date().toISOString(),
      },
    });
  }

  async sendBatch(messages: NotificationMessage[]): Promise<void> {
    for (const message of messages) {
      await this.send(message);
    }
  }

  // Helper for testing/debugging
  getSentNotifications(): NotificationMessage[] {
    return [...this.sentNotifications];
  }

  clear(): void {
    this.sentNotifications = [];
  }
}

// Singleton instance
export const notificationAdapter: INotificationAdapter = new InMemoryNotificationAdapter();
