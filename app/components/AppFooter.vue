<template>
    <footer
        :class="[
            'bg-dark-bg px-6 py-10 text-base text-fg md:px-8 lg:px-16 xl:px-25 xl:pt-13 xl:pb-8 xl:text-[1.25rem]',
            'flex flex-col justify-between',
        ]">
        <div class="flex flex-col gap-10 md:grid md:grid-cols-3 md:gap-8">
            <nav>
                <ul class="flex flex-col gap-4 md:gap-8">
                    <li v-for="item in navItems" :key="item.label">
                        <NuxtLink :to="item.to">{{ item.label }}</NuxtLink>
                    </li>
                </ul>
            </nav>

            <ul class="flex flex-col gap-4 md:gap-8">
                <li v-for="item in legalItems" :key="item.label">
                    <NuxtLink :to="item.to">{{ item.label }}</NuxtLink>
                </li>
            </ul>

            <ul class="flex flex-col gap-4 md:gap-8">
                <li v-for="item in socialItems" :key="item.label">
                    <NuxtLink :to="item.to">{{ item.label }}</NuxtLink>
                </li>
            </ul>
        </div>

        <div class="mt-10 flex flex-col gap-4 md:flex-row md:items-end md:gap-5">
            <img class="w-full max-w-[16rem] md:w-1/2" src="/icons/footer-logo-0.svg" alt="">
            <img class="w-full max-w-[20rem] md:flex-1" src="/icons/footer-logo-1.svg" alt="">
        </div>
    </footer>
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

const legalItems: NavItem[] = [
    {
        label: "Договор оферты",
        to: "/",
    },
    {
        label: "Политика конфиденциальности",
        to: "/",
    },
];

const socialItems: NavItem[] = [
    {
        label: "Telegram",
        to: "/",
    },
    {
        label: "IG",
        to: "/",
    },
];
</script>
