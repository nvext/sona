<template>
    <article
        @click="onClick"
        class="h-137.5 px-12.5 pb-8 bg-bg-1 rounded-3xl grid grid-rows-[1fr] cursor-pointer">
        <div class="flex items-center justify-center">
            <NuxtImg class="object-cover max-h-9/10" :src="previewImageUrl" alt="product-image" />
        </div>

        <div class="flex justify-between mb-7 text-[15px] min-w-64">
            <h2>
                {{ product.title }}
            </h2>
            <p>{{ product.minPrice }}₽</p>
        </div>

        <div class="flex gap-2">
            <span
                v-for="color in product.colors"
                :key="color.colorId"
                class="size-6 rounded-full border border-dark-bg/20"
                :style="{ backgroundColor: color.hex || '#fff' }">
            </span>
        </div>
    </article>
</template>

<script setup lang="ts">
import type { CatalogCardItem } from "~/types/catalog";

const { product } = defineProps<{ product: CatalogCardItem }>();
const router = useRouter();

const previewImageUrl = computed(() => {
    return (
        product.colors[0]?.images[0]?.url ??
        "/images/panel-exmpl-0.png"
    );
});

function onClick() {
    router.push(`/catalog/${product.cardId}`);
}
</script>
