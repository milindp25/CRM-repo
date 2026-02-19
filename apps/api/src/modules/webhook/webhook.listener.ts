import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WebhookEvent } from '@hrplatform/shared';
import { LoggerService } from '../../common/services/logger.service';
import { WebhookService } from './webhook.service';

/**
 * Set of valid webhook event type values from the WebhookEvent enum.
 * Used to filter which internal events should trigger webhook deliveries.
 */
const WEBHOOK_EVENT_VALUES = new Set<string>(Object.values(WebhookEvent));

/**
 * Webhook Event Listener
 *
 * Uses the @OnEvent('**') wildcard pattern to listen to ALL events emitted
 * through EventEmitter2. For each event, it checks whether the event type
 * matches a subscribable WebhookEvent and, if so, dispatches webhook
 * deliveries for all matching company endpoints.
 *
 * The payload must include a `companyId` field so that the webhook system
 * knows which company's endpoints to look up.
 */
@Injectable()
export class WebhookListener {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly logger: LoggerService,
  ) {}

  @OnEvent('**')
  async handleAllEvents(payload: any, eventName?: string) {
    // EventEmitter2 wildcard listeners receive the event name as the
    // second argument when using `wildcard: true` (which NestJS enables
    // by default for EventEmitterModule). However, depending on the
    // emitter configuration, eventName may also be available via this context.
    // We derive the actual event name from the payload or the argument.
    const resolvedEventName =
      eventName || (payload as any)?._eventName || (payload as any)?.eventType;

    if (!resolvedEventName) {
      return;
    }

    // Only process events that match the WebhookEvent enum values
    if (!WEBHOOK_EVENT_VALUES.has(resolvedEventName)) {
      return;
    }

    // Must have companyId to route to the correct endpoints
    const companyId = payload?.companyId;
    if (!companyId) {
      this.logger.warn(
        `Webhook listener received event "${resolvedEventName}" without companyId, skipping`,
        'WebhookListener',
      );
      return;
    }

    this.logger.log(
      `Webhook listener processing event "${resolvedEventName}" for company ${companyId}`,
      'WebhookListener',
    );

    // Fire-and-forget: don't block the event bus
    try {
      await this.webhookService.deliverWebhook(
        companyId,
        resolvedEventName,
        payload,
      );
    } catch (error) {
      this.logger.error(
        `Webhook listener failed to deliver "${resolvedEventName}": ${(error as Error).message}`,
        (error as Error).stack,
        'WebhookListener',
      );
    }
  }
}
