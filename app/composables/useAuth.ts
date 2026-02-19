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

    async function refresh() {
        await $fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
        });
        isAuthenticated.value = true;
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
