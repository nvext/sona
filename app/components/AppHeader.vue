<template>
    <header
        :class="[
            'h-30 w-dvw sticky top-0 left-0',
            'bg-dark-bg px-25 flex items-center justify-between',
            'text-fg text-[1.25rem]',
        ]">
        <img src="/logo.svg" alt="logo" />

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
