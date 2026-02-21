<template>
    <section class="px-6 lg:px-25 py-12 min-h-[calc(100dvh-120px)] flex items-center justify-center">
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

                    <label class="block space-y-2">
                        <span class="text-sm">Email</span>
                        <input
                            v-model="form.email"
                            type="email"
                            class="w-full border border-dark-bg/20 rounded-xl px-4 py-3 bg-bg"
                            placeholder="name@example.com" />
                    </label>

                    <label class="block space-y-2">
                        <span class="text-sm">Телефон</span>
                        <input
                            v-model="form.phone"
                            type="tel"
                            class="w-full border border-dark-bg/20 rounded-xl px-4 py-3 bg-bg"
                            placeholder="+7..." />
                    </label>

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
                    <li>Изменения применяются сразу</li>
                </ul>
            </aside>
        </div>
    </section>
</template>

<script setup lang="ts">
const route = useRoute();
const { isAuthenticated, user, me, updateProfile } = useAuth();

const pageLoading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);
const form = reactive({
    name: "",
    email: "",
    phone: "",
});

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

onMounted(async () => {
    try {
        await me();
    } catch {
        // handled by auth state
    } finally {
        pageLoading.value = false;
    }

    if (!isAuthenticated.value) {
        await navigateTo(`/login?next=${encodeURIComponent(route.fullPath)}`);
        return;
    }

    fillFormFromUser();
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
</script>
