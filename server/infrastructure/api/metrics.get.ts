import { setHeader } from "h3";
import { defineApiHandler } from "./shared/handler";
import { getDeliveryMetricsSnapshot } from "~~/server/infrastructure/runtime";

export default defineApiHandler((event) => {
    const metrics = getDeliveryMetricsSnapshot();

    setHeader(event, "content-type", "text/plain; version=0.0.4; charset=utf-8");

    return [
        "# HELP sona_delivery_submit_attempts_total Total checkout submit attempts.",
        "# TYPE sona_delivery_submit_attempts_total counter",
        `sona_delivery_submit_attempts_total ${metrics.submitAttempts}`,
        "# HELP sona_delivery_submit_delivered_total Total checkout submits delivered immediately.",
        "# TYPE sona_delivery_submit_delivered_total counter",
        `sona_delivery_submit_delivered_total ${metrics.submitDelivered}`,
        "# HELP sona_delivery_submit_failed_total Total checkout submits failed delivery.",
        "# TYPE sona_delivery_submit_failed_total counter",
        `sona_delivery_submit_failed_total ${metrics.submitFailed}`,
        "# HELP sona_delivery_retry_cycles_total Total retry worker cycles.",
        "# TYPE sona_delivery_retry_cycles_total counter",
        `sona_delivery_retry_cycles_total ${metrics.retryCycles}`,
        "# HELP sona_delivery_retry_delivered_total Total requests delivered by retry worker.",
        "# TYPE sona_delivery_retry_delivered_total counter",
        `sona_delivery_retry_delivered_total ${metrics.retryDelivered}`,
        "# HELP sona_delivery_retry_failed_total Total failed retry attempts.",
        "# TYPE sona_delivery_retry_failed_total counter",
        `sona_delivery_retry_failed_total ${metrics.retryFailed}`,
        "# HELP sona_delivery_retry_last_cycle_timestamp_seconds Last retry cycle timestamp.",
        "# TYPE sona_delivery_retry_last_cycle_timestamp_seconds gauge",
        `sona_delivery_retry_last_cycle_timestamp_seconds ${
            metrics.lastRetryCycleAt
                ? Math.floor(metrics.lastRetryCycleAt.getTime() / 1000)
                : 0
        }`,
    ].join("\n");
});
