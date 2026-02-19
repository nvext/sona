import { defineApiHandler } from "../http/api/handler";

export default defineApiHandler(() => {
    return {
        status: "ok",
        timestamp: new Date().toISOString(),
    };
});
