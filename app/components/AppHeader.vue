<template>
    <header
        :class="[
            'h-30 w-dvw sticky top-0 left-0 px-25 text-[1.25rem] grid grid-cols-3 items-center',
            isMainPage ? 'bg-white text-dark-fg' : 'bg-dark-bg text-fg',
        ]">
        <img
            :src="
                $config.app.baseURL +
                (isMainPage ? '/icons/logo.svg' : '/icons/logo-dark.svg')
            "
            alt="logo" />

        <nav class="justify-self-center">
            <ul class="flex gap-5">
                <li v-for="item in navItems" class="whitespace-nowrap">
                    <NuxtLink :to="item.to">{{ item.label }}</NuxtLink>
                </li>
            </ul>
        </nav>

        <NuxtLink class="justify-self-end">Корзина</NuxtLink>
    </header>
</template>

<script setup lang="ts">
const { $config } = useNuxtApp();

const route = useRoute();

const isMainPage = computed(() => route.path === "/");

type NavItem = {
    label: string;
    to: string;
};

const navItems: NavItem[] = [
    {
        label: "Главная",
        to: "/",
    },
    {
        label: "Товары",
        to: "/catalog",
    },
    {
        label: "О компании",
        to: "/",
    },
    {
        label: "Контакты",
        to: "/",
    },
];
</script>
