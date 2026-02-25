export default defineNuxtRouteMiddleware(async (to) => {
    const config = useRuntimeConfig();
    if (!config.public.adminUiEnabled) {
        return navigateTo("/catalog");
    }

    const { isAuthenticated, user, me } = useAuth();

    if (!isAuthenticated.value || !user.value) {
        try {
            await me();
        } catch {
            return navigateTo(`/login?next=${encodeURIComponent(to.fullPath)}`);
        }
    }

    if (!user.value || user.value.role !== "admin") {
        return navigateTo("/catalog");
    }
});
