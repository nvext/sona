<template>
    <div>
        <section class="px-25 pt-8.75 mb-20 flex gap-5" v-if="product">
            <div
                class="w-3/5 aspect-7/9 grid gap-3.5 grid-rows-[4.75fr_1fr] grid-cols-4 *:first:col-span-4">
                <div
                    v-for="image in currentImages"
                    :key="image.id"
                    class="size-full bg-bg-1 rounded-[5px] flex items-center justify-center">
                    <NuxtImg class="object-cover max-h-6/10" :src="image.url" />
                </div>
            </div>

            <div class="w-full">
                <h2 class="text-5xl">{{ product.card.title }} {{ currentColor?.name }}</h2>

                <div class="py-2.5 border-b border-dark-bg">
                    <p class="text-xl mb-2">Размер</p>
                    <div class="flex flex-wrap gap-2">
                        <button
                            v-for="size in availableSizes"
                            :key="size.key"
                            type="button"
                            class="px-4 py-1.5 rounded-full border text-sm transition-colors"
                            :class="selectedSizeKey === size.key ? 'bg-dark-bg text-fg border-dark-bg' : 'border-dark-bg/20'"
                            @click="selectedSizeKey = size.key">
                            {{ size.label }}
                        </button>
                    </div>
                </div>

                <div class="py-2.5 border-b border-dark-bg">
                    <p class="text-xl mb-2">Толщина</p>
                    <div class="flex flex-wrap gap-2">
                        <button
                            v-for="thickness in availableThicknesses"
                            :key="thickness"
                            type="button"
                            class="px-4 py-1.5 rounded-full border text-sm transition-colors"
                            :class="selectedThickness === thickness ? 'bg-dark-bg text-fg border-dark-bg' : 'border-dark-bg/20'"
                            @click="selectedThickness = thickness">
                            {{ thickness }} мм
                        </button>
                    </div>
                </div>

                <div class="py-2.5">
                    <ColorSelect v-model="selectedColorId" :colors="product.colors" :size="32" />
                </div>

                <div class="py-2.5 border-b border-dark-bg">
                    <h3 class="text-xl">Характеристики</h3>

                    <p class="text-[16px] font-thin">{{ product.card.description }}</p>
                </div>

                <div class="py-2.5 flex items-center gap-8.75">
                    <p class="text-5xl">{{ currentProduct?.price }} ₽</p>

                    <button
                        class="text-xl py-6.25 text-fg bg-dark-bg flex-1 rounded-[100px] relative disabled:opacity-50"
                        type="button"
                        :disabled="!currentProduct || !currentColor"
                        @click="handleAddToCart">
                        Добавить в корзину
                        <div
                            class="size-12.5 bg-bg absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full flex justify-center items-center">
                            <img class="object-cover h-2/5" src="/icons/arrow.svg" alt="" />
                        </div>
                    </button>
                </div>
            </div>
        </section>

        <section class="px-25 mb-20">
            <h2 class="text-3xl mb-12">Вам может понравится</h2>

            <div class="flex gap-5">
                <ProductCard v-for="item in relatedProducts" :key="item.cardId" :product="item" class="flex-1" />
            </div>
        </section>

        <section class="px-25 mb-20" v-if="product">
            <h2 class="text-5xl mb-5">О панели {{ product.card.title }}</h2>

            <p class="text-2xl font-thin">{{ product.card.description }}</p>
        </section>
    </div>
</template>

<script setup lang="ts">
import type { CatalogCardItem, CatalogResponse, ProductDetailsResponse } from "~/types/catalog";

const route = useRoute();
const cardId = computed(() => String(route.params.id ?? ""));

const { data: product } = await useAsyncData(
    () => `product-details-${cardId.value}`,
    () => $fetch<ProductDetailsResponse>(`/api/products/${cardId.value}`),
    { watch: [cardId] },
);

const { data: relatedCatalog } = await useAsyncData("related-catalog", () =>
    $fetch<CatalogResponse>("/api/products/catalog", {
        query: { limit: 3 },
    }),
);

const relatedProducts = computed<CatalogCardItem[]>(() => relatedCatalog.value?.data ?? []);

const selectedColorId = ref<string | null>(null);
const selectedSizeKey = ref<string | null>(null);
const selectedThickness = ref<number | null>(null);
const { addItem } = useCart();
const { isAuthenticated } = useAuth();

watch(
    () => product.value?.colors?.[0]?.id ?? null,
    (value) => {
        selectedColorId.value = value;
    },
    { immediate: true },
);

const currentColor = computed(() => {
    const id = selectedColorId.value;
    if (!id || !product.value) {
        return product.value?.colors[0] ?? null;
    }
    return product.value.colors.find((color) => color.id === id) ?? product.value.colors[0] ?? null;
});

const currentImages = computed(() => currentColor.value?.images ?? []);

const productsForColor = computed(() => {
    if (!product.value) {
        return [];
    }
    const selectedColor = currentColor.value;
    if (!selectedColor) {
        return product.value.products;
    }
    return product.value.products.filter((item) => item.productColorId === selectedColor.id);
});

const availableSizes = computed(() => {
    const seen = new Set<string>();
    const result: Array<{ key: string; label: string; width: number; height: number }> = [];
    for (const item of productsForColor.value) {
        const key = `${item.width}x${item.height}`;
        if (seen.has(key)) continue;
        seen.add(key);
        result.push({
            key,
            label: `${item.width}x${item.height} мм`,
            width: item.width,
            height: item.height,
        });
    }
    return result;
});

const availableThicknesses = computed(() => {
    const sizes = selectedSizeKey.value;
    const source = sizes
        ? productsForColor.value.filter((item) => `${item.width}x${item.height}` === sizes)
        : productsForColor.value;
    return Array.from(new Set(source.map((item) => item.thickness))).sort((a, b) => a - b);
});

watch(
    () => currentColor.value?.id ?? null,
    () => {
        const sizeOptions = availableSizes.value.map((item) => item.key);
        const thicknessOptions = availableThicknesses.value;

        if (!selectedSizeKey.value || !sizeOptions.includes(selectedSizeKey.value)) {
            selectedSizeKey.value = sizeOptions[0] ?? null;
        }

        if (
            selectedThickness.value === null ||
            !thicknessOptions.includes(selectedThickness.value)
        ) {
            selectedThickness.value = thicknessOptions[0] ?? null;
        }
    },
    { immediate: true },
);

watch(
    () => selectedSizeKey.value,
    () => {
        const thicknessOptions = availableThicknesses.value;
        if (
            selectedThickness.value === null ||
            !thicknessOptions.includes(selectedThickness.value)
        ) {
            selectedThickness.value = thicknessOptions[0] ?? null;
        }
    },
);

const currentProduct = computed(() => {
    if (!product.value) {
        return null;
    }
    const sizeKey = selectedSizeKey.value;
    const thickness = selectedThickness.value;
    let filtered = productsForColor.value;
    if (sizeKey) {
        filtered = filtered.filter((item) => `${item.width}x${item.height}` === sizeKey);
    }
    if (thickness !== null) {
        filtered = filtered.filter((item) => item.thickness === thickness);
    }
    return filtered[0] ?? productsForColor.value[0] ?? product.value.products[0] ?? null;
});

async function handleAddToCart() {
    if (!product.value || !currentProduct.value || !currentColor.value) {
        return;
    }
    if (!isAuthenticated.value) {
        await navigateTo(`/login?next=${encodeURIComponent(route.fullPath)}`);
        return;
    }
    const item = currentProduct.value;
    const color = currentColor.value;
    await addItem({
        productId: item.id,
        productColorId: color.id,
    });
}
</script>
