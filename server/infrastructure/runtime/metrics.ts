type DeliveryMetricsState = {
    submitAttempts: number;
    submitDelivered: number;
    submitFailed: number;
    retryCycles: number;
    retryDelivered: number;
    retryFailed: number;
    lastRetryCycleAt: Date | null;
    adminPublishTotal: number;
    adminPublishFailedTotal: number;
    adminPublishLastDurationMs: number;
};

const state: DeliveryMetricsState = {
    submitAttempts: 0,
    submitDelivered: 0,
    submitFailed: 0,
    retryCycles: 0,
    retryDelivered: 0,
    retryFailed: 0,
    lastRetryCycleAt: null,
    adminPublishTotal: 0,
    adminPublishFailedTotal: 0,
    adminPublishLastDurationMs: 0,
};

export function recordSubmitAttempt(): void {
    state.submitAttempts += 1;
}

export function recordSubmitDelivered(): void {
    state.submitDelivered += 1;
}

export function recordSubmitFailed(): void {
    state.submitFailed += 1;
}

export function recordRetryCycle(): void {
    state.retryCycles += 1;
    state.lastRetryCycleAt = new Date();
}

export function recordRetryDelivered(): void {
    state.retryDelivered += 1;
}

export function recordRetryFailed(): void {
    state.retryFailed += 1;
}

export function getDeliveryMetricsSnapshot(): DeliveryMetricsState {
    return {
        ...state,
    };
}

export function recordAdminPublishSucceeded(durationMs: number): void {
    state.adminPublishTotal += 1;
    state.adminPublishLastDurationMs = durationMs;
}

export function recordAdminPublishFailed(): void {
    state.adminPublishFailedTotal += 1;
}
