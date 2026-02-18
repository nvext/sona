import { calculateNextDeliveryRetryAt } from "~~/server/application/checkout/services/delivery-retry-policy";
import { recordRetryCycle, recordRetryDelivered, recordRetryFailed } from "./metrics";
import type { RuntimeContainer } from "./container";
import { readRuntimeEnv } from "./env";
import { logError, logInfo } from "./logger";

export type DeliveryRetryConfig = {
    intervalMs: number;
    batchSize: number;
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs: number;
};

export function readDeliveryRetryConfigFromEnv(): DeliveryRetryConfig {
    const env = readRuntimeEnv();

    return {
        intervalMs: env.retry.intervalMs,
        batchSize: env.retry.batchSize,
        maxAttempts: env.retry.maxAttempts,
        baseDelayMs: env.retry.baseDelayMs,
        maxDelayMs: env.retry.maxDelayMs,
    };
}

export async function processFailedOrderRequestsOnce(
    container: RuntimeContainer,
    config: DeliveryRetryConfig,
): Promise<void> {
    recordRetryCycle();

    const { data: failedRequests } = await container.repos.orderRequestRepo.getFailedForDelivery({
        limit: config.batchSize,
        now: new Date(),
        maxAttempts: config.maxAttempts,
    });
    logInfo("checkout.retry.cycle_started", {
        failedCount: failedRequests.length,
        batchSize: config.batchSize,
        maxAttempts: config.maxAttempts,
    });

    for (const orderRequest of failedRequests) {
        try {
            await container.services.orderRequestDeliveryService.send({ orderRequest });
            const now = new Date();
            await container.repos.orderRequestRepo.update({
                patch: {
                    id: orderRequest.id,
                    status: "sent",
                    nextDeliveryRetryAt: null,
                    lastDeliveryError: null,
                    sentAt: now,
                    updatedAt: now,
                },
            });
            recordRetryDelivered();
            logInfo("checkout.retry.delivered", {
                orderRequestId: orderRequest.id,
                attempts: orderRequest.deliveryAttempts,
            });
        } catch (error) {
            const attempts = orderRequest.deliveryAttempts + 1;
            const retryAt = calculateNextDeliveryRetryAt({
                attempts,
                policy: {
                    maxAttempts: config.maxAttempts,
                    baseDelayMs: config.baseDelayMs,
                    maxDelayMs: config.maxDelayMs,
                },
                now: new Date(),
            });

            await container.repos.orderRequestRepo.update({
                patch: {
                    id: orderRequest.id,
                    status: "failed",
                    deliveryAttempts: attempts,
                    nextDeliveryRetryAt: retryAt,
                    lastDeliveryError: error instanceof Error ? error.message : "Delivery failed",
                    updatedAt: new Date(),
                },
            });
            recordRetryFailed();
            logError("checkout.retry.failed", {
                orderRequestId: orderRequest.id,
                attempts,
                nextRetryAt: retryAt?.toISOString() ?? null,
                errorMessage: error instanceof Error ? error.message : "Delivery failed",
            });
        }
    }
}

export function startOrderRequestDeliveryRetryWorker(container: RuntimeContainer): () => void {
    const config = readDeliveryRetryConfigFromEnv();
    let inProgress = false;

    const tick = async () => {
        if (inProgress) {
            return;
        }
        inProgress = true;
        try {
            await processFailedOrderRequestsOnce(container, config);
        } finally {
            inProgress = false;
        }
    };

    void tick();

    const timer = setInterval(() => {
        void tick();
    }, config.intervalMs);
    timer.unref();

    return () => {
        clearInterval(timer);
    };
}
