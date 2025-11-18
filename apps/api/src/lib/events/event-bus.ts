import { EventEmitter } from 'events';
import type { AllDomainEvents, DomainEvent } from './types';
import { logger } from '../logger';
import { metrics } from '../metrics';

export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => Promise<void> | void;

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100); // Allow many listeners
  }

  /**
   * Publish an event to all registered handlers
   */
  async publish<T extends AllDomainEvents>(event: T): Promise<void> {
    const startTime = Date.now();

    try {
      logger.info(`Publishing event: ${event.type}`, {
        eventType: event.type,
        aggregateId: event.aggregateId,
      });

      // Emit the event
      this.emit(event.type, event);

      // Also emit a wildcard event for handlers that want all events
      this.emit('*', event);

      metrics.incrementCounter('events_published_total', {
        type: event.type,
      });

      const duration = Date.now() - startTime;
      metrics.recordHistogram('event_publish_duration_ms', duration, {
        type: event.type,
      });
    } catch (error) {
      logger.error(`Error publishing event: ${event.type}`, error as Error, {
        eventType: event.type,
        aggregateId: event.aggregateId,
      });

      metrics.incrementCounter('events_publish_errors_total', {
        type: event.type,
      });

      throw error;
    }
  }

  /**
   * Subscribe to a specific event type
   */
  subscribe<T extends AllDomainEvents>(
    eventType: T['type'] | '*',
    handler: EventHandler<T>
  ): void {
    logger.debug(`Subscribing to event: ${eventType}`);

    const wrappedHandler = async (event: T) => {
      const startTime = Date.now();

      try {
        await handler(event);

        const duration = Date.now() - startTime;
        metrics.recordHistogram('event_handler_duration_ms', duration, {
          type: event.type,
          handler: handler.name || 'anonymous',
        });

        metrics.incrementCounter('events_handled_total', {
          type: event.type,
          status: 'success',
        });
      } catch (error) {
        logger.error(`Error in event handler for ${event.type}`, error as Error, {
          eventType: event.type,
          handler: handler.name || 'anonymous',
        });

        metrics.incrementCounter('events_handled_total', {
          type: event.type,
          status: 'error',
        });

        // Don't throw - we don't want one handler failure to affect others
      }
    };

    this.on(eventType, wrappedHandler);
  }

  /**
   * Unsubscribe from an event
   */
  unsubscribe<T extends AllDomainEvents>(
    eventType: T['type'] | '*',
    handler: EventHandler<T>
  ): void {
    this.off(eventType, handler);
  }

  /**
   * Get count of listeners for an event type
   */
  getListenerCount(eventType: string): number {
    return this.listenerCount(eventType);
  }
}

// Singleton instance
export const eventBus = new EventBus();
