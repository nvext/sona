<template>
    <UPage>
        <div class="bg-bg w-dvw h-dvh overflow-hidden grid grid-rows-[120px_1fr] relative">
            <AppHeader />
            <div class="h-full overflow-auto">
                <NuxtPage />
                <AppFooter />
            </div>
        </div>
    </UPage>
</template>

<script setup lang="ts">
const { me } = useAuth();

onMounted(() => {
    me().catch(() => null);
});
</script>
