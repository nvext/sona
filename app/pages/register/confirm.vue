<template>
    <section class="px-6 lg:px-25 py-12 min-h-[calc(100dvh-120px)] flex items-center justify-center">
        <div class="w-full max-w-6xl grid gap-6 lg:grid-cols-[1fr_22rem]">
            <div class="bg-bg-1 rounded-3xl p-8 lg:p-10 border border-dark-bg/10">
                <h1 class="text-5xl mb-8">Подтверждение</h1>

                <div v-if="!pendingRegistration" class="space-y-4">
                    <p class="text-dark-fg-2">
                        Данные регистрации не найдены. Начните регистрацию заново.
                    </p>
                    <UButton to="/login" color="neutral" variant="solid" class="!text-fg !bg-dark-bg">
                        На страницу входа
                    </UButton>
                </div>

                <UForm v-else :state="{ code }" class="space-y-4" @submit="submit">
                    <p class="text-dark-fg-2">
                        Введите код, отправленный на
                        <span class="text-dark-fg">{{ destinationLabel }}</span>.
                    </p>

                    <UFormField name="code" label="Код подтверждения" required>
                        <UInput
                            v-model="code"
                            type="text"
                            color="neutral"
                            variant="outline"
                            maxlength="6"
                            autocomplete="one-time-code"
                            placeholder="123456"
                            size="xl"
                            class="w-full" />
                    </UFormField>

                    <p v-if="info" class="text-sm text-dark-fg-2">{{ info }}</p>
                    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

                    <div class="flex flex-wrap items-center gap-3">
                        <UButton
                            type="submit"
                            color="neutral"
                            variant="solid"
                            icon="i-lucide-shield-check"
                            size="lg"
                            class="text-lg py-3 px-8 !text-fg !bg-dark-bg disabled:opacity-50"
                            :disabled="loading">
                            Подтвердить и войти
                        </UButton>
                        <UButton
                            type="button"
                            color="neutral"
                            variant="outline"
                            size="lg"
                            class="text-lg py-3 px-8"
                            :disabled="loading || resendLoading || resendLocked"
                            :loading="resendLoading"
                            @click="resendCode">
                            {{ resendButtonLabel }}
                        </UButton>
                        <UButton
                            type="button"
                            color="neutral"
                            variant="ghost"
                            size="lg"
                            :disabled="loading || resendLoading"
                            @click="changeCredentials">
                            Изменить данные
                        </UButton>
                    </div>
                </UForm>
            </div>

            <aside class="bg-dark-bg text-fg rounded-3xl p-8 flex flex-col justify-between">
                <div>
                    <p class="text-sm uppercase tracking-wide opacity-70">Безопасность</p>
                    <h2 class="text-3xl mt-2">Подтвердите контакт</h2>
                </div>
                <ul class="space-y-3 text-sm opacity-90">
                    <li>Код одноразовый и ограничен по времени</li>
                    <li>После подтверждения вход выполнится автоматически</li>
                    <li>Если кода нет, отправьте повторно</li>
                </ul>
            </aside>
        </div>
    </section>
</template>

<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const {
    pendingRegistration,
    confirmRegistration,
    resendRegistrationVerification,
    setPendingRegistration,
    clearPendingRegistration,
    me,
    isAuthenticated,
} = useAuth();

const code = ref("");
const loading = ref(false);
const resendLoading = ref(false);
const error = ref<string | null>(null);
const info = ref<string | null>(null);
const nowMs = ref(Date.now());
let cooldownTimer: ReturnType<typeof setInterval> | null = null;

const destinationLabel = computed(() => {
    if (!pendingRegistration.value) {
        return "";
    }
    return pendingRegistration.value.channel === "email"
        ? pendingRegistration.value.email ?? ""
        : pendingRegistration.value.phone ?? "";
});

const nextUrl = computed(() => pendingRegistration.value?.nextUrl ?? "/catalog");
const resendCooldownSeconds = computed(() => {
    const resendAvailableAt = pendingRegistration.value?.resendAvailableAt;
    if (!resendAvailableAt) {
        return 0;
    }
    const remainingMs = resendAvailableAt - nowMs.value;
    if (remainingMs <= 0) {
        return 0;
    }
    return Math.ceil(remainingMs / 1000);
});
const resendLocked = computed(() => resendCooldownSeconds.value > 0);
const resendButtonLabel = computed(() => {
    if (resendLocked.value) {
        return `Отправить код повторно через ${resendCooldownSeconds.value} с`;
    }
    return "Отправить код повторно";
});

function resolveDestination(): string {
    const candidate = nextUrl.value;
    if (
        candidate.length === 0 ||
        candidate === "/register/confirm" ||
        candidate.startsWith("/register/confirm?")
    ) {
        return "/catalog";
    }
    return candidate;
}

watchEffect(() => {
    if (isAuthenticated.value) {
        const destination = resolveDestination();
        if (route.fullPath !== destination) {
            router.replace(destination);
        }
    }
});

onMounted(() => {
    cooldownTimer = setInterval(() => {
        nowMs.value = Date.now();
    }, 1000);
});

onUnmounted(() => {
    if (cooldownTimer) {
        clearInterval(cooldownTimer);
        cooldownTimer = null;
    }
});

function updateResendTimeout(retryAfterMs: number) {
    if (!pendingRegistration.value) {
        return;
    }

    setPendingRegistration({
        ...pendingRegistration.value,
        resendAvailableAt: Date.now() + Math.max(0, retryAfterMs),
    });
}

function parseRetryAfterMs(statusMessage: unknown): number | null {
    if (typeof statusMessage !== "string") {
        return null;
    }

    const matched = statusMessage.match(/retry in\s+(\d+)\s+seconds/i);
    if (!matched) {
        return null;
    }

    const seconds = Number(matched[1]);
    if (!Number.isFinite(seconds) || seconds <= 0) {
        return null;
    }

    return seconds * 1000;
}

function buildIdentifierPayload() {
    if (!pendingRegistration.value) {
        return null;
    }

    if (pendingRegistration.value.channel === "email" && pendingRegistration.value.email) {
        return { email: pendingRegistration.value.email };
    }
    if (pendingRegistration.value.channel === "phone" && pendingRegistration.value.phone) {
        return { phone: pendingRegistration.value.phone };
    }

    return null;
}

async function submit() {
    error.value = null;
    info.value = null;

    if (!pendingRegistration.value) {
        error.value = "Данные регистрации не найдены.";
        return;
    }

    const identifierPayload = buildIdentifierPayload();
    if (!identifierPayload) {
        error.value = "Контакт для подтверждения не найден.";
        return;
    }

    if (code.value.trim().length === 0) {
        error.value = "Введите код подтверждения.";
        return;
    }

    loading.value = true;
    try {
        const destination = resolveDestination();
        await confirmRegistration({
            ...identifierPayload,
            password: pendingRegistration.value.password,
            code: code.value.trim(),
        });
        clearPendingRegistration();
        await router.replace(destination);
        me().catch(() => null);
    } catch (err: any) {
        error.value = err?.data?.statusMessage ?? "Не удалось подтвердить контакт.";
    } finally {
        loading.value = false;
    }
}

async function resendCode() {
    error.value = null;
    info.value = null;

    if (resendLocked.value) {
        info.value = `Повторная отправка будет доступна через ${resendCooldownSeconds.value} с.`;
        return;
    }

    if (!pendingRegistration.value) {
        error.value = "Данные регистрации не найдены.";
        return;
    }

    const identifierPayload = buildIdentifierPayload();
    if (!identifierPayload) {
        error.value = "Контакт для подтверждения не найден.";
        return;
    }

    resendLoading.value = true;
    try {
        const response = await resendRegistrationVerification({
            ...identifierPayload,
            password: pendingRegistration.value.password,
        });
        updateResendTimeout(response.retryAfterMs);
        info.value = response.channel === "email"
            ? "Код отправлен повторно на email."
            : "Код отправлен повторно на телефон.";
    } catch (err: any) {
        const statusMessage = err?.data?.statusMessage ?? err?.statusMessage;
        const retryAfterMs = parseRetryAfterMs(statusMessage);
        if (retryAfterMs) {
            updateResendTimeout(retryAfterMs);
        }
        error.value = statusMessage ?? "Не удалось отправить код повторно.";
    } finally {
        resendLoading.value = false;
    }
}

async function changeCredentials() {
    clearPendingRegistration();
    await router.push("/login");
}
</script>
