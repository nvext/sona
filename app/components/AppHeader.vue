<template>
    <header
        :class="[
            'h-30 w-dvw sticky top-0 left-0 px-25 text-[1.25rem] grid grid-cols-3 items-center',
            isMainPage ? 'bg-white text-dark-fg' : 'bg-dark-bg text-fg',
        ]">
        <UIcon
            :name="IconsLogo"
            alt="logo" />

        <nav class="justify-self-center">
            <ul class="flex gap-5">
                <li v-for="item in navItems" class="whitespace-nowrap">
                    <NuxtLink :to="item.to">{{ item.label }}</NuxtLink>
                </li>
            </ul>
        </nav>

        <div class="justify-self-end flex items-center gap-4">
            <NuxtLink to="/cart">
                Корзина<span v-if="cartCount > 0"> ({{ cartCount }})</span>
            </NuxtLink>
            <NuxtLink v-if="isAuthenticated" to="/profile" class="underline">Профиль</NuxtLink>
            <button
                v-if="isAuthenticated"
                type="button"
                class="underline"
                @click="logout">
                Выйти
            </button>
            <NuxtLink v-else to="/login" class="underline">Войти</NuxtLink>
        </div>
    </header>
</template>

<script setup lang="ts">
import IconsLogo from './icons/Logo.vue';

const route = useRoute();
const { count: cartCount } = useCart();
const { isAuthenticated, logout } = useAuth();

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
