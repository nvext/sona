import type { H3Event } from "h3";
import { createUseCases, type RuntimeUseCases } from "~~/server/infrastructure/runtime";

type ApiEventContext = {
    useCases?: RuntimeUseCases;
};

export function resolveUseCases(event: H3Event): RuntimeUseCases {
    const context = event.context as ApiEventContext;
    if (context.useCases) {
        return context.useCases;
    }

    return createUseCases();
}
