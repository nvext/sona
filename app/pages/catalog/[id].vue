<template>
    <div>
        <section class="mb-20 flex flex-col gap-8 px-6 pt-6 lg:flex-row lg:gap-5 lg:px-25 lg:pt-8.75" v-if="product">
            <div
                class="grid aspect-[7/9] w-full gap-3 sm:grid-cols-2 lg:w-3/5 lg:grid-cols-4 lg:grid-rows-[4.75fr_1fr] lg:*:first:col-span-4">
                <div
                    v-for="image in currentImages"
                    :key="image.id"
                    class="size-full bg-bg-1 rounded-[5px] flex items-center justify-center">
                    <NuxtImg class="max-h-[60%] object-cover" :src="image.url" />
                </div>
            </div>

            <div class="w-full">
                <h2 class="text-3xl md:text-4xl lg:text-5xl">{{ product.card.title }} {{ currentColor?.name }}</h2>

                <div class="flex flex-col gap-3 border-b border-dark-bg py-3 md:flex-row md:items-start md:justify-between">
                    <p class="mb-1 text-lg md:mb-2 md:text-xl">Цвет</p>
                    <ColorSelect v-model="selectedColorId" :colors="product.colors" :size="32" />
                </div>

                <div class="flex flex-col gap-3 border-b border-dark-bg py-3 md:flex-row md:items-start md:justify-between">
                    <p class="mb-1 text-lg md:mb-2 md:text-xl">Размер</p>
                    <div class="flex flex-wrap gap-2 md:justify-end">
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

                <div class="flex flex-col gap-3 border-b border-dark-bg py-3 md:flex-row md:items-start md:justify-between">
                    <p class="mb-1 text-lg md:mb-2 md:text-xl">Толщина</p>
                    <div class="flex flex-wrap gap-2 md:justify-end">
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

                <div class="flex flex-col gap-3 py-3 md:flex-row md:items-start md:justify-between">
                    <p class="mb-1 text-lg md:mb-2 md:text-xl">Количество</p>
                    <div class="flex flex-wrap items-center gap-2 md:justify-end">
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
                    <h3 class="text-lg md:text-xl">Характеристики</h3>

                    <p class="text-[16px] font-thin">{{ product.card.description }}</p>
                </div>

                <div class="flex flex-col gap-4 py-4 md:flex-row md:items-center md:gap-6 lg:gap-8.75">
                    <p class="text-3xl md:text-4xl lg:text-5xl">{{ currentProduct?.price }} ₽</p>

                    <UButton
                        v-if="currentCartQuantity === 0"
                        type="button"
                        color="neutral"
                        variant="solid"
                        class="relative h-14 w-full text-base !justify-center !bg-dark-bg !text-fg disabled:cursor-not-allowed disabled:opacity-50 md:h-17.5 md:flex-1 md:text-xl"
                        :disabled="!currentProduct || !currentColor"
                        @click="handleAddToCart">
                        <span class="w-full text-center">Добавить в корзину</span>
                        <div
                            class="absolute right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-bg md:right-2.5 md:size-12.5">
                            <img class="object-cover h-2/5" src="/icons/arrow.svg" alt="" />
                        </div>
                    </UButton>

                    <div
                        v-else
                        class="relative h-14 w-full rounded-[100px] bg-dark-bg text-fg md:h-17.5 md:flex-1">
                        <UButton
                            type="button"
                            color="neutral"
                            variant="ghost"
                            class="absolute left-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center !rounded-full !border !border-dark-bg/15 !bg-bg !p-0 !text-dark-fg hover:!bg-bg-1 md:left-2.5 md:size-12.5"
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
                            class="absolute right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center !rounded-full !border !border-dark-bg/15 !bg-bg !p-0 !text-dark-fg hover:!bg-bg-1 md:right-2.5 md:size-12.5"
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
            <h2 class="mb-5 text-3xl md:text-4xl lg:text-5xl">О панели {{ product.card.title }}</h2>

            <p class="text-lg font-thin md:text-xl lg:text-2xl">{{ product.card.description }}</p>
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
