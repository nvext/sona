export type DeliveryRetryPolicy = {
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs: number;
};

export function calculateNextDeliveryRetryAt(input: {
    attempts: number;
    policy: DeliveryRetryPolicy;
    now: Date;
}): Date | null {
    if (input.attempts >= input.policy.maxAttempts) {
        return null;
    }

    const exponent = Math.max(0, input.attempts - 1);
    const delayMs = Math.min(
        input.policy.maxDelayMs,
        input.policy.baseDelayMs * Math.pow(2, exponent),
    );

    return new Date(input.now.getTime() + delayMs);
}
