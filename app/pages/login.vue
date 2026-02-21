<template>
    <section class="px-6 lg:px-25 py-12 min-h-[calc(100dvh-120px)] flex items-center justify-center">
        <div class="w-full max-w-6xl grid gap-6 lg:grid-cols-[1fr_22rem]">
            <div class="bg-bg-1 rounded-3xl p-8 lg:p-10 border border-dark-bg/10">
                <h1 class="text-5xl mb-8">Вход</h1>

                <div class="flex gap-4 mb-6">
                    <button
                        type="button"
                        class="px-4 py-2 rounded-full border text-sm cursor-pointer"
                        :class="mode === 'login' ? 'bg-dark-bg text-fg border-dark-bg' : 'border-dark-bg/20'"
                        @click="mode = 'login'">
                        Вход
                    </button>
                    <button
                        type="button"
                        class="px-4 py-2 rounded-full border text-sm cursor-pointer"
                        :class="mode === 'register' ? 'bg-dark-bg text-fg border-dark-bg' : 'border-dark-bg/20'"
                        @click="mode = 'register'">
                        Регистрация
                    </button>
                </div>

                <form class="space-y-4" @submit.prevent="submit">
                    <div>
                        <label class="block text-sm mb-1">Email или телефон</label>
                        <input
                            v-model="identifier"
                            type="text"
                            class="w-full border border-dark-bg/20 rounded-xl px-4 py-3 bg-bg"
                            placeholder="name@example.com" />
                    </div>
                    <div>
                        <label class="block text-sm mb-1">Пароль</label>
                        <input
                            v-model="password"
                            type="password"
                            class="w-full border border-dark-bg/20 rounded-xl px-4 py-3 bg-bg"
                            placeholder="•••••••" />
                    </div>

                    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

                    <button
                        type="submit"
                        class="text-xl py-4 px-10 text-fg bg-dark-bg rounded-[100px] cursor-pointer disabled:opacity-50"
                        :disabled="loading">
                        {{ mode === 'login' ? 'Войти' : 'Создать аккаунт' }}
                    </button>
                </form>
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
const { login, register, me, isAuthenticated } = useAuth();

const mode = ref<"login" | "register">("login");
const identifier = ref("");
const password = ref("");
const loading = ref(false);
const error = ref<string | null>(null);

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
    const value = identifier.value.trim();
    if (!value || !password.value) {
        error.value = "Введите логин и пароль.";
        return;
    }

    const isEmail = value.includes("@");
    const payload = isEmail
        ? { email: value, password: password.value }
        : { phone: value, password: password.value };

    loading.value = true;
    try {
        if (mode.value === "login") {
            await login(payload);
        } else {
            await register(payload);
        }
        await me();
        await router.push(nextUrl.value);
    } catch (err: any) {
        error.value = err?.data?.statusMessage ?? "Ошибка авторизации.";
    } finally {
        loading.value = false;
    }
}
</script>
