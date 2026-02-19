type LoginInput = {
    email?: string;
    phone?: string;
    password: string;
};

type RegisterInput = {
    email?: string;
    phone?: string;
    password: string;
};

export function useAuth() {
    const isAuthenticated = useState<boolean>("auth-is-authenticated", () => false);
    const refreshInFlight = useState<Promise<boolean> | null>("auth-refresh-in-flight", () => null);

    async function login(input: LoginInput) {
        await $fetch("/api/auth/login", {
            method: "POST",
            body: input,
            credentials: "include",
        });
        isAuthenticated.value = true;
    }

    async function register(input: RegisterInput) {
        await $fetch("/api/auth/register", {
            method: "POST",
            body: input,
            credentials: "include",
        });
        isAuthenticated.value = true;
    }

    async function refresh(): Promise<boolean> {
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
        return false;
    }

    async function logout() {
        await $fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => null);
        isAuthenticated.value = false;
    }

    async function me() {
        const response = await $fetch<{ user: { id: string } | null }>("/api/auth/me", {
            credentials: "include",
        });
        isAuthenticated.value = Boolean(response.user);
        return response.user;
    }

    async function authFetch<T>(url: string, options: Parameters<typeof $fetch<T>>[1] = {}) {
        try {
            return await $fetch<T>(url, {
                ...options,
                credentials: "include",
            });
        } catch (error: any) {
            if (error?.status === 401) {
                if (!refreshInFlight.value) {
                    refreshInFlight.value = refresh().finally(() => {
                        refreshInFlight.value = null;
                    });
                }
                const refreshed = await refreshInFlight.value;
                if (refreshed) {
                    return await $fetch<T>(url, {
                        ...options,
                        credentials: "include",
                    });
                }
            }
            throw error;
        }
    }

    return {
        isAuthenticated,
        login,
        register,
        refresh,
        logout,
        me,
        authFetch,
    };
}
