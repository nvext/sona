<template>
    <div
        :class="[
            '*:bg-bg-1 *:py-2.5 *:px-4.5 *:rounded-3xl *:flex **:[img]:w-3.25 **:[img]:mr-2',
            'w-full flex justify-center gap-3.75 py-8.75',
        ]">
        <button type="button">
            <img src="/icons/chevron-down.svg" alt="" />Тип
        </button>
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
