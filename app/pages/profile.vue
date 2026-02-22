<template>
    <section
        v-if="isBaseProfileRoute"
        class="px-6 lg:px-25 py-12 min-h-[calc(100dvh-120px)] flex items-center justify-center">
        <div class="w-full max-w-6xl grid gap-6 lg:grid-cols-[1fr_22rem]">
            <div class="bg-bg-1 rounded-3xl p-8 lg:p-10 border border-dark-bg/10">
                <h1 class="text-5xl mb-8">Профиль</h1>

                <div v-if="pageLoading" class="text-dark-fg-2">
                    Загрузка профиля...
                </div>

                <form v-else class="space-y-6" @submit.prevent="submit">
                    <label class="block space-y-2">
                        <span class="text-sm">Имя</span>
                        <input
                            v-model="form.name"
                            type="text"
                            class="w-full border border-dark-bg/20 rounded-xl px-4 py-3 bg-bg"
                            placeholder="Иван" />
                    </label>

                    <div class="space-y-3">
                        <label class="block space-y-2">
                            <span class="text-sm">Email</span>
                            <input
                                v-model="form.email"
                                type="email"
                                class="w-full border border-dark-bg/20 rounded-xl px-4 py-3 bg-bg"
                                placeholder="name@example.com" />
                        </label>
                        <div class="flex flex-wrap items-center gap-2 text-sm">
                            <span :class="isChannelVerified('email') ? 'text-green-700' : 'text-dark-fg-2'">
                                {{ isChannelVerified("email") ? "Email подтвержден" : "Email не подтвержден" }}
                            </span>
                            <UButton
                                v-if="!isChannelVerified('email')"
                                :to="canGoToVerification('email') ? '/profile/verify/email' : undefined"
                                type="button"
                                color="neutral"
                                variant="outline"
                                size="xs"
                                :disabled="!canGoToVerification('email')">
                                Подтвердить
                            </UButton>
                        </div>
                        <p v-if="isChannelDirty('email')" class="text-xs text-dark-fg-2">
                            Сохраните профиль, чтобы подтвердить новый email.
                        </p>
                    </div>

                    <div class="space-y-3">
                        <label class="block space-y-2">
                            <span class="text-sm">Телефон</span>
                            <input
                                v-model="form.phone"
                                type="tel"
                                class="w-full border border-dark-bg/20 rounded-xl px-4 py-3 bg-bg"
                                placeholder="+7..." />
                        </label>
                        <div class="flex flex-wrap items-center gap-2 text-sm">
                            <span :class="isChannelVerified('phone') ? 'text-green-700' : 'text-dark-fg-2'">
                                {{ isChannelVerified("phone") ? "Телефон подтвержден" : "Телефон не подтвержден" }}
                            </span>
                            <UButton
                                v-if="!isChannelVerified('phone')"
                                :to="canGoToVerification('phone') ? '/profile/verify/phone' : undefined"
                                type="button"
                                color="neutral"
                                variant="outline"
                                size="xs"
                                :disabled="!canGoToVerification('phone')">
                                Подтвердить
                            </UButton>
                        </div>
                        <p v-if="isChannelDirty('phone')" class="text-xs text-dark-fg-2">
                            Сохраните профиль, чтобы подтвердить новый телефон.
                        </p>
                    </div>

                    <p class="text-sm text-dark-fg-2">Хотя бы одно поле должно быть заполнено.</p>
                    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
                    <p v-if="success" class="text-sm text-green-700">{{ success }}</p>

                    <UButton
                        type="submit"
                        color="neutral"
                        variant="solid"
                        class="text-xl py-4 px-10 !text-fg !bg-dark-bg disabled:opacity-50 disabled:cursor-not-allowed"
                        :disabled="saving || !canSubmit">
                        {{ saving ? "Сохранение..." : "Сохранить профиль" }}
                    </UButton>
                </form>
            </div>

            <aside class="bg-dark-bg text-fg rounded-3xl p-8 flex flex-col justify-between">
                <div>
                    <p class="text-sm uppercase tracking-wide opacity-70">Данные</p>
                    <h2 class="text-3xl mt-2">Личный кабинет</h2>
                </div>
                <ul class="space-y-3 text-sm opacity-90">
                    <li>Имя подставляется при оформлении заказа</li>
                    <li>Можно хранить и email, и телефон</li>
                    <li>Контакты подтверждаются одноразовым кодом</li>
                </ul>
            </aside>
        </div>
    </section>
    <NuxtPage v-else />
</template>

<script setup lang="ts">
const route = useRoute();
const { isAuthenticated, user, me, updateProfile } = useAuth();

type VerificationChannel = "email" | "phone";

const pageLoading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);
const form = reactive({
    name: "",
    email: "",
    phone: "",
});
const isBaseProfileRoute = computed(() => route.path === "/profile" || route.path === "/profile/");

const canSubmit = computed(() => {
    if (!isAuthenticated.value || !user.value) {
        return false;
    }

    const email = form.email.trim();
    const phone = form.phone.trim();
    const name = form.name.trim();
    if (email.length === 0 && phone.length === 0) {
        return false;
    }

    return (
        name !== (user.value.name ?? "") ||
        email !== (user.value.email ?? "") ||
        phone !== (user.value.phone ?? "")
    );
});

async function loadProfilePage() {
    pageLoading.value = true;

    if (!isAuthenticated.value) {
        try {
            await me();
        } catch {
            // handled by auth state
        }
    }

    if (!isAuthenticated.value) {
        pageLoading.value = false;
        await navigateTo(`/login?next=${encodeURIComponent(route.fullPath)}`);
        return;
    }

    fillFormFromUser();
    pageLoading.value = false;
}

onMounted(async () => {
    if (!isBaseProfileRoute.value) {
        return;
    }

    await loadProfilePage();
});

watch(isBaseProfileRoute, async (value) => {
    if (!value) {
        return;
    }

    await loadProfilePage();
});

watch([isAuthenticated, isBaseProfileRoute], async ([isAuth, isBase]) => {
    if (!isBase) {
        return;
    }
    if (!pageLoading.value && !isAuth) {
        await navigateTo("/login");
    }
});

function fillFormFromUser() {
    form.name = user.value?.name ?? "";
    form.email = user.value?.email ?? "";
    form.phone = user.value?.phone ?? "";
}

async function submit() {
    if (!canSubmit.value) {
        return;
    }

    const email = form.email.trim();
    const phone = form.phone.trim();
    const name = form.name.trim();

    saving.value = true;
    error.value = null;
    success.value = null;
    try {
        await updateProfile({
            name: name.length > 0 ? name : null,
            email: email.length > 0 ? email : null,
            phone: phone.length > 0 ? phone : null,
        });
        fillFormFromUser();
        success.value = "Профиль обновлен.";
    } catch (err: any) {
        error.value = err?.data?.statusMessage ?? "Не удалось обновить профиль.";
    } finally {
        saving.value = false;
    }
}

function getStoredContact(channel: VerificationChannel): string {
    if (channel === "email") {
        return (user.value?.email ?? "").trim();
    }
    return (user.value?.phone ?? "").trim();
}

function getFormContact(channel: VerificationChannel): string {
    return (channel === "email" ? form.email : form.phone).trim();
}

function isChannelDirty(channel: VerificationChannel): boolean {
    return getFormContact(channel) !== getStoredContact(channel);
}

function isChannelVerified(channel: VerificationChannel): boolean {
    if (channel === "email") {
        return Boolean(user.value?.emailVerified);
    }
    return Boolean(user.value?.phoneVerified);
}

function canGoToVerification(channel: VerificationChannel): boolean {
    const hasContact = getStoredContact(channel).length > 0;
    return hasContact && !isChannelVerified(channel) && !isChannelDirty(channel);
}
</script>
