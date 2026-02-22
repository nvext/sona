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

type RegisterVerificationResponse = {
    user: AuthUser;
    verification: {
        required: boolean;
        channel: "email" | "phone";
        expiresAt: string;
        retryAfterMs: number;
    };
};

type UpdateProfileInput = {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
};

type VerificationChannel = "email" | "phone";

type AuthUser = {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    emailVerified: boolean;
    phoneVerified: boolean;
    status: string;
};

type PendingRegistration = {
    channel: VerificationChannel;
    nextUrl: string;
    password: string;
    email?: string;
    phone?: string;
    resendAvailableAt?: number;
};

export function useAuth() {
    const isAuthenticated = useState<boolean>("auth-is-authenticated", () => false);
    const user = useState<AuthUser | null>("auth-user", () => null);
    const pendingRegistration = useState<PendingRegistration | null>("auth-pending-registration", () => null);
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
        return await apiFetch<RegisterVerificationResponse>("/api/auth/register", {
            method: "POST",
            body: input,
            skipAuthRefresh: true,
        });
    }

    async function confirmRegistration(input: { email?: string; phone?: string; password: string; code: string }) {
        const response = await apiFetch<{ ok: boolean; user: AuthUser }>("/api/auth/register/confirm", {
            method: "POST",
            body: input,
            skipAuthRefresh: true,
        });
        isAuthenticated.value = true;
        user.value = response.user;
        return response;
    }

    async function resendRegistrationVerification(input: { email?: string; phone?: string; password: string }) {
        return await apiFetch<{
            ok: boolean;
            channel: "email" | "phone";
            expiresAt: string;
            retryAfterMs: number;
        }>("/api/auth/register/resend", {
            method: "POST",
            body: input,
            skipAuthRefresh: true,
        });
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
        pendingRegistration.value = null;
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

    async function updateProfile(input: UpdateProfileInput) {
        const response = await apiFetch<{ user: AuthUser | null }>("/api/auth/me", {
            method: "PATCH",
            body: input,
        });
        isAuthenticated.value = Boolean(response.user);
        user.value = response.user;
        return response.user;
    }

    async function requestContactVerification(channel: VerificationChannel) {
        return await apiFetch<{
            ok: boolean;
            channel: VerificationChannel;
            expiresAt: string;
            retryAfterMs: number;
        }>("/api/auth/verification/request", {
            method: "POST",
            body: { channel },
        });
    }

    async function confirmContactVerification(input: { channel: VerificationChannel; code: string }) {
        const response = await apiFetch<{
            ok: boolean;
            channel: VerificationChannel;
            verifiedAt: string;
            user: AuthUser | null;
        }>("/api/auth/verification/confirm", {
            method: "POST",
            body: input,
        });
        if (response.user) {
            user.value = response.user;
            isAuthenticated.value = true;
        }
        return response;
    }

    function setPendingRegistration(input: PendingRegistration) {
        pendingRegistration.value = input;
    }

    function clearPendingRegistration() {
        pendingRegistration.value = null;
    }

    return {
        isAuthenticated,
        user,
        pendingRegistration,
        login,
        register,
        confirmRegistration,
        resendRegistrationVerification,
        setPendingRegistration,
        clearPendingRegistration,
        refresh,
        logout,
        me,
        updateProfile,
        requestContactVerification,
        confirmContactVerification,
    };
}
