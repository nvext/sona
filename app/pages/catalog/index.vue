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

    <div
        v-if="filteredProducts.length > 0"
        class="grid gap-4 grid-cols-[repeat(auto-fit,minmax(25rem,1fr))] px-25 mb-15">
        <ProductCard
            v-for="product in filteredProducts"
            :key="product.cardId"
            :product />
    </div>

    <div v-else class="px-6 lg:px-25 mb-15">
        <div class="max-w-4xl mx-auto bg-bg-1 rounded-3xl border border-dark-bg/10 p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
            <NuxtImg
                :src="products.length === 0 ? '/images/panel-exmpl-2.png' : '/images/panel-exmpl-0.png'"
                class="w-44 h-44 object-contain" />
            <div class="space-y-3 text-center md:text-left">
                <p class="text-3xl">
                    {{ products.length === 0 ? "Каталог пополняется" : "Ничего не найдено" }}
                </p>
                <p class="text-dark-fg-2">
                    {{
                        products.length === 0
                            ? "Скоро здесь появятся панели. Можно вернуться позже и посмотреть новинки."
                            : "Попробуйте ослабить фильтр по цене, чтобы увидеть больше доступных вариантов."
                    }}
                </p>
                <UButton
                    v-if="products.length > 0"
                    type="button"
                    color="neutral"
                    variant="solid"
                    class="inline-flex mt-2 px-6 py-3 !text-fg !bg-dark-bg"
                    @click="resetPriceFilter">
                    Сбросить фильтр
                </UButton>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { CatalogCardItem, CatalogResponse } from "~/types/catalog";
const { apiFetch } = useApiClient();

const { data: response } = await useAsyncData("catalog-page", () =>
    apiFetch<CatalogResponse>("/api/products/catalog", {
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

function resetPriceFilter() {
    price.value = [minPrice.value, maxPrice.value];
}
</script>
