<template>
    <section class="h-195 bg-bg-1"></section>

    <section class="px-25">
        <h2 class="text-5xl my-7">Акустические панели</h2>
        <div class="flex gap-5">
            <ProductCard
                v-for="product in products"
                v-bind="product"
                class="flex-1" />
        </div>
        <div class="h-full flex flex-row-reverse">
            <NuxtLink class="my-9 underline">Смотреть все</NuxtLink>
        </div>
    </section>

    <section class="bg-dark-bg text-fg px-25 relative">
        <img
            src="/tech-white.png"
            class="w-239.75 h-171.25 absolute z-0 right-25 bottom-0" />
        <div class="relative z-10 pb-152.5 pt-12.5">
            <h2 class="text-[4rem] mb-2.5">Технология создания</h2>
            <p class="max-w-240 font-thin text-xl mb-5">
                Выбор конфигурации / Создание каркаса / Укладка акустического
                ядра / Крепление мембраны / Обтяжка акустической тканью / Монтаж
                крепежа или платформы / Отделка дерева / Контроль качества /
                Упаковка / Доставка.
            </p>
            <button
                type="button"
                class="bg-bg text-dark-fg px-28 py-7 rounded-3xl text-2xl">
                Подробнее
            </button>
        </div>
    </section>

    <section class="bg-bg text-dark-fg px-25 relative flex justify-center">
        <img
            src="/panels-showcase-green.png"
            class="w-310 h-86.25 absolute z-0 bottom-0" />
        <div
            class="relative z-10 pb-95.5 pt-12.5 flex-1 flex flex-col items-center">
            <h2 class="text-[4rem] mb-2.5">Возможность кастомизации</h2>
            <p class="max-w-240 font-thin text-xl mb-5 text-center">
                Выберите готовую конфигурацию SONA или соберите панель под себя:
                меняйте габариты, форму, материалы, цветовую палитру тканей и
                отделку дерева. Соберём комплект под задачу и бюджет, согласуем
                макеты и запустим производство. Готовые вариации тоже можно
                настраивать.
            </p>
            <button
                type="button"
                class="bg-dark-bg text-fg px-28 py-7 rounded-3xl text-2xl">
                Подробнее
            </button>
        </div>
    </section>
</template>

<script setup lang="ts">
import { ProductCard } from "#components";

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
];
</script>
