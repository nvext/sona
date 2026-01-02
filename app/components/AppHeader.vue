<template>
    <header
        :class="[
            'h-30 w-dvw sticky top-0 left-0 px-25 flex items-center justify-between text-[1.25rem]',
            isMainPage
                ? 'bg-white text-dark-fg'
                : 'bg-dark-bg text-fg',
        ]">
        <img :src="isMainPage ? '/logo.svg' : '/logo-dark.svg'" alt="logo" />

        <nav>
            <ul class="flex gap-5">
                <li v-for="item in navItems">
                    <NuxtLink :to="item.to">{{ item.label }}</NuxtLink>
                </li>
            </ul>
        </nav>

        <NuxtLink>Корзина</NuxtLink>
    </header>
</template>

<script setup lang="ts">
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
        to: "/",
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
