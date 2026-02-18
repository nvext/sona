import type { H3Event } from "h3";
import {
    createUseCases,
    getRuntimeContainer,
    type RuntimeContainer,
    type RuntimeUseCases,
} from "~~/server/infrastructure/runtime";

type ApiEventContext = {
    container?: RuntimeContainer;
    useCases?: RuntimeUseCases;
};

export function resolveContainer(event: H3Event): RuntimeContainer {
    const context = event.context as ApiEventContext;
    if (context.container) {
        return context.container;
    }

    return getRuntimeContainer();
}

export function resolveUseCases(event: H3Event): RuntimeUseCases {
    const context = event.context as ApiEventContext;
    if (context.useCases) {
        return context.useCases;
    }

    return createUseCases(resolveContainer(event));
}
