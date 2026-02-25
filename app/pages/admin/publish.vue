<template>
    <section class="px-6 lg:px-25 py-10 space-y-6">
        <div class="flex items-center justify-between gap-3">
            <div>
                <h1 class="text-4xl">Публикация каталога</h1>
                <p class="text-dark-fg-2 text-sm">Черновик: {{ draftId ?? "не выбран" }}</p>
            </div>
            <UButton to="/admin/catalog" color="neutral" variant="ghost">К каталогу</UButton>
        </div>

        <div v-if="!draftId" class="rounded-2xl border border-dark-bg/10 p-6 text-dark-fg-2">
            Выберите или создайте черновик в разделе каталога.
        </div>

        <div v-else class="rounded-2xl border border-dark-bg/10 p-6 space-y-4">
            <div v-if="previewLoading" class="text-dark-fg-2">Загрузка preview...</div>
            <div v-else-if="!preview?.exists" class="text-dark-fg-2">Черновик не найден или уже опубликован.</div>
            <template v-else>
                <table class="w-full text-sm">
                    <thead>
                        <tr class="text-left border-b border-dark-bg/10">
                            <th class="py-2 pr-3">Сущность</th>
                            <th class="py-2 pr-3">Create</th>
                            <th class="py-2 pr-3">Update</th>
                            <th class="py-2 pr-3">Delete</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in summaryRows" :key="row.label" class="border-b border-dark-bg/5">
                            <td class="py-2 pr-3">{{ row.label }}</td>
                            <td class="py-2 pr-3">{{ row.create }}</td>
                            <td class="py-2 pr-3">{{ row.update }}</td>
                            <td class="py-2 pr-3">{{ row.delete }}</td>
                        </tr>
                    </tbody>
                </table>

                <p v-if="publishError" class="text-sm text-red-600">{{ publishError }}</p>
                <p v-if="publishSuccess" class="text-sm text-green-700">{{ publishSuccess }}</p>

                <div class="flex items-center gap-2">
                    <UButton color="neutral" variant="outline" @click="refreshPreview">Обновить preview</UButton>
                    <UButton color="primary" variant="solid" :loading="publishing" @click="openPublishModal">
                        Опубликовать
                    </UButton>
                </div>
            </template>
        </div>

        <div
            v-if="publishModalOpen"
            class="fixed inset-0 z-[100] bg-dark-bg/45 flex items-center justify-center p-4"
            @click.self="closePublishModal">
            <div class="w-full max-w-2xl rounded-2xl bg-bg border border-dark-bg/10 p-5 space-y-4">
                <h2 class="text-2xl">Подтвердите публикацию</h2>
                <p class="text-sm text-dark-fg-2">
                    Будут применены изменения текущего черновика в live-каталог.
                </p>
                <table class="w-full text-sm">
                    <thead>
                        <tr class="text-left border-b border-dark-bg/10">
                            <th class="py-2 pr-3">Сущность</th>
                            <th class="py-2 pr-3">Create</th>
                            <th class="py-2 pr-3">Update</th>
                            <th class="py-2 pr-3">Delete</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in summaryRows" :key="row.label" class="border-b border-dark-bg/5">
                            <td class="py-2 pr-3">{{ row.label }}</td>
                            <td class="py-2 pr-3">{{ row.create }}</td>
                            <td class="py-2 pr-3">{{ row.update }}</td>
                            <td class="py-2 pr-3">{{ row.delete }}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="flex items-center justify-end gap-2">
                    <UButton color="neutral" variant="ghost" @click="closePublishModal">Отмена</UButton>
                    <UButton color="primary" variant="solid" :loading="publishing" @click="publishDraft">
                        Да, опубликовать
                    </UButton>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "admin" });

const route = useRoute();
const { apiFetch } = useApiClient();
const { draftId, setDraftId } = useAdminCatalogDraft();

const draftIdFromQuery = computed(() => {
    const value = route.query.draftId;
    return typeof value === "string" && value.length > 0 ? value : null;
});
if (draftIdFromQuery.value) {
    setDraftId(draftIdFromQuery.value);
}

const publishing = ref(false);
const publishError = ref<string | null>(null);
const publishSuccess = ref<string | null>(null);
const publishModalOpen = ref(false);

const { data: previewData, pending: previewLoading, refresh: refreshPreview } = await useAsyncData(
    () => `admin-publish-preview-${draftId.value ?? "none"}`,
    () =>
        draftId.value
            ? apiFetch<{
                  exists: boolean;
                  summary: Record<string, { create: number; update: number; delete: number }>;
              }>("/api/admin/catalog/publish/preview", {
                  query: { draftId: draftId.value },
              })
            : Promise.resolve(null),
    { watch: [draftId] },
);

const preview = computed(() => previewData.value);
const summaryRows = computed(() => {
    if (!preview.value?.summary) return [];
    return [
        { label: "Карточки", ...preview.value.summary.productCards },
        { label: "Цвета", ...preview.value.summary.productColors },
        { label: "SKU", ...preview.value.summary.products },
        { label: "Файлы", ...preview.value.summary.files },
    ];
});

async function publishDraft() {
    if (!draftId.value) return;
    publishError.value = null;
    publishSuccess.value = null;
    publishing.value = true;
    try {
        await apiFetch("/api/admin/catalog/publish", {
            method: "POST",
            body: { draftId: draftId.value },
        });
        publishSuccess.value = "Черновик опубликован.";
        closePublishModal();
        await refreshPreview();
    } catch (err: any) {
        publishError.value = err?.data?.statusMessage ?? "Не удалось опубликовать черновик";
    } finally {
        publishing.value = false;
    }
}

function openPublishModal() {
    publishModalOpen.value = true;
}

function closePublishModal() {
    if (publishing.value) {
        return;
    }
    publishModalOpen.value = false;
}
</script>
