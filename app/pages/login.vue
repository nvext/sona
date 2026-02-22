<template>
    <section class="px-6 lg:px-25 py-12 min-h-[calc(100dvh-120px)] flex items-center justify-center">
        <div class="w-full max-w-6xl grid gap-6 lg:grid-cols-[1fr_22rem]">
            <div class="bg-bg-1 rounded-3xl p-8 lg:p-10 border border-dark-bg/10">
                <h1 class="text-5xl mb-8">Вход</h1>

                <UTabs
                    v-model="mode"
                    :items="modeTabs"
                    color="neutral"
                    variant="pill"
                    class="mb-6" />

                <UForm :state="formState" class="space-y-4" @submit="submit">
                    <UFormField name="identifier" label="Email или телефон" required>
                        <UInput
                            v-model="formState.identifier"
                            type="text"
                            color="neutral"
                            variant="outline"
                            autocomplete="username"
                            placeholder="name@example.com"
                            size="xl"
                            class="w-full" />
                    </UFormField>
                    <UFormField name="password" label="Пароль" required>
                        <UInput
                            v-model="formState.password"
                            type="password"
                            color="neutral"
                            variant="outline"
                            autocomplete="current-password"
                            placeholder="•••••••"
                            size="xl"
                            class="w-full" />
                    </UFormField>

                    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

                    <UButton
                        type="submit"
                        color="neutral"
                        variant="solid"
                        :icon="mode === 'login' ? 'i-lucide-log-in' : 'i-lucide-user-plus'"
                        size="lg"
                        class="mt-3 text-lg py-3 px-8 !text-fg !bg-dark-bg disabled:opacity-50"
                        :disabled="loading">
                        {{ mode === "login" ? "Войти" : "Создать аккаунт" }}
                    </UButton>
                </UForm>
            </div>

            <aside class="bg-dark-bg text-fg rounded-3xl p-8 flex flex-col justify-between">
                <div>
                    <p class="text-sm uppercase tracking-wide opacity-70">Кабинет</p>
                    <h2 class="text-3xl mt-2">Быстрый доступ</h2>
                </div>
                <ul class="space-y-3 text-sm opacity-90">
                    <li>Сохраненные контакты для заявки</li>
                    <li>Быстрое оформление из корзины</li>
                    <li>Актуальные данные профиля в одном месте</li>
                </ul>
            </aside>
        </div>
    </section>
</template>

<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const { login, register, setPendingRegistration, me, isAuthenticated } = useAuth();

const mode = ref<"login" | "register">("login");
const formState = reactive({
    identifier: "",
    password: "",
});
const loading = ref(false);
const error = ref<string | null>(null);
const modeTabs = [
    { label: "Вход", value: "login" },
    { label: "Регистрация", value: "register" },
];

const nextUrl = computed(() => {
    const next = route.query.next;
    return typeof next === "string" && next.length > 0 ? next : "/catalog";
});

watchEffect(() => {
    if (isAuthenticated.value) {
        router.push(nextUrl.value);
    }
});

async function submit() {
    error.value = null;
    const value = formState.identifier.trim();
    if (!value || !formState.password) {
        error.value = "Введите логин и пароль.";
        return;
    }

    const isEmail = value.includes("@");
    const payload = isEmail
        ? { email: value, password: formState.password }
        : { phone: value, password: formState.password };

    loading.value = true;
    try {
        if (mode.value === "login") {
            try {
                await login(payload);
            } catch (err: any) {
                const statusCode = err?.status ?? err?.response?.status;
                const statusMessage = err?.data?.statusMessage ?? err?.statusMessage;
                if (
                    statusCode === 403 &&
                    typeof statusMessage === "string" &&
                    statusMessage.toLowerCase().includes("not verified")
                ) {
                    setPendingRegistration({
                        ...payload,
                        channel: isEmail ? "email" : "phone",
                        password: formState.password,
                        nextUrl: nextUrl.value,
                    });
                    await router.push("/register/confirm");
                    return;
                }
                throw err;
            }
            await me();
            await router.push(nextUrl.value);
            return;
        }

        const response = await register(payload);
        setPendingRegistration({
            ...payload,
            channel: response.verification.channel,
            password: formState.password,
            nextUrl: nextUrl.value,
            resendAvailableAt: Date.now() + response.verification.retryAfterMs,
        });
        await router.push("/register/confirm");
    } catch (err: any) {
        const statusMessage = err?.data?.statusMessage ?? err?.statusMessage;
        error.value = statusMessage ?? "Ошибка авторизации.";
    } finally {
        loading.value = false;
    }
}
</script>
