<template>
    <header
        :class="[
            'sticky top-0 left-0 z-50 flex h-22 w-full items-center px-4 text-base md:h-30 md:px-8 lg:px-16 xl:px-25 xl:text-[1.25rem]',
            isMainPage ? 'bg-white text-dark-fg' : 'bg-dark-bg text-fg',
        ]">
        <div class="flex h-full w-full items-center justify-between gap-4">
            <NuxtLink to="/" class="shrink-0">
                <UIcon
                    :name="IconsLogo"
                    alt="logo"
                    class="h-auto w-[8.5rem] md:w-[9.75rem]" />
            </NuxtLink>

            <nav class="hidden flex-1 justify-center md:flex">
                <ul class="flex flex-wrap items-center gap-4 lg:gap-5">
                    <li v-for="item in navItems" :key="item.label" class="whitespace-nowrap">
                        <NuxtLink :to="item.to">{{ item.label }}</NuxtLink>
                    </li>
                </ul>
            </nav>

            <div class="ml-auto flex items-center gap-2">
                <UButton
                    v-if="isAuthenticated && user?.role === 'admin'"
                    to="/admin/catalog"
                    color="neutral"
                    variant="soft"
                    icon="i-lucide-shield"
                    class="hidden h-11 px-4 md:inline-flex">
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
                    class="relative hidden md:block">
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

                <UButton
                    type="button"
                    color="neutral"
                    variant="soft"
                    :icon="mobileMenuOpen ? 'i-lucide-x' : 'i-lucide-menu'"
                    class="inline-flex h-11 w-11 md:hidden"
                    :ui="{ base: 'justify-center rounded-full', leadingIcon: 'size-5' }"
                    :aria-expanded="mobileMenuOpen"
                    aria-label="Открыть меню"
                    @click="toggleMobileMenu" />
            </div>
        </div>
    </header>

    <div
        v-if="mobileMenuOpen"
        class="fixed inset-0 z-40 bg-dark-fg/30 backdrop-blur-[2px] md:hidden"
        @click="closeMobileMenu" />

    <aside
        :class="[
            'fixed right-0 top-0 z-[60] flex h-dvh w-[min(24rem,100%)] flex-col border-l border-current/10 bg-bg text-dark-fg shadow-2xl transition-transform duration-300 md:hidden',
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full',
        ]">
        <div class="flex items-center justify-between border-b border-dark-bg/10 px-4 py-4">
            <span class="text-lg font-medium">Меню</span>
            <UButton
                type="button"
                color="neutral"
                variant="ghost"
                icon="i-lucide-x"
                class="h-10 w-10"
                :ui="{ base: 'justify-center rounded-full', leadingIcon: 'size-5' }"
                aria-label="Закрыть меню"
                @click="closeMobileMenu" />
        </div>

        <nav class="border-b border-dark-bg/10 px-4 py-5">
            <ul class="flex flex-col gap-2">
                <li v-for="item in navItems" :key="item.label">
                    <NuxtLink
                        :to="item.to"
                        class="block rounded-2xl px-4 py-3 hover:bg-bg-1"
                        @click="closeMobileMenu">
                        {{ item.label }}
                    </NuxtLink>
                </li>
            </ul>
        </nav>

        <div class="flex flex-1 flex-col gap-3 px-4 py-5">
            <UButton
                v-if="isAuthenticated && user?.role === 'admin'"
                to="/admin/catalog"
                color="neutral"
                variant="soft"
                icon="i-lucide-shield"
                class="justify-center"
                @click="closeMobileMenu">
                Admin
            </UButton>

            <UButton
                v-if="isAuthenticated"
                to="/profile"
                color="neutral"
                variant="outline"
                class="justify-center"
                @click="closeMobileMenu">
                Профиль
            </UButton>

            <UButton
                v-else
                to="/login"
                color="neutral"
                variant="solid"
                icon="i-lucide-log-in"
                class="justify-center !bg-dark-bg !text-fg"
                @click="closeMobileMenu">
                Войти
            </UButton>

            <UButton
                v-if="isAuthenticated"
                type="button"
                color="error"
                variant="soft"
                icon="i-lucide-log-out"
                class="justify-center"
                @click="handleLogoutFromMobile">
                Выйти
            </UButton>
        </div>
    </aside>
</template>

<script setup lang="ts">
import IconsLogo from './icons/Logo.vue';

const route = useRoute();
const { count: cartCount } = useCart();
const { isAuthenticated, user, logout } = useAuth();
const profileMenuOpen = ref(false);
const mobileMenuOpen = ref(false);
const profileMenuRef = useTemplateRef("profileMenuRef");

const isMainPage = computed(() => route.path === "/");

function toggleProfileMenu() {
    profileMenuOpen.value = !profileMenuOpen.value;
}

function closeProfileMenu() {
    profileMenuOpen.value = false;
}

function toggleMobileMenu() {
    mobileMenuOpen.value = !mobileMenuOpen.value;
}

function closeMobileMenu() {
    mobileMenuOpen.value = false;
}

async function handleLogout() {
    closeProfileMenu();
    await logout();
    if (route.path.startsWith("/profile")) {
        await navigateTo("/login");
    }
}

async function handleLogoutFromMobile() {
    closeMobileMenu();
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
    document.body.style.overflow = "";
});

watch(
    () => route.fullPath,
    () => {
        closeMobileMenu();
        closeProfileMenu();
    },
);

watch(mobileMenuOpen, (value) => {
    document.body.style.overflow = value ? "hidden" : "";
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
