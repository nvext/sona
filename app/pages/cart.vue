<template>
    <section class="px-6 lg:px-25 py-10">
        <div class="max-w-6xl mx-auto">
            <h1 class="text-5xl mb-8">Корзина</h1>

            <div v-if="!isAuthenticated" class="min-h-[55vh] flex items-center justify-center">
                <div class="w-full max-w-3xl bg-bg-1 rounded-3xl border border-dark-bg/10 p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
                    <div class="size-42 shrink-0 flex-none rounded-full border border-dark-bg/15 bg-bg flex items-center justify-center">
                        <svg
                            class="size-20 text-dark-fg -translate-x-px"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.8"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            aria-hidden="true">
                            <circle cx="9" cy="20" r="1"></circle>
                            <circle cx="17" cy="20" r="1"></circle>
                            <path d="M3 4h2l2.6 10.4a1 1 0 0 0 1 .76h8.7a1 1 0 0 0 .97-.77L21 7H7"></path>
                        </svg>
                    </div>
                    <div class="space-y-3 text-center md:text-left">
                        <p class="text-3xl">Корзина привязана к аккаунту</p>
                        <p class="text-dark-fg-2">
                            Войдите, чтобы увидеть сохраненные позиции и оформить заявку в пару кликов.
                        </p>
                        <NuxtLink
                            to="/login?next=/cart"
                            class="inline-flex mt-2 text-fg bg-dark-bg rounded-[100px] px-6 py-3 cursor-pointer">
                            Войти в аккаунт
                        </NuxtLink>
                    </div>
                </div>
            </div>

            <div v-else-if="items.length === 0" class="min-h-[55vh] flex items-center justify-center">
                <div class="w-full max-w-3xl bg-bg-1 rounded-3xl border border-dark-bg/10 p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
                    <div class="size-42 shrink-0 flex-none rounded-full border border-dark-bg/15 bg-bg flex items-center justify-center">
                        <svg
                            class="size-20 text-dark-fg -translate-x-px"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.8"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            aria-hidden="true">
                            <circle cx="9" cy="20" r="1"></circle>
                            <circle cx="17" cy="20" r="1"></circle>
                            <path d="M3 4h2l2.6 10.4a1 1 0 0 0 1 .76h8.7a1 1 0 0 0 .97-.77L21 7H7"></path>
                        </svg>
                    </div>
                    <div class="space-y-3 text-center md:text-left">
                        <p class="text-3xl">Корзина пока пустая</p>
                        <p class="text-dark-fg-2">
                            Добавьте панели из каталога, и здесь появится состав вашей заявки.
                        </p>
                        <NuxtLink
                            to="/catalog"
                            class="inline-flex mt-2 text-fg bg-dark-bg rounded-[100px] px-6 py-3 cursor-pointer">
                            Перейти в каталог
                        </NuxtLink>
                    </div>
                </div>
            </div>

            <div v-else class="space-y-10">
            <div
                v-for="item in items"
                :key="item.id"
                class="flex items-center gap-6 bg-bg-1 rounded-3xl p-6">
                <div class="w-28 h-28 bg-bg rounded-2xl flex items-center justify-center overflow-hidden">
                    <NuxtImg v-if="item.imageUrl" :src="item.imageUrl" class="object-cover max-h-full" />
                </div>

                <div class="flex-1">
                    <h2 class="text-2xl mb-1">{{ item.title }}</h2>
                    <p class="text-sm text-dark-fg-2">
                        {{ item.colorName }} • {{ item.width }}x{{ item.height }} мм • {{ item.thickness }} мм
                    </p>
                </div>

                <div class="flex items-center gap-3">
                    <button
                        class="size-8 rounded-full border border-dark-bg/20 cursor-pointer"
                        type="button"
                        :disabled="item.quantity <= 1"
                        :class="item.quantity <= 1 ? 'opacity-50 cursor-not-allowed' : ''"
                        @click="decrement(item.id)">
                        -
                    </button>
                    <span class="w-8 text-center">{{ item.quantity }}</span>
                    <button
                        class="size-8 rounded-full border border-dark-bg/20 cursor-pointer"
                        type="button"
                        @click="increment(item.productId, item.productColorId)">
                        +
                    </button>
                </div>

                <div class="text-xl w-28 text-right">{{ item.price * item.quantity }} ₽</div>

                <button class="text-sm underline cursor-pointer" type="button" @click="removeItem(item.id)">
                    Удалить
                </button>
            </div>

            <div class="grid gap-6 lg:grid-cols-[1fr_20rem] items-start">
                <form class="bg-bg-1 rounded-3xl p-8 space-y-6 border border-dark-bg/10" @submit.prevent="submitOrder">
                    <h2 class="text-3xl">Оформление заказа</h2>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label class="space-y-2">
                            <span class="text-sm">Имя</span>
                            <input
                                v-model="checkoutForm.name"
                                type="text"
                                class="w-full border border-dark-bg/20 rounded-xl px-4 py-3 bg-bg"
                                placeholder="Иван" />
                        </label>
                        <label class="space-y-2">
                            <span class="text-sm">Телефон</span>
                            <input
                                v-model="checkoutForm.phone"
                                type="tel"
                                class="w-full border border-dark-bg/20 rounded-xl px-4 py-3 bg-bg"
                                placeholder="+7..." />
                        </label>
                        <label class="space-y-2">
                            <span class="text-sm">Email</span>
                            <input
                                v-model="checkoutForm.email"
                                type="email"
                                class="w-full border border-dark-bg/20 rounded-xl px-4 py-3 bg-bg"
                                placeholder="name@example.com" />
                        </label>
                        <label class="space-y-2">
                            <span class="text-sm">Telegram</span>
                            <input
                                v-model="checkoutForm.telegram"
                                type="text"
                                class="w-full border border-dark-bg/20 rounded-xl px-4 py-3 bg-bg"
                                placeholder="@username" />
                        </label>
                    </div>

                    <div class="flex justify-end items-center gap-6">
                        <p class="text-2xl">Итого: {{ total }} ₽</p>
                        <button
                            class="text-xl py-4 px-10 text-fg bg-dark-bg rounded-[100px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            type="submit"
                            :disabled="checkoutLoading || !canSubmitCheckout">
                            {{ checkoutLoading ? "Отправка..." : "Оформить" }}
                        </button>
                    </div>

                    <p v-if="checkoutError" class="text-sm text-red-600">{{ checkoutError }}</p>
                    <p v-if="checkoutSuccess" class="text-sm text-green-700">{{ checkoutSuccess }}</p>
                </form>

                <aside class="bg-dark-bg text-fg rounded-3xl p-6 lg:sticky lg:top-34">
                    <p class="text-sm uppercase tracking-wide opacity-70">Заказ</p>
                    <p class="text-2xl mt-2 mb-4">Перед отправкой</p>
                    <ul class="space-y-2 text-sm opacity-90">
                        <li>Проверьте телефон для связи</li>
                        <li>Имя и email подставляются из профиля</li>
                        <li>После отправки менеджер пишет в Telegram</li>
                    </ul>
                </aside>
            </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
const { items, cartId, total, removeItem, increment, decrement, refresh } = useCart();
const { isAuthenticated, user, me } = useAuth();
const { apiFetch } = useApiClient();
const checkoutForm = reactive({
    name: "",
    phone: "",
    email: "",
    telegram: "",
});
const checkoutLoading = ref(false);
const checkoutError = ref<string | null>(null);
const checkoutSuccess = ref<string | null>(null);

const canSubmitCheckout = computed(() => {
    return Boolean(
        cartId.value &&
            checkoutForm.phone.trim().length > 0 &&
            items.value.length > 0,
    );
});

onMounted(() => {
    refresh();
    me().then(applyProfileDefaults).catch(() => null);
});

watch(isAuthenticated, () => {
    refresh();
    if (isAuthenticated.value) {
        me().then(applyProfileDefaults).catch(() => null);
    }
});

function applyProfileDefaults() {
    if (!user.value) {
        return;
    }
    if (!checkoutForm.name.trim() && user.value.name) {
        checkoutForm.name = user.value.name;
    }
    if (!checkoutForm.email.trim() && user.value.email) {
        checkoutForm.email = user.value.email;
    }
    if (!checkoutForm.phone.trim() && user.value.phone) {
        checkoutForm.phone = user.value.phone;
    }
}

function generateIdempotencyKey() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `idemp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

async function submitOrder() {
    checkoutError.value = null;
    checkoutSuccess.value = null;

    if (!canSubmitCheckout.value || !cartId.value) {
        checkoutError.value = "Заполните телефон и убедитесь, что корзина не пустая.";
        return;
    }

    checkoutLoading.value = true;
    try {
        const draft = await apiFetch<{
            orderRequest: { id: string };
        }>("/api/checkout/drafts", {
            method: "POST",
            body: {
                cartId: cartId.value,
                idempotencyKey: generateIdempotencyKey(),
            },
        });

        await apiFetch("/api/checkout/submit", {
            method: "POST",
            body: {
                orderRequestId: draft.orderRequest.id,
                contactName: checkoutForm.name.trim() || null,
                contactPhone: checkoutForm.phone.trim(),
                contactEmail: checkoutForm.email.trim() || null,
                contactTelegram: checkoutForm.telegram.trim() || null,
            },
        });

        checkoutSuccess.value = "Заявка отправлена. Менеджер свяжется с вами.";
    } catch (error: any) {
        checkoutError.value = error?.data?.statusMessage ?? "Не удалось отправить заявку.";
    } finally {
        checkoutLoading.value = false;
    }
}
</script>
