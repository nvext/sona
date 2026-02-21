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

type AuthUser = {
    id: string;
    email: string | null;
    phone: string | null;
    status: string;
};

export function useAuth() {
    const isAuthenticated = useState<boolean>("auth-is-authenticated", () => false);
    const user = useState<AuthUser | null>("auth-user", () => null);
    const { apiFetch, refreshSession } = useApiClient();

    async function login(input: LoginInput) {
        await apiFetch("/api/auth/login", {
            method: "POST",
            body: input,
            skipAuthRefresh: true,
        });
        isAuthenticated.value = true;
        await me();
    }

    async function register(input: RegisterInput) {
        await apiFetch("/api/auth/register", {
            method: "POST",
            body: input,
            skipAuthRefresh: true,
        });
        isAuthenticated.value = true;
        await me();
    }

    async function refresh(): Promise<boolean> {
        const refreshed = await refreshSession();
        if (!refreshed) return false;
        await me();
        return true;
    }

    async function logout() {
        await apiFetch("/api/auth/logout", { method: "POST", skipAuthRefresh: true }).catch(() => null);
        isAuthenticated.value = false;
        user.value = null;
    }

    async function me() {
        try {
            const response = await apiFetch<{ user: AuthUser | null }>("/api/auth/me");
            isAuthenticated.value = Boolean(response.user);
            user.value = response.user;
            return response.user;
        } catch (error) {
            isAuthenticated.value = false;
            user.value = null;
            throw error;
        }
    }

    return {
        isAuthenticated,
        user,
        login,
        register,
        refresh,
        logout,
        me,
    };
}
