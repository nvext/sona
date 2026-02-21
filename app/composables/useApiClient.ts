type ApiFetchOptions<T> = (Parameters<typeof $fetch<T>>[1] & {
    skipAuthRefresh?: boolean;
}) | undefined;
type ApiFetchResult<T> = Awaited<ReturnType<typeof $fetch<T>>>;

const NO_REFRESH_PATHS = new Set([
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/refresh",
    "/api/auth/logout",
]);

function getPathname(url: string): string {
    if (url.startsWith("/")) {
        return url.split("?")[0] ?? url;
    }
    try {
        return new URL(url).pathname;
    } catch {
        return url.split("?")[0] ?? url;
    }
}

function shouldSkipRefresh(url: string, skipAuthRefresh: boolean): boolean {
    if (skipAuthRefresh) {
        return true;
    }
    return NO_REFRESH_PATHS.has(getPathname(url));
}

export function useApiClient() {
    const refreshInFlight = useState<Promise<boolean> | null>("api-refresh-in-flight", () => null);
    const isAuthenticated = useState<boolean>("auth-is-authenticated", () => false);
    const user = useState<unknown | null>("auth-user", () => null);

    async function refreshSession(): Promise<boolean> {
        try {
            const response = await $fetch<{ ok: boolean }>("/api/auth/refresh", {
                method: "POST",
                credentials: "include",
            });

            if (response?.ok) {
                isAuthenticated.value = true;
                return true;
            }
        } catch {
            // ignore and fall through
        }

        isAuthenticated.value = false;
        user.value = null;
        return false;
    }

    async function apiFetch<T>(url: string, options?: ApiFetchOptions<T>): Promise<ApiFetchResult<T>> {
        const { skipAuthRefresh = false, ...fetchOptions } = options ?? {};

        try {
            return (await $fetch<T>(url, {
                ...fetchOptions,
                credentials: "include",
            })) as ApiFetchResult<T>;
        } catch (error: any) {
            const status = error?.status ?? error?.response?.status;
            if (status !== 401 || shouldSkipRefresh(url, skipAuthRefresh)) {
                throw error;
            }

            if (!refreshInFlight.value) {
                refreshInFlight.value = refreshSession().finally(() => {
                    refreshInFlight.value = null;
                });
            }

            const refreshed = await refreshInFlight.value;
            if (!refreshed) {
                throw error;
            }

            return (await $fetch<T>(url, {
                ...fetchOptions,
                credentials: "include",
            })) as ApiFetchResult<T>;
        }
    }

    return {
        apiFetch,
        refreshSession,
    };
}
