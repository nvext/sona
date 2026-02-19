<template>
    <section class="px-25 py-10">
        <h1 class="text-5xl mb-8">Корзина</h1>

        <div v-if="!isAuthenticated" class="text-xl text-dark-fg-2">
            Войдите, чтобы увидеть корзину.
        </div>

        <div v-else-if="items.length === 0" class="text-xl text-dark-fg-2">
            Корзина пуста.
        </div>

        <div v-else class="space-y-6">
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
                        class="size-8 rounded-full border border-dark-bg/20"
                        type="button"
                        :disabled="item.quantity <= 1"
                        :class="item.quantity <= 1 ? 'opacity-50' : ''"
                        @click="decrement(item.id)">
                        -
                    </button>
                    <span class="w-8 text-center">{{ item.quantity }}</span>
                    <button
                        class="size-8 rounded-full border border-dark-bg/20"
                        type="button"
                        @click="increment(item.productId, item.productColorId)">
                        +
                    </button>
                </div>

                <div class="text-xl w-28 text-right">{{ item.price * item.quantity }} ₽</div>

                <button class="text-sm underline" type="button" @click="removeItem(item.id)">
                    Удалить
                </button>
            </div>

            <div class="flex justify-end items-center gap-6">
                <p class="text-2xl">Итого: {{ total }} ₽</p>
                <button class="text-xl py-4 px-10 text-fg bg-dark-bg rounded-[100px]" type="button">
                    Оформить
                </button>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
const { items, total, removeItem, increment, decrement, refresh } = useCart();
const { isAuthenticated } = useAuth();

onMounted(() => {
    refresh();
});

watch(isAuthenticated, () => {
    refresh();
});
</script>
