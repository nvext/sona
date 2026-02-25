<template>
    <section class="px-6 lg:px-25 py-10">
        <div class="max-w-3xl space-y-6">
            <div>
                <h1 class="text-4xl">Новая карточка</h1>
                <p class="text-dark-fg-2 text-sm">
                    Будет сохранена в staging-черновик
                </p>
            </div>

            <UForm :state="form" class="space-y-4" @submit="submit">
                <UFormField label="Slug" name="slug" required>
                    <UInput v-model="form.slug" color="neutral" />
                </UFormField>
                <UFormField label="Название" name="title" required>
                    <UInput v-model="form.title" color="neutral" />
                </UFormField>
                <UFormField label="Тип" name="type" required>
                    <USelect v-model="form.type" :items="typeOptions" color="neutral" />
                </UFormField>
                <UFormField label="Описание" name="description" required>
                    <UTextarea v-model="form.description" :rows="5" color="neutral" />
                </UFormField>
                <UCheckbox v-model="form.isActive" label="Активна" />

                <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
                <div class="flex items-center gap-2">
                    <UButton type="submit" color="neutral" variant="solid" class="!bg-dark-bg !text-fg" :loading="saving">
                        Создать
                    </UButton>
                    <UButton to="/admin/catalog" color="neutral" variant="ghost">
                        Назад
                    </UButton>
                </div>
            </UForm>
        </div>
    </section>
</template>

<script setup lang="ts">
const { apiFetch } = useApiClient();
const router = useRouter();
const { draftId, setDraftId } = useAdminCatalogDraft();
definePageMeta({ middleware: "admin" });

const typeOptions = ["panel"];
const form = reactive({
    slug: "",
    title: "",
    type: "panel",
    description: "",
    isActive: true,
});
const saving = ref(false);
const error = ref<string | null>(null);

async function submit() {
    error.value = null;
    saving.value = true;
    try {
        const response = await apiFetch<{ draftId: string; card: { id: string } }>("/api/admin/catalog/cards", {
            method: "POST",
            body: {
                draftId: draftId.value ?? undefined,
                slug: form.slug,
                title: form.title,
                type: form.type,
                description: form.description,
                isActive: form.isActive,
            },
        });
        setDraftId(response.draftId);
        await router.push(`/admin/catalog/${response.card.id}?draftId=${encodeURIComponent(response.draftId)}`);
    } catch (err: any) {
        error.value = err?.data?.statusMessage ?? "Не удалось создать карточку";
    } finally {
        saving.value = false;
    }
}
</script>
