<template>
    <section class="px-6 lg:px-25 py-10 space-y-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
                <h1 class="text-4xl">Админка каталога</h1>
                <p class="text-dark-fg-2 text-sm">
                    Черновик: {{ draftId ?? "не выбран" }}
                </p>
            </div>
            <div class="flex items-center gap-2">
                <UButton
                    :to="`/admin/publish${draftId ? `?draftId=${draftId}` : ''}`"
                    color="primary"
                    variant="soft">
                    Publish
                </UButton>
                <UButton to="/admin/catalog/new" color="neutral" variant="solid" class="!bg-dark-bg !text-fg">
                    Создать карточку
                </UButton>
            </div>
        </div>

        <div class="grid gap-3 md:grid-cols-[1fr_12rem_auto]">
            <UInput v-model="query" placeholder="Поиск по названию или slug" color="neutral" />
            <USelect v-model="status" :items="statusOptions" color="neutral" />
            <UButton color="neutral" variant="outline" @click="refreshCards">Обновить</UButton>
        </div>

        <div class="rounded-2xl border border-dark-bg/10 overflow-hidden">
            <table class="w-full text-left text-sm">
                <thead class="bg-bg-1">
                    <tr>
                        <th class="px-4 py-3">Название</th>
                        <th class="px-4 py-3">Slug</th>
                        <th class="px-4 py-3">Тип</th>
                        <th class="px-4 py-3">Статус</th>
                        <th class="px-4 py-3">Черновик</th>
                        <th class="px-4 py-3" />
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="card in cards" :key="card.id" class="border-t border-dark-bg/10">
                        <td class="px-4 py-3">{{ card.title }}</td>
                        <td class="px-4 py-3 text-dark-fg-2">{{ card.slug }}</td>
                        <td class="px-4 py-3">{{ card.type }}</td>
                        <td class="px-4 py-3">
                            <UBadge :color="card.isActive ? 'success' : 'neutral'" variant="soft">
                                {{ card.isActive ? "active" : "inactive" }}
                            </UBadge>
                        </td>
                        <td class="px-4 py-3">
                            <UBadge :color="card.hasDraft ? 'warning' : 'neutral'" variant="subtle">
                                {{ card.hasDraft ? "есть" : "нет" }}
                            </UBadge>
                        </td>
                        <td class="px-4 py-3 text-right">
                            <UButton
                                :to="`/admin/catalog/${card.id}${draftId ? `?draftId=${draftId}` : ''}`"
                                color="neutral"
                                variant="ghost">
                                Открыть
                            </UButton>
                        </td>
                    </tr>
                    <tr v-if="cards.length === 0">
                        <td colspan="6" class="px-4 py-8 text-center text-dark-fg-2">
                            Карточки не найдены
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>
</template>

<script setup lang="ts">
import type { AdminCatalogCard } from "~/types/admin";

const { apiFetch } = useApiClient();
const route = useRoute();
const { draftId, setDraftId } = useAdminCatalogDraft();
definePageMeta({ middleware: "admin" });

const query = ref("");
const status = ref<"all" | "active" | "inactive">("all");
const statusOptions = [
    { label: "Все", value: "all" },
    { label: "Активные", value: "active" },
    { label: "Неактивные", value: "inactive" },
];

const draftIdFromQuery = computed(() => {
    const value = route.query.draftId;
    return typeof value === "string" && value.length > 0 ? value : null;
});
if (draftIdFromQuery.value) {
    setDraftId(draftIdFromQuery.value);
}

const { data, refresh: refreshCards } = await useAsyncData(
    () => `admin-catalog-cards-${query.value}-${status.value}-${draftId.value ?? "none"}`,
    () =>
        apiFetch<{ items: AdminCatalogCard[] }>("/api/admin/catalog/cards", {
            query: {
                query: query.value || undefined,
                status: status.value,
                draftId: draftId.value || undefined,
                limit: 200,
            },
        }),
    {
        watch: [query, status, draftId],
    },
);

const cards = computed(() => data.value?.items ?? []);
</script>
