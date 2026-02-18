import { createServer } from "node:http";
import { AddressInfo } from "node:net";
import { createApp, createRouter, eventHandler, toNodeListener } from "h3";

export async function callApi(options: {
    route: string;
    requestPath?: string;
    handler: (event: any) => any;
    method?: string;
    query?: Record<string, string | number>;
    body?: unknown;
    useCases?: unknown;
}) {
    const app = createApp();
    const router = createRouter();
    const method = (options.method ?? "GET").toUpperCase();
    const wrappedHandler = eventHandler(async (event) => {
        if (options.useCases !== undefined) {
            (event.context as any).useCases = options.useCases;
        }
        return options.handler(event);
    });

    if (method === "GET") {
        router.get(options.route, wrappedHandler);
    } else if (method === "POST") {
        router.post(options.route, wrappedHandler);
    } else if (method === "PUT") {
        router.put(options.route, wrappedHandler);
    } else if (method === "PATCH") {
        router.patch(options.route, wrappedHandler);
    } else if (method === "DELETE") {
        router.delete(options.route, wrappedHandler);
    } else {
        router.use(options.route, wrappedHandler);
    }

    app.use(router);

    const server = createServer(toNodeListener(app));

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as AddressInfo).port;

    const url = new URL(`http://127.0.0.1:${port}${options.requestPath ?? options.route}`);
    if (options.query) {
        for (const [key, value] of Object.entries(options.query)) {
            url.searchParams.set(key, String(value));
        }
    }

    const response = await fetch(url, {
        method,
        headers: options.body === undefined ? undefined : { "content-type": "application/json" },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    const text = await response.text();
    let json: any = null;
    try {
        json = text ? JSON.parse(text) : null;
    } catch {
        json = { raw: text };
    }

    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));

    return {
        status: response.status,
        body: json,
    };
}
