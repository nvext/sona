import type { RuntimeContainer } from "./container";

export type DeliveryRetryConfig = {
    intervalMs: number;
    batchSize: number;
};

export function readDeliveryRetryConfigFromEnv(): DeliveryRetryConfig {
    const intervalMs = Math.max(1_000, Number(process.env.ORDER_DELIVERY_RETRY_INTERVAL ?? 30_000));
    const batchSize = Math.max(1, Number(process.env.ORDER_DELIVERY_RETRY_BATCH_SIZE ?? 20));

    return {
        intervalMs,
        batchSize,
    };
}

export async function processFailedOrderRequestsOnce(
    container: RuntimeContainer,
    config: DeliveryRetryConfig,
): Promise<void> {
    const { data: failedRequests } = await container.repos.orderRequestRepo.getFailedForDelivery({
        limit: config.batchSize,
    });

    for (const orderRequest of failedRequests) {
        try {
            await container.services.orderRequestDeliveryService.send({ orderRequest });
            const now = new Date();
            await container.repos.orderRequestRepo.update({
                patch: {
                    id: orderRequest.id,
                    status: "sent",
                    sentAt: now,
                    updatedAt: now,
                },
            });
        } catch {
            await container.repos.orderRequestRepo.update({
                patch: {
                    id: orderRequest.id,
                    status: "failed",
                    updatedAt: new Date(),
                },
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
