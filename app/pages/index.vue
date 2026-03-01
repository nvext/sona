<template>
    <section class="relative h-[44dvh] min-h-[22rem] bg-bg-1 md:h-[60rem]">
        <video autoplay muted loop class="absolute bottom-0 z-0 h-full w-full object-cover">
            <source src="/images/hero.mp4" type="video/mp4" />
        </video>
    </section>

    <section class="px-6 lg:px-25">
        <h2 class="my-7 text-3xl md:text-4xl lg:text-5xl">Акустические панели</h2>
        <div class="overflow-x-auto hide-scrollbar pb-2">
            <div class="flex gap-5 min-w-max lg:min-w-0">
                <ProductCard
                    v-for="product in featuredProducts"
                    :key="product.cardId"
                    :product
                    class="w-[20rem] flex-none lg:w-auto lg:flex-1" />
            </div>
        </div>
        <div class="h-full flex flex-row-reverse">
            <NuxtLink to="/catalog" class="my-9 underline">Смотреть все</NuxtLink>
        </div>
    </section>

    <section class="relative bg-dark-bg px-6 text-fg lg:px-25">
        <NuxtImg
            src="images/tech-white.png"
            class="absolute right-0 bottom-0 z-0 hidden w-[58rem] max-w-[75vw] lg:block" />
        <div class="relative z-10 py-12 md:py-16 lg:pb-40 lg:pt-12.5">
            <h2 class="mb-3 text-3xl md:text-5xl lg:text-[4rem]">Технология создания</h2>
            <p class="mb-5 max-w-5xl text-base font-thin md:text-xl">
                Выбор конфигурации / Создание каркаса / Укладка акустического ядра / Крепление
                мембраны / Обтяжка акустической тканью / Монтаж крепежа или платформы / Отделка
                дерева / Контроль качества / Упаковка / Доставка.
            </p>
            <UButton
                type="button"
                color="neutral"
                variant="solid"
                class="px-8 py-4 text-base !bg-bg !text-dark-fg md:px-12 md:py-5 md:text-lg lg:px-28 lg:py-7 lg:text-2xl">
                Подробнее
            </UButton>
        </div>
    </section>

    <section class="bg-bg text-dark-fg overflow-hidden relative flex justify-center">
        <!-- <NuxtImg
            src="images/panels-showcase.mp4"
            class="w-full top-40 object-cover absolute z-0 bottom-0" /> -->
        <video autoplay muted loop class="absolute -bottom-20 z-0 w-full object-cover md:-bottom-40">
            <source src="/images/panels-showcase.mp4" type="video/mp4" />
        </video>
        <div class="relative z-10 flex flex-1 flex-col items-center px-6 py-12 md:py-16 lg:pb-95.5 lg:pt-12.5">
            <h2 class="mb-3 text-center text-3xl md:text-5xl lg:text-[4rem]">Возможность кастомизации</h2>
            <p class="mb-5 max-w-5xl text-center text-base font-thin md:text-xl">
                Выберите готовую конфигурацию SONA или соберите панель под себя: меняйте габариты,
                форму, материалы, цветовую палитру тканей и отделку дерева. Соберём комплект под
                задачу и бюджет, согласуем макеты и запустим производство. Готовые вариации тоже
                можно настраивать.
            </p>
            <UButton
                type="button"
                color="neutral"
                variant="solid"
                class="px-8 py-4 text-base !bg-dark-bg !text-fg md:px-12 md:py-5 md:text-lg lg:px-28 lg:py-7 lg:text-2xl">
                Подробнее
            </UButton>
        </div>
    </section>
</template>

<script setup lang="ts">
import type { CatalogCardItem, CatalogResponse } from "~/types/catalog";
const { apiFetch } = useApiClient();

const { data: response } = await useAsyncData("home-featured-catalog", () =>
    apiFetch<CatalogResponse>("/api/products/catalog", {
        query: { limit: 3 },
    }),
);

const featuredProducts = computed<CatalogCardItem[]>(() => response.value?.data ?? []);
</script>
