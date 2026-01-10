<template>
    <footer
        :class="[
            'h-168 px-25 pt-13 pb-8 bg-dark-bg text-fg text-[1.25rem]',
            'flex flex-col justify-between',
        ]">
        <div class="flex justify-between">
            <nav>
                <ul class="flex flex-col gap-8">
                    <li v-for="item in navItems">
                        <NuxtLink :to="item.to">{{ item.label }}</NuxtLink>
                    </li>
                </ul>
            </nav>

            <ul class="flex flex-col gap-8">
                <li v-for="item in legalItems">
                    <NuxtLink :to="item.to">{{ item.label }}</NuxtLink>
                </li>
            </ul>

            <ul class="flex flex-col gap-8">
                <li v-for="item in socialItems">
                    <NuxtLink :to="item.to">{{ item.label }}</NuxtLink>
                </li>
            </ul>
        </div>

        <div class="flex gap-5 items-end">
            <img class="w-1/2" src="/icons/footer-logo-0.svg" alt="">
            <img class="flex-1" src="/icons/footer-logo-1.svg" alt="">
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
