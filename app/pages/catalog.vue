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
                <div class="h-30 rounded-3xl bg-dark-bg text-fg flex items-center justify-center p-5">
                    Тут менюшка с выбором
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
        <ProductCard
            v-for="product in products"
            v-bind="product"
            class="flex-1" />
    </div>
</template>

<script setup lang="ts">
import type { ProductCard } from "#components";

const products: InstanceType<typeof ProductCard>["$props"][] = [
    {
        category: "Акустическая панель Sona",
        nm: "Basic+Frame Black",
        price: {
            rub: 3000,
        },
        variants: [
            { img: "/panel-exmpl-0.png", color: "#FFFFFF" },
            { img: "/panel-exmpl-0.png", color: "#000000" },
            { img: "/panel-exmpl-0.png", color: "#28282A" },
            { img: "/panel-exmpl-0.png", color: "#545454" },
            { img: "/panel-exmpl-0.png", color: "#AFAFAF" },
            { img: "/panel-exmpl-0.png", color: "#C9BFAE" },
            { img: "/panel-exmpl-0.png", color: "#917E6C" },
            { img: "/panel-exmpl-0.png", color: "#564B41" },
        ],
    },
    {
        category: "Акустическая панель Sona",
        nm: "Lite+Frame Black",
        price: {
            rub: 3000,
        },
        variants: [
            { img: "/panel-exmpl-1.png", color: "#FFFFFF" },
            { img: "/panel-exmpl-1.png", color: "#000000" },
            { img: "/panel-exmpl-1.png", color: "#28282A" },
            { img: "/panel-exmpl-1.png", color: "#545454" },
            { img: "/panel-exmpl-1.png", color: "#AFAFAF" },
            { img: "/panel-exmpl-1.png", color: "#C9BFAE" },
            { img: "/panel-exmpl-1.png", color: "#917E6C" },
            { img: "/panel-exmpl-1.png", color: "#564B41" },
        ],
    },
    {
        category: "Акустическая панель Sona",
        nm: "Classic Black",
        price: {
            rub: 3000,
        },
        variants: [
            { img: "/panel-exmpl-2.png", color: "#FFFFFF" },
            { img: "/panel-exmpl-2.png", color: "#000000" },
            { img: "/panel-exmpl-2.png", color: "#28282A" },
            { img: "/panel-exmpl-2.png", color: "#545454" },
            { img: "/panel-exmpl-2.png", color: "#AFAFAF" },
            { img: "/panel-exmpl-2.png", color: "#C9BFAE" },
            { img: "/panel-exmpl-2.png", color: "#917E6C" },
            { img: "/panel-exmpl-2.png", color: "#564B41" },
        ],
    },
    {
        category: "Акустическая панель Sona",
        nm: "Basic+Frame Black",
        price: {
            rub: 3000,
        },
        variants: [
            { img: "/panel-exmpl-0.png", color: "#FFFFFF" },
            { img: "/panel-exmpl-0.png", color: "#000000" },
            { img: "/panel-exmpl-0.png", color: "#28282A" },
            { img: "/panel-exmpl-0.png", color: "#545454" },
            { img: "/panel-exmpl-0.png", color: "#AFAFAF" },
            { img: "/panel-exmpl-0.png", color: "#C9BFAE" },
            { img: "/panel-exmpl-0.png", color: "#917E6C" },
            { img: "/panel-exmpl-0.png", color: "#564B41" },
        ],
    },
    {
        category: "Акустическая панель Sona",
        nm: "Lite+Frame Black",
        price: {
            rub: 3000,
        },
        variants: [
            { img: "/panel-exmpl-1.png", color: "#FFFFFF" },
            { img: "/panel-exmpl-1.png", color: "#000000" },
            { img: "/panel-exmpl-1.png", color: "#28282A" },
            { img: "/panel-exmpl-1.png", color: "#545454" },
            { img: "/panel-exmpl-1.png", color: "#AFAFAF" },
            { img: "/panel-exmpl-1.png", color: "#C9BFAE" },
            { img: "/panel-exmpl-1.png", color: "#917E6C" },
            { img: "/panel-exmpl-1.png", color: "#564B41" },
        ],
    },
    {
        category: "Акустическая панель Sona",
        nm: "Classic Black",
        price: {
            rub: 3000,
        },
        variants: [
            { img: "/panel-exmpl-2.png", color: "#FFFFFF" },
            { img: "/panel-exmpl-2.png", color: "#000000" },
            { img: "/panel-exmpl-2.png", color: "#28282A" },
            { img: "/panel-exmpl-2.png", color: "#545454" },
            { img: "/panel-exmpl-2.png", color: "#AFAFAF" },
            { img: "/panel-exmpl-2.png", color: "#C9BFAE" },
            { img: "/panel-exmpl-2.png", color: "#917E6C" },
            { img: "/panel-exmpl-2.png", color: "#564B41" },
        ],
    },
    {
        category: "Акустическая панель Sona",
        nm: "Basic+Frame Black",
        price: {
            rub: 3000,
        },
        variants: [
            { img: "/panel-exmpl-0.png", color: "#FFFFFF" },
            { img: "/panel-exmpl-0.png", color: "#000000" },
            { img: "/panel-exmpl-0.png", color: "#28282A" },
            { img: "/panel-exmpl-0.png", color: "#545454" },
            { img: "/panel-exmpl-0.png", color: "#AFAFAF" },
            { img: "/panel-exmpl-0.png", color: "#C9BFAE" },
            { img: "/panel-exmpl-0.png", color: "#917E6C" },
            { img: "/panel-exmpl-0.png", color: "#564B41" },
        ],
    },
    {
        category: "Акустическая панель Sona",
        nm: "Lite+Frame Black",
        price: {
            rub: 3000,
        },
        variants: [
            { img: "/panel-exmpl-1.png", color: "#FFFFFF" },
            { img: "/panel-exmpl-1.png", color: "#000000" },
            { img: "/panel-exmpl-1.png", color: "#28282A" },
            { img: "/panel-exmpl-1.png", color: "#545454" },
            { img: "/panel-exmpl-1.png", color: "#AFAFAF" },
            { img: "/panel-exmpl-1.png", color: "#C9BFAE" },
            { img: "/panel-exmpl-1.png", color: "#917E6C" },
            { img: "/panel-exmpl-1.png", color: "#564B41" },
        ],
    },
    {
        category: "Акустическая панель Sona",
        nm: "Classic Black",
        price: {
            rub: 3000,
        },
        variants: [
            { img: "/panel-exmpl-2.png", color: "#FFFFFF" },
            { img: "/panel-exmpl-2.png", color: "#000000" },
            { img: "/panel-exmpl-2.png", color: "#28282A" },
            { img: "/panel-exmpl-2.png", color: "#545454" },
            { img: "/panel-exmpl-2.png", color: "#AFAFAF" },
            { img: "/panel-exmpl-2.png", color: "#C9BFAE" },
            { img: "/panel-exmpl-2.png", color: "#917E6C" },
            { img: "/panel-exmpl-2.png", color: "#564B41" },
        ],
    },
    {
        category: "Акустическая панель Sona",
        nm: "Basic+Frame Black",
        price: {
            rub: 3000,
        },
        variants: [
            { img: "/panel-exmpl-0.png", color: "#FFFFFF" },
            { img: "/panel-exmpl-0.png", color: "#000000" },
            { img: "/panel-exmpl-0.png", color: "#28282A" },
            { img: "/panel-exmpl-0.png", color: "#545454" },
            { img: "/panel-exmpl-0.png", color: "#AFAFAF" },
            { img: "/panel-exmpl-0.png", color: "#C9BFAE" },
            { img: "/panel-exmpl-0.png", color: "#917E6C" },
            { img: "/panel-exmpl-0.png", color: "#564B41" },
        ],
    },
    {
        category: "Акустическая панель Sona",
        nm: "Lite+Frame Black",
        price: {
            rub: 3000,
        },
        variants: [
            { img: "/panel-exmpl-1.png", color: "#FFFFFF" },
            { img: "/panel-exmpl-1.png", color: "#000000" },
            { img: "/panel-exmpl-1.png", color: "#28282A" },
            { img: "/panel-exmpl-1.png", color: "#545454" },
            { img: "/panel-exmpl-1.png", color: "#AFAFAF" },
            { img: "/panel-exmpl-1.png", color: "#C9BFAE" },
            { img: "/panel-exmpl-1.png", color: "#917E6C" },
            { img: "/panel-exmpl-1.png", color: "#564B41" },
        ],
    },
    {
        category: "Акустическая панель Sona",
        nm: "Classic Black",
        price: {
            rub: 3000,
        },
        variants: [
            { img: "/panel-exmpl-2.png", color: "#FFFFFF" },
            { img: "/panel-exmpl-2.png", color: "#000000" },
            { img: "/panel-exmpl-2.png", color: "#28282A" },
            { img: "/panel-exmpl-2.png", color: "#545454" },
            { img: "/panel-exmpl-2.png", color: "#AFAFAF" },
            { img: "/panel-exmpl-2.png", color: "#C9BFAE" },
            { img: "/panel-exmpl-2.png", color: "#917E6C" },
            { img: "/panel-exmpl-2.png", color: "#564B41" },
        ],
    },
    {
        category: "Акустическая панель Sona",
        nm: "Basic+Frame Black",
        price: {
            rub: 3000,
        },
        variants: [
            { img: "/panel-exmpl-0.png", color: "#FFFFFF" },
            { img: "/panel-exmpl-0.png", color: "#000000" },
            { img: "/panel-exmpl-0.png", color: "#28282A" },
            { img: "/panel-exmpl-0.png", color: "#545454" },
            { img: "/panel-exmpl-0.png", color: "#AFAFAF" },
            { img: "/panel-exmpl-0.png", color: "#C9BFAE" },
            { img: "/panel-exmpl-0.png", color: "#917E6C" },
            { img: "/panel-exmpl-0.png", color: "#564B41" },
        ],
    },
    {
        category: "Акустическая панель Sona",
        nm: "Lite+Frame Black",
        price: {
            rub: 3000,
        },
        variants: [
            { img: "/panel-exmpl-1.png", color: "#FFFFFF" },
            { img: "/panel-exmpl-1.png", color: "#000000" },
            { img: "/panel-exmpl-1.png", color: "#28282A" },
            { img: "/panel-exmpl-1.png", color: "#545454" },
            { img: "/panel-exmpl-1.png", color: "#AFAFAF" },
            { img: "/panel-exmpl-1.png", color: "#C9BFAE" },
            { img: "/panel-exmpl-1.png", color: "#917E6C" },
            { img: "/panel-exmpl-1.png", color: "#564B41" },
        ],
    },
    {
        category: "Акустическая панель Sona",
        nm: "Classic Black",
        price: {
            rub: 3000,
        },
        variants: [
            { img: "/panel-exmpl-2.png", color: "#FFFFFF" },
            { img: "/panel-exmpl-2.png", color: "#000000" },
            { img: "/panel-exmpl-2.png", color: "#28282A" },
            { img: "/panel-exmpl-2.png", color: "#545454" },
            { img: "/panel-exmpl-2.png", color: "#AFAFAF" },
            { img: "/panel-exmpl-2.png", color: "#C9BFAE" },
            { img: "/panel-exmpl-2.png", color: "#917E6C" },
            { img: "/panel-exmpl-2.png", color: "#564B41" },
        ],
    },
    {
        category: "Акустическая панель Sona",
        nm: "Basic+Frame Black",
        price: {
            rub: 3000,
        },
        variants: [
            { img: "/panel-exmpl-0.png", color: "#FFFFFF" },
            { img: "/panel-exmpl-0.png", color: "#000000" },
            { img: "/panel-exmpl-0.png", color: "#28282A" },
            { img: "/panel-exmpl-0.png", color: "#545454" },
            { img: "/panel-exmpl-0.png", color: "#AFAFAF" },
            { img: "/panel-exmpl-0.png", color: "#C9BFAE" },
            { img: "/panel-exmpl-0.png", color: "#917E6C" },
            { img: "/panel-exmpl-0.png", color: "#564B41" },
        ],
    },
    {
        category: "Акустическая панель Sona",
        nm: "Lite+Frame Black",
        price: {
            rub: 3000,
        },
        variants: [
            { img: "/panel-exmpl-1.png", color: "#FFFFFF" },
            { img: "/panel-exmpl-1.png", color: "#000000" },
            { img: "/panel-exmpl-1.png", color: "#28282A" },
            { img: "/panel-exmpl-1.png", color: "#545454" },
            { img: "/panel-exmpl-1.png", color: "#AFAFAF" },
            { img: "/panel-exmpl-1.png", color: "#C9BFAE" },
            { img: "/panel-exmpl-1.png", color: "#917E6C" },
            { img: "/panel-exmpl-1.png", color: "#564B41" },
        ],
    },
    {
        category: "Акустическая панель Sona",
        nm: "Classic Black",
        price: {
            rub: 3000,
        },
        variants: [
            { img: "/panel-exmpl-2.png", color: "#FFFFFF" },
            { img: "/panel-exmpl-2.png", color: "#000000" },
            { img: "/panel-exmpl-2.png", color: "#28282A" },
            { img: "/panel-exmpl-2.png", color: "#545454" },
            { img: "/panel-exmpl-2.png", color: "#AFAFAF" },
            { img: "/panel-exmpl-2.png", color: "#C9BFAE" },
            { img: "/panel-exmpl-2.png", color: "#917E6C" },
            { img: "/panel-exmpl-2.png", color: "#564B41" },
        ],
    },
];
</script>
