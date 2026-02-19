<template>
    <div class="w-full flex items-start justify-center gap-3.75 py-8.75">
        <div class="bg-bg-1 rounded-3xl px-6 py-4 min-w-88">
            <p class="text-sm mb-2">Цена</p>
            <USlider
                color="neutral"
                size="sm"
                :min="minPrice"
                :max="maxPrice"
                v-model="price"
                :ui="{
                    track: 'bg-bg-2 h-1',
                    thumb: 'ring-0 bg-dark-bg-1 size-2.5',
                    range: 'bg-dark-bg-1',
                }" />
            <div class="flex justify-end mt-2 text-sm">
                <p>{{ price[0] }} - {{ price[1] }} ₽</p>
            </div>
        </div>
    </div>

    <div class="grid gap-4 grid-cols-[repeat(auto-fit,minmax(25rem,1fr))] px-25 mb-15">
        <ProductCard
            v-for="product in filteredProducts"
            :key="product.cardId"
            :product />
    </div>
</template>

<script setup lang="ts">
import type { CatalogCardItem, CatalogResponse } from "~/types/catalog";

const { data: response } = await useAsyncData("catalog-page", () =>
    $fetch<CatalogResponse>("/api/products/catalog", {
        query: { limit: 100 },
    }),
);

const products = computed<CatalogCardItem[]>(() => response.value?.data ?? []);
const minPrice = computed(() =>
    products.value.length === 0 ? 0 : Math.min(...products.value.map((item) => item.minPrice)),
);
const maxPrice = computed(() =>
    products.value.length === 0 ? 0 : Math.max(...products.value.map((item) => item.minPrice)),
);
const price = ref<[number, number]>([0, 0]);

watch(
    () => [minPrice.value, maxPrice.value] as const,
    ([min, max]) => {
        price.value = [min, max];
    },
    { immediate: true },
);

const filteredProducts = computed(() =>
    products.value.filter(
        (item) => item.minPrice >= price.value[0] && item.minPrice <= price.value[1],
    ),
);
</script>
