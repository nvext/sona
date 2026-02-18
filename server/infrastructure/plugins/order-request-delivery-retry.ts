import { defineNitroPlugin } from "nitropack/runtime";
import { getRuntimeContainer, startOrderRequestDeliveryRetryWorker } from "~~/server/infrastructure/runtime";

const runtimeGlobal = globalThis as typeof globalThis & {
    __sonaDeliveryRetryStop?: () => void;
};

export default defineNitroPlugin((nitroApp) => {
    if (runtimeGlobal.__sonaDeliveryRetryStop) {
        return;
    }

    runtimeGlobal.__sonaDeliveryRetryStop = startOrderRequestDeliveryRetryWorker(
        getRuntimeContainer(),
    );

    nitroApp.hooks.hookOnce("close", () => {
        runtimeGlobal.__sonaDeliveryRetryStop?.();
        delete runtimeGlobal.__sonaDeliveryRetryStop;
    });
});
