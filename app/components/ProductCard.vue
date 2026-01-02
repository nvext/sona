<template>
    <article class="h-137.5 px-12.5 pb-8 bg-bg-1 grid grid-rows-[1fr]">
        <div class="flex items-center justify-center">
            <img :src="$config.app.baseURL + variants[0]?.img" alt="product-image" />
        </div>

        <div class="flex justify-between mb-7 text-[15px] min-w-64">
            <h2>{{ category }}<br />{{ nm }}</h2>
            <p>{{ price.rub }}₽</p>
        </div>

        <div class="w-full flex gap-1.25 justify-center">
            <div
                v-for="variant in variants"
                class="size-5 rounded-full border border-neutral-300"
                :style="{ background: variant.color }"></div>
        </div>
    </article>
</template>

<script setup lang="ts">
const {$config} = useNuxtApp()

const { category, nm, price, variants } = defineProps<{
    category: string;
    nm: string;
    price: { rub: number };
    variants: {
        img: string;
        color: string;
    }[];
}>();
</script>
