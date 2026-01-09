<template>
    <div
        :class="[
            '**:[button]:bg-bg-1 **:[button]:py-2.5 **:[button]:px-4.5 **:[button]:rounded-3xl **:[button]:flex **:[img]:w-3.25 **:[img]:mr-2',
            'w-full flex justify-center gap-3.75 py-8.75',
        ]">
        <Dropdown>
            <template #trigger="{ isOpen, toggle }">
                <button type="button" @click="toggle" :aria-expanded="isOpen">
                    <img src="/icons/chevron-down.svg" alt="" />Тип
                </button>
            </template>
            <template #content>
                <div
                    class="rounded-3xl bg-dark-bg text-fg flex items-center justify-center p-2">
                    <NuxtImg
                        class="size-30 rounded-2xl"
                        src="images/kostyak.png" />
                </div>
            </template>
        </Dropdown>
        <button type="button">
            <img src="/icons/chevron-down.svg" alt="" />Цвет
        </button>
        <button type="button">
            <img src="/icons/chevron-down.svg" alt="" />Размер
        </button>
        <button type="button">
            <img src="/icons/chevron-down.svg" alt="" />Цена
        </button>
    </div>

    <div class="flex flex-wrap px-25 gap-5 mb-15">
        <ProductCard v-for="product in products" :product class="flex-1" />
    </div>
</template>

<script setup lang="ts">
import products from "~~/public/content/products.json";
</script>
