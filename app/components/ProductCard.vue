<template>
    <article
        @click="onClick"
        class="h-137.5 px-12.5 pb-8 bg-bg-1 rounded-3xl grid grid-rows-[1fr] cursor-pointer">
        <div class="flex items-center justify-center">
            <NuxtImg
                class="object-cover"
                :src="'/images/' + product.variants[selectedVariantId]?.images[0]"
                alt="product-image" />
        </div>

        <div class="flex justify-between mb-7 text-[15px] min-w-64">
            <h2>
                {{ product.category }}<br />{{ product.series }}
                {{ product.variants[selectedVariantId]?.name }}
            </h2>
            <p>{{ product.variants[selectedVariantId]?.price.rub }}₽</p>
        </div>

        <div class="w-full flex gap-1.25 justify-center">
            <button
                v-for="color in new Set(product.variants.map((variant) => variant.color))"
                :key="color"
                class="size-5 rounded-full border border-neutral-300"
                @click="() => selectVariantFromColor(color)"
                :style="{ background: color }"></button>
        </div>
    </article>
</template>

<script setup lang="ts">
const { $config } = useNuxtApp();

const { product } = defineProps<{ product: Product }>();
const router = useRouter();

const selectedVariantId = ref(0);

function selectVariantFromColor(color: string) {
    for (const [index, variant] of product.variants.entries()) {
        if (variant.color === color) {
            selectedVariantId.value = index;
            return;
        }
    }

    throw new Error(`Failed to find color (${color}) in product ${product.series}.`);
}

function onClick() {
    router.push(`/catalog/${0}`);
}
</script>
