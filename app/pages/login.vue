<template>
    <section class="px-25 py-12 max-w-160">
        <h1 class="text-5xl mb-8">Вход</h1>

        <div class="flex gap-4 mb-6">
            <button
                type="button"
                class="px-4 py-2 rounded-full border text-sm"
                :class="mode === 'login' ? 'bg-dark-bg text-fg border-dark-bg' : 'border-dark-bg/20'"
                @click="mode = 'login'">
                Вход
            </button>
            <button
                type="button"
                class="px-4 py-2 rounded-full border text-sm"
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
                    class="w-full border border-dark-bg/20 rounded-xl px-4 py-3 bg-bg-1"
                    placeholder="name@example.com" />
            </div>
            <div>
                <label class="block text-sm mb-1">Пароль</label>
                <input
                    v-model="password"
                    type="password"
                    class="w-full border border-dark-bg/20 rounded-xl px-4 py-3 bg-bg-1"
                    placeholder="•••••••" />
            </div>

            <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

            <button
                type="submit"
                class="text-xl py-4 px-10 text-fg bg-dark-bg rounded-[100px]"
                :disabled="loading">
                {{ mode === 'login' ? 'Войти' : 'Создать аккаунт' }}
            </button>
        </form>
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
