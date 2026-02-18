import { defineNitroPlugin } from "nitropack/runtime";
import { readRuntimeEnv } from "~~/server/infrastructure/runtime/env";

export default defineNitroPlugin(() => {
    readRuntimeEnv();
});
