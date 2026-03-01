<template>
    <header
        :class="[
            'h-30 w-dvw sticky top-0 left-0 z-50 px-25 text-[1.25rem] grid grid-cols-3 items-center',
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

        <div class="justify-self-end flex items-center gap-2">
            <UButton
                v-if="isAuthenticated && user?.role === 'admin'"
                to="/admin/catalog"
                color="neutral"
                variant="soft"
                icon="i-lucide-shield"
                class="h-11 px-4">
                Admin
            </UButton>

            <NuxtLink
                to="/cart"
                class="relative size-11 rounded-full border border-current/25 flex items-center justify-center cursor-pointer hover:bg-current/10 transition-colors"
                aria-label="Корзина">
                <svg
                    class="size-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true">
                    <circle cx="9" cy="20" r="1"></circle>
                    <circle cx="17" cy="20" r="1"></circle>
                    <path d="M3 4h2l2.6 10.4a1 1 0 0 0 1 .76h8.7a1 1 0 0 0 .97-.77L21 7H7"></path>
                </svg>
                <span
                    v-if="cartCount > 0"
                    :class="[
                        'absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full text-[11px] leading-5 text-center border',
                        isMainPage
                            ? 'bg-dark-bg text-fg border-bg'
                            : 'bg-bg text-dark-fg border-dark-bg/20',
                    ]">
                    {{ cartCount }}
                </span>
            </NuxtLink>

            <div
                ref="profileMenuRef"
                class="relative">
                <button
                    v-if="isAuthenticated"
                    type="button"
                    class="size-11 rounded-full border border-current/25 flex items-center justify-center cursor-pointer hover:bg-current/10 transition-colors"
                    aria-label="Профиль"
                    @click="toggleProfileMenu">
                    <svg
                        class="size-6"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true">
                        <circle cx="12" cy="8" r="4"></circle>
                        <path d="M4 20a8 8 0 0 1 16 0"></path>
                    </svg>
                </button>

                <UButton
                    v-else
                    to="/login"
                    color="neutral"
                    variant="soft"
                    icon="i-lucide-log-in"
                    class="h-11 px-5">
                    Войти
                </UButton>

                <div
                    v-if="isAuthenticated && profileMenuOpen"
                    class="absolute right-0 top-12 z-[60] min-w-42 rounded-2xl border border-current/25 bg-bg text-dark-fg p-2 shadow-md">
                    <UButton
                        to="/profile"
                        block
                        color="neutral"
                        variant="ghost"
                        class="justify-start"
                        @click="closeProfileMenu">
                        Профиль
                    </UButton>
                    <div class="mt-1 pt-1 border-t border-dark-bg/10">
                        <UButton
                            block
                            color="error"
                            variant="soft"
                            icon="i-lucide-log-out"
                            :ui="{leadingIcon: 'size-4'}"
                            class="justify-center"
                            @click="handleLogout">
                            Выйти
                        </UButton>
                    </div>
                </div>
            </div>
        </div>
    </header>
</template>

<script setup lang="ts">
import IconsLogo from './icons/Logo.vue';

const route = useRoute();
const { count: cartCount } = useCart();
const { isAuthenticated, user, logout } = useAuth();
const profileMenuOpen = ref(false);
const profileMenuRef = useTemplateRef("profileMenuRef");

const isMainPage = computed(() => route.path === "/");

function toggleProfileMenu() {
    profileMenuOpen.value = !profileMenuOpen.value;
}

function closeProfileMenu() {
    profileMenuOpen.value = false;
}

async function handleLogout() {
    closeProfileMenu();
    await logout();
    if (route.path.startsWith("/profile")) {
        await navigateTo("/login");
    }
}

function onDocumentClick(event: MouseEvent) {
    if (!profileMenuOpen.value) {
        return;
    }

    const target = event.target as Node | null;
    if (!target) {
        return;
    }

    if (!profileMenuRef.value?.contains(target)) {
        closeProfileMenu();
    }
}

onMounted(() => {
    document.addEventListener("click", onDocumentClick);
});

onBeforeUnmount(() => {
    document.removeEventListener("click", onDocumentClick);
});

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
