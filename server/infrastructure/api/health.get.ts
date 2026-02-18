import { defineApiHandler } from "./_shared/handler";

export default defineApiHandler(() => {
    return {
        status: "ok",
        timestamp: new Date().toISOString(),
    };
});
