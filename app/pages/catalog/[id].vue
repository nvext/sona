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

                <div class="py-2.5 border-b border-dark-bg flex justify-between">
                    <p class="text-xl mb-2">Цвет</p>
                    <ColorSelect v-model="selectedColorId" :colors="product.colors" :size="32" />
                </div>

                <div class="py-2.5 border-b border-dark-bg flex justify-between">
                    <p class="text-xl mb-2">Размер</p>
                    <div class="flex flex-wrap gap-2">
                        <UButton
                            v-for="size in availableSizes"
                            :key="size.key"
                            type="button"
                            color="neutral"
                            variant="ghost"
                            class="px-4 py-1.5 border text-sm !font-light transition-colors !ring-0 !ring-transparent focus-visible:!ring-0"
                            :class="
                                selectedSizeKey === size.key
                                    ? '!bg-dark-bg !text-fg !border-dark-bg'
                                    : '!bg-transparent !text-dark-fg-1 !border-dark-bg/20 hover:!bg-bg-1'
                            "
                            @click="selectedSizeKey = size.key">
                            {{ size.label }}
                        </UButton>
                    </div>
                </div>

                <div class="py-2.5 border-b border-dark-bg flex justify-between">
                    <p class="text-xl mb-2">Толщина</p>
                    <div class="flex flex-wrap gap-2">
                        <UButton
                            v-for="thickness in availableThicknesses"
                            :key="thickness"
                            type="button"
                            color="neutral"
                            variant="ghost"
                            class="px-4 py-1.5 border text-sm !font-light transition-colors !ring-0 !ring-transparent focus-visible:!ring-0"
                            :class="
                                selectedThickness === thickness
                                    ? '!bg-dark-bg !text-fg !border-dark-bg'
                                    : '!bg-transparent !text-dark-fg-1 !border-dark-bg/20 hover:!bg-bg-1'
                            "
                            @click="selectedThickness = thickness">
                            {{ thickness }}
                        </UButton>
                    </div>
                </div>

                <div class="py-2.5 flex justify-between">
                    <p class="text-xl mb-2">Количество</p>
                    <div class="flex flex-wrap items-center justify-end gap-2">
                        <UButton
                            v-for="quantity in quantityPresets"
                            :key="quantity"
                            type="button"
                            color="neutral"
                            variant="ghost"
                            :disabled="isApplyingQuantityPreset"
                            class="px-4 py-1.5 border text-sm !font-light transition-colors !ring-0 !ring-transparent focus-visible:!ring-0"
                            :class="
                                currentCartQuantity === quantity
                                    ? '!bg-dark-bg !text-fg !border-dark-bg'
                                    : '!bg-transparent !text-dark-fg-1 !border-dark-bg/20 hover:!bg-bg-1'
                            "
                            @click="applyPresetQuantity(quantity)">
                            {{ quantity }}
                        </UButton>
                    </div>
                </div>

                <div class="py-2.5 border-b border-dark-bg">
                    <h3 class="text-xl">Характеристики</h3>

                    <p class="text-[16px] font-thin">{{ product.card.description }}</p>
                </div>

                <div class="py-2.5 flex items-center gap-8.75">
                    <p class="text-5xl">{{ currentProduct?.price }} ₽</p>

                    <UButton
                        v-if="currentCartQuantity === 0"
                        type="button"
                        color="neutral"
                        variant="solid"
                        class="text-xl h-17.5 !text-fg !bg-dark-bg flex-1 relative !justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        :disabled="!currentProduct || !currentColor"
                        @click="handleAddToCart">
                        <span class="w-full text-center">Добавить в корзину</span>
                        <div
                            class="size-12.5 bg-bg absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full flex justify-center items-center">
                            <img class="object-cover h-2/5" src="/icons/arrow.svg" alt="" />
                        </div>
                    </UButton>

                    <div
                        v-else
                        class="bg-dark-bg text-fg flex-1 h-17.5
                         rounded-[100px] relative">
                        <UButton
                            type="button"
                            color="neutral"
                            variant="ghost"
                            class="absolute left-2.5 top-1/2 -translate-y-1/2 size-12.5 !rounded-full !min-w-0 !p-0 !border !border-dark-bg/15 !bg-bg !text-dark-fg flex items-center justify-center hover:!bg-bg-1"
                            @click="handleDecrementCurrent">
                            <UIcon name="i-lucide-minus" class="size-5" />
                        </UButton>
                        <div class="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-center">
                            <p class="text-xs opacity-80 uppercase tracking-wide">В корзине</p>
                            <p class="text-2xl leading-none">{{ currentCartQuantity }}</p>
                        </div>
                        <UButton
                            type="button"
                            color="neutral"
                            variant="ghost"
                            class="absolute right-2.5 top-1/2 -translate-y-1/2 size-12.5 !rounded-full !min-w-0 !p-0 !border !border-dark-bg/15 !bg-bg !text-dark-fg flex items-center justify-center hover:!bg-bg-1"
                            @click="handleIncrementCurrent">
                            <UIcon name="i-lucide-plus" class="size-5" />
                        </UButton>
                    </div>
                </div>
            </div>
        </section>

        <section class="px-6 lg:px-25 mb-20">
            <h2 class="text-3xl mb-12">Вам может понравится</h2>

            <div class="overflow-x-auto hide-scrollbar pb-2">
                <div class="flex gap-5 min-w-max lg:min-w-0">
                    <ProductCard
                        v-for="item in relatedProducts"
                        :key="item.cardId"
                        :product="item"
                        class="w-[20rem] flex-none lg:w-auto lg:flex-1" />
                </div>
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
const { apiFetch } = useApiClient();

const route = useRoute();
const cardId = computed(() => String(route.params.id ?? ""));

const { data: product } = await useAsyncData(
    () => `product-details-${cardId.value}`,
    () => apiFetch<ProductDetailsResponse>(`/api/products/${cardId.value}`),
    { watch: [cardId] },
);

const { data: relatedCatalog } = await useAsyncData("related-catalog", () =>
    apiFetch<CatalogResponse>("/api/products/catalog", {
        query: { limit: 3 },
    }),
);

const relatedProducts = computed<CatalogCardItem[]>(() => relatedCatalog.value?.data ?? []);

const selectedColorId = ref<string | null>(null);
const selectedSizeKey = ref<string | null>(null);
const selectedThickness = ref<number | null>(null);
const isApplyingQuantityPreset = ref(false);
const quantityPresets = [8, 12, 16] as const;
const { items, increment, decrement, addItem } = useCart();
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
            label: `${item.width} x ${item.height}`,
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

const currentCartItem = computed(() => {
    if (!currentProduct.value) {
        return null;
    }
    return (
        items.value.find(
            (item) =>
                item.productId === currentProduct.value?.id &&
                item.productColorId === currentProduct.value?.productColorId,
        ) ?? null
    );
});

const currentCartQuantity = computed(() => currentCartItem.value?.quantity ?? 0);

async function setCurrentProductQuantity(targetQuantity: number) {
    if (!currentProduct.value || !currentColor.value) {
        return;
    }

    const normalizedTarget = Math.max(1, Math.floor(targetQuantity));
    await addItem(
        {
            productId: currentProduct.value.id,
            productColorId: currentColor.value.id,
        },
        normalizedTarget,
    );
}

async function applyPresetQuantity(quantity: number) {
    if (!currentProduct.value || !currentColor.value) {
        return;
    }
    if (!isAuthenticated.value) {
        await navigateTo(`/login?next=${encodeURIComponent(route.fullPath)}`);
        return;
    }
    if (isApplyingQuantityPreset.value) {
        return;
    }

    isApplyingQuantityPreset.value = true;
    try {
        await setCurrentProductQuantity(quantity);
    } finally {
        isApplyingQuantityPreset.value = false;
    }
}

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
    }, 1);
}

async function handleIncrementCurrent() {
    if (!currentProduct.value || !currentColor.value) {
        return;
    }
    if (!isAuthenticated.value) {
        await navigateTo(`/login?next=${encodeURIComponent(route.fullPath)}`);
        return;
    }

    await increment(currentProduct.value.id, currentColor.value.id);
}

async function handleDecrementCurrent() {
    const cartItem = currentCartItem.value;
    if (!cartItem) {
        return;
    }
    if (!isAuthenticated.value) {
        await navigateTo(`/login?next=${encodeURIComponent(route.fullPath)}`);
        return;
    }

    await decrement(cartItem.id);
}
</script>
