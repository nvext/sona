<template>
    <section class="px-6 lg:px-25 py-12 min-h-[calc(100dvh-120px)] flex items-center justify-center">
        <div class="w-full max-w-6xl grid gap-6 lg:grid-cols-[1fr_22rem]">
            <div class="bg-bg-1 rounded-3xl p-8 lg:p-10 border border-dark-bg/10">
                <h1 class="text-5xl mb-8">Подтверждение контакта</h1>

                <div v-if="pageLoading" class="text-dark-fg-2">
                    Загрузка...
                </div>

                <div v-else-if="channel === null" class="space-y-4">
                    <p class="text-dark-fg-2">Некорректный тип контакта.</p>
                    <UButton to="/profile" color="neutral" variant="solid" class="!text-fg !bg-dark-bg">
                        Вернуться в профиль
                    </UButton>
                </div>

                <div v-else-if="contactValue.length === 0" class="space-y-4">
                    <p class="text-dark-fg-2">
                        Контакт не заполнен. Укажите {{ channel === "email" ? "email" : "телефон" }} в профиле.
                    </p>
                    <UButton to="/profile" color="neutral" variant="solid" class="!text-fg !bg-dark-bg">
                        Вернуться в профиль
                    </UButton>
                </div>

                <div v-else-if="isVerified" class="space-y-4">
                    <p class="text-green-700">
                        {{ channel === "email" ? "Email уже подтвержден." : "Телефон уже подтвержден." }}
                    </p>
                    <UButton to="/profile" color="neutral" variant="solid" class="!text-fg !bg-dark-bg">
                        Вернуться в профиль
                    </UButton>
                </div>

                <UForm v-else :state="{ code }" class="space-y-4" @submit="submit">
                    <p class="text-dark-fg-2">
                        Отправим код на
                        <span class="text-dark-fg">{{ contactValue }}</span>.
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
                    <p v-if="success" class="text-sm text-green-700">{{ success }}</p>

                    <div class="flex flex-wrap items-center gap-3">
                        <UButton
                            type="submit"
                            color="neutral"
                            variant="solid"
                            icon="i-lucide-shield-check"
                            size="lg"
                            class="text-lg py-3 px-8 !text-fg !bg-dark-bg disabled:opacity-50"
                            :disabled="confirmLoading">
                            Подтвердить
                        </UButton>
                        <UButton
                            type="button"
                            color="neutral"
                            variant="outline"
                            size="lg"
                            :disabled="requestLoading || confirmLoading || resendLocked"
                            :loading="requestLoading"
                            @click="sendCode">
                            {{ sendButtonLabel }}
                        </UButton>
                        <UButton
                            type="button"
                            color="neutral"
                            variant="ghost"
                            size="lg"
                            :disabled="requestLoading || confirmLoading"
                            @click="goBack">
                            Назад в профиль
                        </UButton>
                    </div>
                </UForm>
            </div>

            <aside class="bg-dark-bg text-fg rounded-3xl p-8 flex flex-col justify-between">
                <div>
                    <p class="text-sm uppercase tracking-wide opacity-70">Подтверждение</p>
                    <h2 class="text-3xl mt-2">
                        {{ channel === "phone" ? "Телефон" : "Email" }}
                    </h2>
                </div>
                <ul class="space-y-3 text-sm opacity-90">
                    <li>Код одноразовый и ограничен по времени</li>
                    <li>Подтверждение повышает надежность аккаунта</li>
                    <li>После успеха вернем вас в профиль</li>
                </ul>
            </aside>
        </div>
    </section>
</template>

<script setup lang="ts">
const route = useRoute();
const {
    isAuthenticated,
    user,
    me,
    requestContactVerification,
    confirmContactVerification,
} = useAuth();

type VerificationChannel = "email" | "phone";

const pageLoading = ref(true);
const requestLoading = ref(false);
const confirmLoading = ref(false);
const code = ref("");
const codeWasRequested = ref(false);
const error = ref<string | null>(null);
const info = ref<string | null>(null);
const success = ref<string | null>(null);
const resendAvailableAt = ref<number | null>(null);
const nowMs = ref(Date.now());
let cooldownTimer: ReturnType<typeof setInterval> | null = null;

const channel = computed<VerificationChannel | null>(() => {
    const value = route.params.channel;
    if (value === "email" || value === "phone") {
        return value;
    }
    return null;
});

const contactValue = computed(() => {
    if (!channel.value) {
        return "";
    }
    if (channel.value === "email") {
        return (user.value?.email ?? "").trim();
    }
    return (user.value?.phone ?? "").trim();
});

const isVerified = computed(() => {
    if (!channel.value) {
        return false;
    }
    return channel.value === "email"
        ? Boolean(user.value?.emailVerified)
        : Boolean(user.value?.phoneVerified);
});
const resendCooldownSeconds = computed(() => {
    if (!resendAvailableAt.value) {
        return 0;
    }
    const remainingMs = resendAvailableAt.value - nowMs.value;
    if (remainingMs <= 0) {
        return 0;
    }
    return Math.ceil(remainingMs / 1000);
});
const resendLocked = computed(() => resendCooldownSeconds.value > 0);
const sendButtonLabel = computed(() => {
    if (resendLocked.value) {
        return `Отправить повторно через ${resendCooldownSeconds.value} с`;
    }
    return codeWasRequested.value ? "Отправить код повторно" : "Отправить код";
});

onMounted(async () => {
    cooldownTimer = setInterval(() => {
        nowMs.value = Date.now();
    }, 1000);

    if (!isAuthenticated.value) {
        try {
            await me();
        } catch {
            // handled below
        }
    }

    pageLoading.value = false;

    if (!isAuthenticated.value) {
        await navigateTo("/login");
        return;
    }

    if (channel.value === null) {
        await navigateTo("/profile");
    }
});

onUnmounted(() => {
    if (cooldownTimer) {
        clearInterval(cooldownTimer);
        cooldownTimer = null;
    }
});

watch(isAuthenticated, async (value) => {
    if (!pageLoading.value && !value) {
        await navigateTo("/login");
    }
});

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

async function sendCode() {
    if (!channel.value || contactValue.value.length === 0 || isVerified.value) {
        return;
    }

    if (resendLocked.value) {
        info.value = `Повторная отправка будет доступна через ${resendCooldownSeconds.value} с.`;
        return;
    }

    requestLoading.value = true;
    error.value = null;
    info.value = null;
    success.value = null;
    try {
        const response = await requestContactVerification(channel.value);
        codeWasRequested.value = true;
        resendAvailableAt.value = Date.now() + response.retryAfterMs;
        info.value = `Код отправлен. Действует до ${new Date(response.expiresAt).toLocaleTimeString()}.`;
    } catch (err: any) {
        const statusMessage = err?.data?.statusMessage ?? err?.statusMessage;
        const retryAfterMs = parseRetryAfterMs(statusMessage);
        if (retryAfterMs) {
            resendAvailableAt.value = Date.now() + retryAfterMs;
        }
        error.value = statusMessage ?? "Не удалось отправить код.";
    } finally {
        requestLoading.value = false;
    }
}

async function submit() {
    if (!channel.value || contactValue.value.length === 0 || isVerified.value) {
        return;
    }

    error.value = null;
    info.value = null;
    success.value = null;

    if (code.value.trim().length === 0) {
        error.value = "Введите код подтверждения.";
        return;
    }

    confirmLoading.value = true;
    try {
        await confirmContactVerification({
            channel: channel.value,
            code: code.value.trim(),
        });
        await navigateTo("/profile", { replace: true });
    } catch (err: any) {
        error.value = err?.data?.statusMessage ?? "Не удалось подтвердить контакт.";
    } finally {
        confirmLoading.value = false;
    }
}

async function goBack() {
    await navigateTo("/profile");
}
</script>
