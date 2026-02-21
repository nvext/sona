<template>
    <section class="px-25 py-10">
        <h1 class="text-5xl mb-8">Корзина</h1>

        <div v-if="!isAuthenticated" class="text-xl text-dark-fg-2">
            Войдите, чтобы увидеть корзину.
        </div>

        <div v-else-if="items.length === 0" class="text-xl text-dark-fg-2">
            Корзина пуста.
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

            <form class="bg-bg-1 rounded-3xl p-8 space-y-6" @submit.prevent="submitOrder">
                <h2 class="text-3xl">Оформление заказа</h2>

                <div class="grid grid-cols-2 gap-4">
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
