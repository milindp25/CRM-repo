import { Injectable, NotFoundException, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as crypto from 'crypto';
import { LoggerService } from '../../common/services/logger.service';
import { WebhookRepository } from './webhook.repository';
import { CreateWebhookDto, UpdateWebhookDto } from './dto';

/** Exponential backoff delays in seconds for each retry attempt */
const RETRY_DELAYS_SECONDS = [60, 300, 1800]; // 1min, 5min, 30min

/** Retry polling interval in milliseconds (1 minute) */
const RETRY_POLL_INTERVAL_MS = 60_000;

@Injectable()
export class WebhookService implements OnModuleInit, OnModuleDestroy {
  private retryInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly repository: WebhookRepository,
    private readonly logger: LoggerService,
  ) {}

  onModuleInit() {
    // Start polling for pending retries every minute
    this.retryInterval = setInterval(() => {
      this.processRetries().catch((err) => {
        this.logger.error(
          `Retry processing failed: ${(err as Error).message}`,
          (err as Error).stack,
          'WebhookService',
        );
      });
    }, RETRY_POLL_INTERVAL_MS);

    this.logger.log(
      'Webhook retry processor started (polling every 60s)',
      'WebhookService',
    );
  }

  onModuleDestroy() {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
      this.logger.log('Webhook retry processor stopped', 'WebhookService');
    }
  }

  // ============================================================================
  // Endpoint CRUD
  // ============================================================================

  /**
   * Create a new webhook endpoint with an auto-generated HMAC signing secret.
   */
  async createEndpoint(companyId: string, dto: CreateWebhookDto) {
    this.logger.log(
      `Creating webhook endpoint "${dto.name}" for company ${companyId}`,
      'WebhookService',
    );

    const secret = crypto.randomBytes(32).toString('hex');

    const endpoint = await this.repository.createEndpoint({
      name: dto.name,
      url: dto.url,
      secret,
      events: dto.events,
      headers: dto.headers ?? {},
      maxRetries: dto.maxRetries ?? 3,
      company: { connect: { id: companyId } },
    });

    this.logger.log(
      `Webhook endpoint "${dto.name}" created (id: ${endpoint.id})`,
      'WebhookService',
    );

    // Return with full secret only on creation
    return this.formatEndpoint(endpoint, true);
  }

  /**
   * List all webhook endpoints for a company. Secrets are masked.
   */
  async listEndpoints(companyId: string) {
    this.logger.log('Listing webhook endpoints', 'WebhookService');
    const endpoints = await this.repository.findAllEndpoints(companyId);
    return endpoints.map((ep: any) => this.formatEndpoint(ep, false));
  }

  /**
   * Get a single webhook endpoint. Secret is masked.
   */
  async getEndpoint(id: string, companyId: string) {
    this.logger.log(`Getting webhook endpoint ${id}`, 'WebhookService');

    const endpoint = await this.repository.findEndpointById(id, companyId);
    if (!endpoint) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    return this.formatEndpoint(endpoint, false);
  }

  /**
   * Update a webhook endpoint. Cannot change the HMAC secret via this method.
   */
  async updateEndpoint(id: string, companyId: string, dto: UpdateWebhookDto) {
    this.logger.log(`Updating webhook endpoint ${id}`, 'WebhookService');

    const existing = await this.repository.findEndpointById(id, companyId);
    if (!existing) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    const updateData: Record<string, any> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.url !== undefined) updateData.url = dto.url;
    if (dto.events !== undefined) updateData.events = dto.events;
    if (dto.headers !== undefined) updateData.headers = dto.headers;
    if (dto.maxRetries !== undefined) updateData.maxRetries = dto.maxRetries;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    const updated = await this.repository.updateEndpoint(id, companyId, updateData);

    return this.formatEndpoint(updated, false);
  }

  /**
   * Delete a webhook endpoint and all its delivery records.
   */
  async deleteEndpoint(id: string, companyId: string) {
    this.logger.log(`Deleting webhook endpoint ${id}`, 'WebhookService');

    const existing = await this.repository.findEndpointById(id, companyId);
    if (!existing) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    await this.repository.deleteEndpoint(id, companyId);
  }

  /**
   * Regenerate the HMAC signing secret for a webhook endpoint.
   */
  async regenerateSecret(id: string, companyId: string) {
    this.logger.log(`Regenerating secret for webhook endpoint ${id}`, 'WebhookService');

    const existing = await this.repository.findEndpointById(id, companyId);
    if (!existing) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    const newSecret = crypto.randomBytes(32).toString('hex');

    const updated = await this.repository.updateEndpoint(id, companyId, {
      secret: newSecret,
    });

    // Return with full secret so the user can copy it
    return this.formatEndpoint(updated, true);
  }

  // ============================================================================
  // Webhook Delivery
  // ============================================================================

  /**
   * Deliver a webhook to all matching active endpoints for a company.
   * This method is called from the event listener.
   */
  async deliverWebhook(
    companyId: string,
    eventType: string,
    payload: Record<string, any>,
  ) {
    this.logger.log(
      `Delivering webhook event "${eventType}" for company ${companyId}`,
      'WebhookService',
    );

    const endpoints = await this.repository.findActiveEndpointsByEvent(
      companyId,
      eventType,
    );

    if (endpoints.length === 0) {
      this.logger.log(
        `No active endpoints subscribed to "${eventType}" for company ${companyId}`,
        'WebhookService',
      );
      return;
    }

    this.logger.log(
      `Found ${endpoints.length} endpoint(s) for "${eventType}"`,
      'WebhookService',
    );

    // Create delivery records and fire-and-forget the HTTP requests
    for (const endpoint of endpoints) {
      try {
        const delivery = await this.repository.createDelivery({
          eventType,
          payload,
          status: 'PENDING',
          attempt: 1,
          maxRetries: endpoint.maxRetries,
          endpoint: { connect: { id: endpoint.id } },
        });

        // Fire-and-forget: don't block the event handler
        this.processDelivery(delivery.id).catch((err) => {
          this.logger.error(
            `Failed to process delivery ${delivery.id}: ${(err as Error).message}`,
            (err as Error).stack,
            'WebhookService',
          );
        });
      } catch (error) {
        this.logger.error(
          `Failed to create delivery for endpoint ${endpoint.id}: ${(error as Error).message}`,
          (error as Error).stack,
          'WebhookService',
        );
      }
    }
  }

  /**
   * Process a single webhook delivery: sign the payload, send the HTTP request,
   * and track the result.
   */
  async processDelivery(deliveryId: string) {
    const delivery = await this.repository.findDeliveryById(deliveryId);
    if (!delivery || !delivery.endpoint) {
      this.logger.error(
        `Delivery ${deliveryId} not found or endpoint missing`,
        undefined,
        'WebhookService',
      );
      return;
    }

    const endpoint = delivery.endpoint;
    const payloadString = JSON.stringify(delivery.payload);

    // Sign payload with HMAC-SHA256
    const signature = crypto
      .createHmac('sha256', endpoint.secret)
      .update(payloadString)
      .digest('hex');

    // Build request headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': `sha256=${signature}`,
      'X-Webhook-Event': delivery.eventType,
      'X-Webhook-Delivery-Id': delivery.id,
      // Merge custom headers from endpoint configuration
      ...(typeof endpoint.headers === 'object' && endpoint.headers !== null
        ? (endpoint.headers as Record<string, string>)
        : {}),
    };

    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const duration = Date.now() - startTime;
      const responseText = await response.text().catch(() => '');

      if (response.ok) {
        // Success
        await this.repository.updateDelivery(delivery.id, {
          status: 'SUCCESS',
          statusCode: response.status,
          response: responseText.substring(0, 2000), // Truncate response
          duration,
          deliveredAt: new Date(),
        });

        this.logger.log(
          `Webhook delivered successfully (id: ${delivery.id}, status: ${response.status}, duration: ${duration}ms)`,
          'WebhookService',
        );
      } else {
        // HTTP error - schedule retry if applicable
        await this.handleDeliveryFailure(
          delivery,
          response.status,
          responseText.substring(0, 2000),
          duration,
        );
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = (error as Error).message || 'Unknown error';

      // Network/timeout error - schedule retry if applicable
      await this.handleDeliveryFailure(
        delivery,
        null,
        errorMessage.substring(0, 2000),
        duration,
      );
    }
  }

  /**
   * Handle a failed delivery attempt by scheduling a retry or marking as failed.
   */
  private async handleDeliveryFailure(
    delivery: any,
    statusCode: number | null,
    responseText: string,
    duration: number,
  ) {
    const currentAttempt = delivery.attempt;
    const maxRetries = delivery.maxRetries;

    if (currentAttempt < maxRetries) {
      // Schedule retry with exponential backoff
      const delayIndex = Math.min(currentAttempt - 1, RETRY_DELAYS_SECONDS.length - 1);
      const delaySeconds = RETRY_DELAYS_SECONDS[delayIndex];
      const nextRetryAt = new Date(Date.now() + delaySeconds * 1000);

      await this.repository.updateDelivery(delivery.id, {
        status: 'RETRYING',
        statusCode,
        response: responseText,
        duration,
        attempt: currentAttempt + 1,
        nextRetryAt,
      });

      this.logger.log(
        `Webhook delivery ${delivery.id} failed (attempt ${currentAttempt}/${maxRetries}). Retrying at ${nextRetryAt.toISOString()}`,
        'WebhookService',
      );
    } else {
      // All retries exhausted
      await this.repository.updateDelivery(delivery.id, {
        status: 'FAILED',
        statusCode,
        response: responseText,
        duration,
      });

      this.logger.error(
        `Webhook delivery ${delivery.id} failed permanently after ${currentAttempt} attempt(s)`,
        undefined,
        'WebhookService',
      );
    }
  }

  /**
   * Process pending retries. Called by the setInterval polling mechanism.
   */
  async processRetries() {
    const pendingRetries = await this.repository.findPendingRetries();

    if (pendingRetries.length === 0) {
      return;
    }

    this.logger.log(
      `Processing ${pendingRetries.length} pending webhook retries`,
      'WebhookService',
    );

    for (const delivery of pendingRetries) {
      this.processDelivery(delivery.id).catch((err) => {
        this.logger.error(
          `Failed to process retry for delivery ${delivery.id}: ${(err as Error).message}`,
          (err as Error).stack,
          'WebhookService',
        );
      });
    }
  }

  /**
   * Send a test webhook event to a specific endpoint.
   */
  async sendTestEvent(id: string, companyId: string) {
    this.logger.log(`Sending test event to webhook endpoint ${id}`, 'WebhookService');

    const endpoint = await this.repository.findEndpointById(id, companyId);
    if (!endpoint) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery',
        endpointId: endpoint.id,
        endpointName: endpoint.name,
      },
    };

    const delivery = await this.repository.createDelivery({
      eventType: 'webhook.test',
      payload: testPayload,
      status: 'PENDING',
      attempt: 1,
      maxRetries: 1, // No retries for test events
      endpoint: { connect: { id: endpoint.id } },
    });

    // Process synchronously for test so we can return the result
    await this.processDelivery(delivery.id);

    // Fetch updated delivery to return the result
    const updatedDelivery = await this.repository.findDeliveryById(delivery.id);
    return this.formatDelivery(updatedDelivery);
  }

  // ============================================================================
  // Delivery History
  // ============================================================================

  /**
   * Get paginated delivery history for a webhook endpoint.
   */
  async getDeliveries(
    endpointId: string,
    companyId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    // Verify endpoint belongs to this company
    const endpoint = await this.repository.findEndpointById(endpointId, companyId);
    if (!endpoint) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    const { data, total } = await this.repository.findDeliveries(
      endpointId,
      page,
      limit,
    );

    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((d: any) => this.formatDelivery(d)),
      meta: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  // ============================================================================
  // Formatters
  // ============================================================================

  /**
   * Format a webhook endpoint for API response.
   * Masks the HMAC secret unless showFullSecret is true.
   */
  private formatEndpoint(endpoint: any, showFullSecret: boolean) {
    return {
      id: endpoint.id,
      companyId: endpoint.companyId,
      name: endpoint.name,
      url: endpoint.url,
      secret: showFullSecret
        ? endpoint.secret
        : `${'*'.repeat(Math.max(0, endpoint.secret.length - 8))}${endpoint.secret.slice(-8)}`,
      events: endpoint.events,
      headers: endpoint.headers,
      maxRetries: endpoint.maxRetries,
      isActive: endpoint.isActive,
      createdAt: endpoint.createdAt,
      updatedAt: endpoint.updatedAt,
    };
  }

  /**
   * Format a webhook delivery for API response.
   */
  private formatDelivery(delivery: any) {
    if (!delivery) return null;
    return {
      id: delivery.id,
      endpointId: delivery.endpointId,
      eventType: delivery.eventType,
      payload: delivery.payload,
      status: delivery.status,
      statusCode: delivery.statusCode,
      response: delivery.response,
      attempt: delivery.attempt,
      maxRetries: delivery.maxRetries,
      nextRetryAt: delivery.nextRetryAt,
      deliveredAt: delivery.deliveredAt,
      duration: delivery.duration,
      createdAt: delivery.createdAt,
      updatedAt: delivery.updatedAt,
    };
  }
}
