import { defineApiHandler } from "./shared/handler";

export default defineApiHandler(() => {
    return {
        status: "ok",
        timestamp: new Date().toISOString(),
    };
});
