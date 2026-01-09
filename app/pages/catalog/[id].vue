<template>
    <div>
        <section class="px-25 pt-8.75 mb-20 flex gap-5">
            <div
                class="w-2/5 aspect-7/9 grid gap-3.5 grid-rows-[4.75fr_1fr] grid-cols-4 *:first:col-span-4">
                <div
                    v-for="i in 5"
                    class="size-full bg-bg-1 rounded-[5px] flex items-center justify-center">
                    <NuxtImg
                        class="object-cover max-h-6/10"
                        :src="'images/' + product?.variants[0]?.images[0]" />
                </div>
            </div>

            <div>
                <h2 class="text-5xl">{{ product?.category }}<br />{{ product?.series }} Black</h2>

                <div class="py-2.5 text-xl flex border-b border-dark-bg">
                    <p>Цвет</p>
                </div>

                <div class="py-2.5 text-xl flex border-b border-dark-bg">
                    <p>Размер</p>
                </div>

                <div class="py-2.5 text-xl flex border-b border-dark-bg">
                    <p>Толщина</p>
                </div>

                <div class="py-2.5 text-xl flex">
                    <p>Количество</p>
                </div>

                <div class="py-2.5 border-b border-dark-bg">
                    <h3 class="text-xl">Характеристики</h3>

                    <p class="text-[16px] font-thin">{{ product?.description }}</p>
                </div>

                <div class="py-2.5 flex items-center gap-8.75">
                    <p class="text-5xl">{{ product?.variants[0]?.price.rub }}Р</p>

                    <button
                        class="text-xl py-6.25 text-fg bg-dark-bg flex-1 rounded-[100px] relative"
                        type="button">
                        Оставить заявку
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
                <ProductCard v-for="product in products.slice(0, 3)" :product class="flex-1" />
            </div>
        </section>

        <section class="px-25 mb-20">
            <h2 class="text-5xl mb-5">О панелях {{ product?.series }}</h2>

            <p class="text-2xl font-thin">{{ product?.description }}</p>
        </section>
    </div>
</template>

<script setup lang="ts">
import products from "~~/public/content/products.json";
const product = products[0];
</script>
