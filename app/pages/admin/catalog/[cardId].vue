<template>
    <section class="px-6 lg:px-25 py-10 space-y-8" v-if="card">
        <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
                <h1 class="text-4xl">{{ card.title }}</h1>
                <p class="text-dark-fg-2 text-sm">cardId: {{ card.id }} | draft: {{ draftId ?? "нет" }}</p>
            </div>
            <div class="flex items-center gap-2">
                <UButton to="/admin/catalog" color="neutral" variant="ghost">К списку</UButton>
                <UButton color="error" variant="soft" :loading="cardDeleting" @click="openDeleteModal">
                    Удалить карточку
                </UButton>
            </div>
        </div>

        <div class="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
            <div class="rounded-2xl border border-dark-bg/10 p-5 space-y-4">
                <h2 class="text-2xl">Карточка</h2>
                <UForm :state="cardForm" class="space-y-3" @submit="saveCard">
                    <UFormField label="Slug" name="slug" required>
                        <UInput v-model="cardForm.slug" color="neutral" />
                    </UFormField>
                    <UFormField label="Название" name="title" required>
                        <UInput v-model="cardForm.title" color="neutral" />
                    </UFormField>
                    <UFormField label="Тип" name="type" required>
                        <USelect v-model="cardForm.type" :items="typeOptions" color="neutral" />
                    </UFormField>
                    <UFormField label="Описание" name="description" required>
                        <UTextarea v-model="cardForm.description" :rows="4" color="neutral" />
                    </UFormField>
                    <UCheckbox v-model="cardForm.isActive" label="Активна" />
                    <p v-if="cardError" class="text-sm text-red-600">{{ cardError }}</p>
                    <UButton type="submit" color="neutral" variant="solid" class="!bg-dark-bg !text-fg" :loading="cardSaving">
                        Сохранить карточку
                    </UButton>
                </UForm>
            </div>

            <div class="rounded-2xl border border-dark-bg/10 p-5 space-y-4">
                <h2 class="text-2xl">Файлы</h2>
                <div class="space-y-3">
                    <input ref="uploadRef" type="file" class="block w-full text-sm" />
                    <UButton type="button" color="neutral" variant="outline" :loading="uploading" @click="uploadFile">
                        Загрузить
                    </UButton>
                    <p v-if="uploadError" class="text-sm text-red-600">{{ uploadError }}</p>
                    <p v-if="uploadSuccess" class="text-sm text-green-700">{{ uploadSuccess }}</p>
                </div>
                <ul class="space-y-2 max-h-72 overflow-auto">
                    <li v-for="file in files" :key="file.id" class="text-sm rounded-xl border border-dark-bg/10 p-2">
                        <div class="flex items-center justify-between gap-2">
                            <a :href="file.url" target="_blank" class="underline truncate">{{ file.originalName }}</a>
                            <UButton color="error" variant="ghost" size="xs" @click="deleteFile(file.id)">
                                Удалить
                            </UButton>
                        </div>
                        <p class="text-dark-fg-2 text-xs">{{ file.id }}</p>
                    </li>
                    <li v-if="files.length === 0" class="text-sm text-dark-fg-2">Файлы пока не загружены</li>
                </ul>
            </div>
        </div>

        <div class="rounded-2xl border border-dark-bg/10 p-5 space-y-4">
            <h2 class="text-2xl">Цвета</h2>
            <UForm :state="newColor" class="grid gap-3 md:grid-cols-[1fr_10rem_1fr_auto] items-end" @submit="createColor">
                <UFormField label="Название" name="name" required>
                    <UInput v-model="newColor.name" color="neutral" />
                </UFormField>
                <UFormField label="HEX" name="hex" required>
                    <UInput v-model="newColor.hex" color="neutral" placeholder="#000000" />
                </UFormField>
                <UFormField label="Image IDs (через запятую)" name="imageIds">
                    <UInput v-model="newColor.imageIds" color="neutral" />
                </UFormField>
                <UButton type="submit" color="neutral" variant="outline" :loading="colorCreating">Добавить</UButton>
            </UForm>

            <div class="space-y-3">
                <div v-for="item in colors" :key="item.id" class="rounded-xl border border-dark-bg/10 p-3">
                    <div class="grid gap-3 md:grid-cols-[1fr_9rem_1fr_auto] items-end">
                        <UInput v-model="colorForms[item.id]!.name" color="neutral" />
                        <UInput v-model="colorForms[item.id]!.hex" color="neutral" />
                        <UInput v-model="colorForms[item.id]!.imageIds" color="neutral" />
                        <UButton color="neutral" variant="solid" class="!bg-dark-bg !text-fg" @click="saveColor(item.id)">
                            Сохранить
                        </UButton>
                    </div>
                    <div class="mt-2 flex items-center justify-between">
                        <UCheckbox v-model="colorForms[item.id]!.isActive" label="Активен" />
                        <div class="flex items-center gap-2">
                            <div class="size-5 rounded-full border border-dark-bg/20" :style="{ background: colorForms[item.id]!.hex }" />
                            <span class="text-xs text-dark-fg-2">{{ item.id }}</span>
                        </div>
                    </div>
                </div>
                <p v-if="colors.length === 0" class="text-sm text-dark-fg-2">Цвета пока не добавлены</p>
            </div>
        </div>

        <div class="rounded-2xl border border-dark-bg/10 p-5 space-y-4">
            <h2 class="text-2xl">SKU</h2>
            <UForm :state="generateForm" class="grid gap-3 md:grid-cols-2 xl:grid-cols-5 items-end" @submit="generateProducts">
                <UFormField label="Размеры (600x600, 800x600)" name="sizes" required>
                    <UInput v-model="generateForm.sizes" color="neutral" />
                </UFormField>
                <UFormField label="Толщины (18, 25)" name="thicknesses" required>
                    <UInput v-model="generateForm.thicknesses" color="neutral" />
                </UFormField>
                <UFormField label="Цена" name="price" required>
                    <UInput v-model.number="generateForm.price" type="number" min="0" color="neutral" />
                </UFormField>
                <UFormField label="Валюта" name="currency" required>
                    <USelect v-model="generateForm.currency" :items="currencyOptions" color="neutral" />
                </UFormField>
                <UButton type="submit" color="neutral" variant="outline" :loading="productsGenerating">Сгенерировать</UButton>
            </UForm>
            <p v-if="productsError" class="text-sm text-red-600">{{ productsError }}</p>
            <p v-if="productsSuccess" class="text-sm text-green-700">{{ productsSuccess }}</p>

            <div v-if="products.length > 0" class="rounded-xl border border-dark-bg/10 p-3 space-y-3">
                <p class="text-sm text-dark-fg-2">Массовое изменение SKU (по текущему списку)</p>
                <div class="grid gap-3 md:grid-cols-4 items-end">
                    <UFormField label="Цена" name="batchPrice">
                        <UInput v-model.number="batchForm.price" type="number" min="0" color="neutral" />
                    </UFormField>
                    <UFormField label="Валюта" name="batchCurrency">
                        <USelect v-model="batchForm.currency" :items="currencyOptions" color="neutral" />
                    </UFormField>
                    <UFormField label="Статус" name="batchIsActive">
                        <USelect v-model="batchForm.status" :items="statusOptions" color="neutral" />
                    </UFormField>
                    <div class="flex gap-2">
                        <UButton color="neutral" variant="outline" @click="applyBatchLocally">
                            Применить
                        </UButton>
                        <UButton
                            color="neutral"
                            variant="solid"
                            class="!bg-dark-bg !text-fg"
                            :loading="batchSaving"
                            :disabled="batchSaving || changedProductIds.length === 0"
                            @click="saveAllProducts">
                            Сохранить все ({{ changedProductIds.length }})
                        </UButton>
                    </div>
                </div>
                <p v-if="batchSaving && batchProgress.total > 0" class="text-xs text-dark-fg-2">
                    Сохранение: {{ batchProgress.done }} / {{ batchProgress.total }}
                </p>
            </div>

            <div class="overflow-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="text-left border-b border-dark-bg/10">
                            <th class="py-2 pr-3">ID</th>
                            <th class="py-2 pr-3">Размер</th>
                            <th class="py-2 pr-3">Толщина</th>
                            <th class="py-2 pr-3">Цвет</th>
                            <th class="py-2 pr-3">Цена</th>
                            <th class="py-2 pr-3">Статус</th>
                            <th class="py-2 pr-3" />
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="product in products" :key="product.id" class="border-b border-dark-bg/5">
                            <td class="py-2 pr-3">{{ product.id }}</td>
                            <td class="py-2 pr-3">{{ product.width }} x {{ product.height }}</td>
                            <td class="py-2 pr-3">{{ product.thickness }}</td>
                            <td class="py-2 pr-3">{{ colorNameById[product.productColorId] ?? product.productColorId }}</td>
                            <td class="py-2 pr-3">
                                <div class="flex items-center gap-2">
                                    <UInput v-model.number="productForms[product.id]!.price" type="number" min="0" color="neutral" class="w-32" />
                                    <USelect v-model="productForms[product.id]!.currency" :items="currencyOptions" color="neutral" class="w-28" />
                                </div>
                            </td>
                            <td class="py-2 pr-3">
                                <UCheckbox v-model="productForms[product.id]!.isActive" />
                            </td>
                            <td class="py-2 pr-3">
                                <UButton size="xs" color="neutral" variant="ghost" @click="saveProduct(product.id)">
                                    Сохранить
                                </UButton>
                            </td>
                        </tr>
                        <tr v-if="products.length === 0">
                            <td class="py-3 text-dark-fg-2" colspan="7">SKU еще не сгенерированы</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div
            v-if="deleteModalOpen"
            class="fixed inset-0 z-[100] bg-dark-bg/45 flex items-center justify-center p-4"
            @click.self="closeDeleteModal">
            <div class="w-full max-w-xl rounded-2xl bg-bg border border-dark-bg/10 p-5 space-y-4">
                <h2 class="text-2xl">Удалить карточку?</h2>
                <p class="text-sm text-dark-fg-2">
                    Карточка будет удалена через текущий черновик и исчезнет из админ-списка.
                </p>
                <div class="rounded-xl border border-dark-bg/10 p-3 text-sm">
                    <p><span class="text-dark-fg-2">ID:</span> {{ card.id }}</p>
                    <p><span class="text-dark-fg-2">Название:</span> {{ card.title }}</p>
                    <p><span class="text-dark-fg-2">Slug:</span> {{ card.slug }}</p>
                </div>
                <div class="flex items-center justify-end gap-2">
                    <UButton color="neutral" variant="ghost" @click="closeDeleteModal">Отмена</UButton>
                    <UButton color="error" variant="soft" :loading="cardDeleting" @click="deleteCard">
                        Да, удалить
                    </UButton>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import type { AdminCatalogCard, AdminCatalogColor, AdminCatalogProduct, AdminFile } from "~/types/admin";

const route = useRoute();
const { apiFetch } = useApiClient();
const { draftId, setDraftId } = useAdminCatalogDraft();
definePageMeta({ middleware: "admin" });

const cardId = computed(() => String(route.params.cardId ?? ""));
const draftIdFromQuery = computed(() => {
    const value = route.query.draftId;
    return typeof value === "string" && value.length > 0 ? value : null;
});
if (draftIdFromQuery.value) {
    setDraftId(draftIdFromQuery.value);
}

const typeOptions = ["panel"];
const uploadRef = useTemplateRef<HTMLInputElement>("uploadRef");

const cardForm = reactive({
    slug: "",
    title: "",
    type: "panel",
    description: "",
    isActive: true,
});
const cardError = ref<string | null>(null);
const cardSaving = ref(false);
const cardDeleting = ref(false);
const deleteModalOpen = ref(false);

const newColor = reactive({
    name: "",
    hex: "#000000",
    imageIds: "",
    isActive: true,
});
const colorCreating = ref(false);
const colorForms = reactive<Record<string, { name: string; hex: string; imageIds: string; isActive: boolean }>>({});
const productForms = reactive<Record<string, { price: number; currency: string; isActive: boolean }>>({});
const uploading = ref(false);
const uploadError = ref<string | null>(null);
const uploadSuccess = ref<string | null>(null);
const productsError = ref<string | null>(null);
const productsSuccess = ref<string | null>(null);
const productsGenerating = ref(false);
const currencyOptions = ["RUB", "USD", "EUR"];
const statusOptions = [
    { label: "Активный", value: "active" },
    { label: "Неактивный", value: "inactive" },
];
const generateForm = reactive({
    sizes: "600x600",
    thicknesses: "18",
    price: 0,
    currency: "RUB",
});
const batchForm = reactive({
    price: 0,
    currency: "RUB",
    status: "active" as "active" | "inactive",
});
const batchSaving = ref(false);
const batchProgress = reactive({
    done: 0,
    total: 0,
});

const cardData = await useAsyncData(
    () => `admin-card-${cardId.value}-${draftId.value ?? "none"}`,
    () =>
        apiFetch<{ card: AdminCatalogCard; colors: AdminCatalogColor[] }>(`/api/admin/catalog/cards/${cardId.value}`, {
            query: { draftId: draftId.value ?? undefined },
        }),
    { watch: [cardId, draftId] },
);
const productsData = await useAsyncData(
    () => `admin-card-products-${cardId.value}-${draftId.value ?? "none"}`,
    () =>
        apiFetch<{ items: AdminCatalogProduct[] }>(`/api/admin/catalog/cards/${cardId.value}/products`, {
            query: { draftId: draftId.value ?? undefined },
        }),
    { watch: [cardId, draftId] },
);
const filesData = await useAsyncData(
    () => `admin-files-${draftId.value ?? "none"}`,
    () =>
        apiFetch<{ items: AdminFile[] }>("/api/admin/files", {
            query: { draftId: draftId.value ?? undefined, limit: 200 },
        }),
    { watch: [draftId] },
);

const card = computed(() => cardData.data.value?.card ?? null);
const colors = computed(() => cardData.data.value?.colors ?? []);
const products = computed(() => productsData.data.value?.items ?? []);
const files = computed(() => filesData.data.value?.items ?? []);
const colorNameById = computed<Record<string, string>>(() =>
    Object.fromEntries(colors.value.map((item) => [item.id, item.name])),
);
const changedProductIds = computed(() =>
    products.value
        .filter((item) => {
            const form = productForms[item.id];
            if (!form) {
                return false;
            }
            return (
                Number(form.price) !== Number(item.price) ||
                form.currency !== item.currency ||
                Boolean(form.isActive) !== Boolean(item.isActive)
            );
        })
        .map((item) => item.id),
);

watch(
    () => card.value,
    (value) => {
        if (!value) return;
        cardForm.slug = value.slug;
        cardForm.title = value.title;
        cardForm.type = value.type;
        cardForm.description = value.description ?? "";
        cardForm.isActive = value.isActive;
    },
    { immediate: true },
);

watch(
    () => colors.value,
    (items) => {
        for (const item of items) {
            if (!colorForms[item.id]) {
                colorForms[item.id] = {
                    name: item.name,
                    hex: item.hex,
                    imageIds: (item.imageIds ?? []).join(", "),
                    isActive: item.isActive,
                };
            }
        }
    },
    { immediate: true },
);

watch(
    () => products.value,
    (items) => {
        for (const item of items) {
            productForms[item.id] = {
                price: item.price,
                currency: item.currency,
                isActive: item.isActive,
            };
        }
    },
    { immediate: true },
);

function parseImageIds(value: string): string[] {
    return value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
}

function parseSizes(value: string): Array<{ width: number; height: number }> {
    return value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .map((item) => {
            const [widthRaw, heightRaw] = item.toLowerCase().split("x");
            return {
                width: Number(widthRaw),
                height: Number(heightRaw),
            };
        })
        .filter((item) => Number.isFinite(item.width) && Number.isFinite(item.height) && item.width > 0 && item.height > 0);
}

function parseThicknesses(value: string): number[] {
    return value
        .split(",")
        .map((item) => Number(item.trim()))
        .filter((item) => Number.isFinite(item) && item > 0);
}

function openDeleteModal() {
    deleteModalOpen.value = true;
}

function closeDeleteModal() {
    if (cardDeleting.value) {
        return;
    }
    deleteModalOpen.value = false;
}

async function reloadAll() {
    await Promise.all([cardData.refresh(), productsData.refresh(), filesData.refresh()]);
}

async function saveCard() {
    cardError.value = null;
    cardSaving.value = true;
    try {
        const response = await apiFetch<{ draftId: string }>(`/api/admin/catalog/cards/${cardId.value}`, {
            method: "PATCH",
            body: {
                draftId: draftId.value ?? undefined,
                slug: cardForm.slug,
                title: cardForm.title,
                type: cardForm.type,
                description: cardForm.description,
                isActive: cardForm.isActive,
            },
        });
        setDraftId(response.draftId);
        await reloadAll();
    } catch (err: any) {
        cardError.value = err?.data?.statusMessage ?? "Не удалось сохранить карточку";
    } finally {
        cardSaving.value = false;
    }
}

async function deleteCard() {
    cardDeleting.value = true;
    try {
        const response = await apiFetch<{ draftId: string; deleted: boolean }>(`/api/admin/catalog/cards/${cardId.value}`, {
            method: "DELETE",
            query: {
                draftId: draftId.value ?? undefined,
            },
        });
        setDraftId(response.draftId);
        closeDeleteModal();
        await navigateTo(`/admin/catalog?draftId=${encodeURIComponent(response.draftId)}`);
    } catch (err: any) {
        cardError.value = err?.data?.statusMessage ?? "Не удалось удалить карточку";
    } finally {
        cardDeleting.value = false;
    }
}

async function createColor() {
    colorCreating.value = true;
    try {
        const response = await apiFetch<{ draftId: string }>(`/api/admin/catalog/cards/${cardId.value}/colors`, {
            method: "POST",
            body: {
                draftId: draftId.value ?? undefined,
                name: newColor.name,
                hex: newColor.hex,
                imageIds: parseImageIds(newColor.imageIds),
                isActive: newColor.isActive,
            },
        });
        setDraftId(response.draftId);
        newColor.name = "";
        newColor.hex = "#000000";
        newColor.imageIds = "";
        newColor.isActive = true;
        await reloadAll();
    } finally {
        colorCreating.value = false;
    }
}

async function saveColor(colorId: string) {
    const form = colorForms[colorId];
    if (!form) return;
    await apiFetch<{ draftId: string }>(`/api/admin/catalog/colors/${colorId}`, {
        method: "PATCH",
        body: {
            draftId: draftId.value ?? undefined,
            name: form.name,
            hex: form.hex,
            imageIds: parseImageIds(form.imageIds),
            isActive: form.isActive,
        },
    });
    await reloadAll();
}

async function generateProducts() {
    productsError.value = null;
    productsSuccess.value = null;
    const sizes = parseSizes(generateForm.sizes);
    const thicknesses = parseThicknesses(generateForm.thicknesses);
    if (sizes.length === 0 || thicknesses.length === 0) {
        productsError.value = "Заполните размеры и толщины в корректном формате.";
        return;
    }

    productsGenerating.value = true;
    try {
        const response = await apiFetch<{ draftId: string }>(`/api/admin/catalog/cards/${cardId.value}/products/generate`, {
            method: "POST",
            body: {
                draftId: draftId.value ?? undefined,
                sizes,
                thicknesses,
                price: Number(generateForm.price),
                currency: generateForm.currency,
                isActive: true,
            },
        });
        setDraftId(response.draftId);
        await productsData.refresh();
        productsSuccess.value = `Сгенерировано SKU: ${response.generated}, удалено: ${response.deleted}`;
    } catch (err: any) {
        productsError.value = err?.data?.statusMessage ?? "Не удалось сгенерировать SKU";
    } finally {
        productsGenerating.value = false;
    }
}

async function saveProduct(productId: string) {
    const form = productForms[productId];
    if (!form) return;
    try {
        const response = await apiFetch<{ draftId: string }>(`/api/admin/catalog/products/${productId}`, {
            method: "PATCH",
            body: {
                draftId: draftId.value ?? undefined,
                price: Number(form.price),
                currency: form.currency,
                isActive: form.isActive,
            },
        });
        setDraftId(response.draftId);
        await productsData.refresh();
        productsSuccess.value = "SKU сохранен.";
    } catch (err: any) {
        productsError.value = err?.data?.statusMessage ?? "Не удалось сохранить SKU";
    }
}

function applyBatchLocally() {
    productsSuccess.value = null;
    for (const item of products.value) {
        productForms[item.id] = {
            price: Number(batchForm.price),
            currency: batchForm.currency,
            isActive: batchForm.status === "active",
        };
    }
    productsSuccess.value = `Значения применены локально к ${products.value.length} SKU.`;
}

async function saveAllProducts() {
    if (products.value.length === 0) {
        return;
    }
    const idsToSave = [...changedProductIds.value];
    if (idsToSave.length === 0) {
        productsSuccess.value = "Измененных SKU нет.";
        return;
    }

    productsError.value = null;
    productsSuccess.value = null;
    batchSaving.value = true;
    batchProgress.total = idsToSave.length;
    batchProgress.done = 0;
    try {
        for (const productId of idsToSave) {
            const form = productForms[productId];
            if (!form) {
                batchProgress.done += 1;
                continue;
            }
            const response = await apiFetch<{ draftId: string }>(`/api/admin/catalog/products/${productId}`, {
                method: "PATCH",
                body: {
                    draftId: draftId.value ?? undefined,
                    price: Number(form.price),
                    currency: form.currency,
                    isActive: form.isActive,
                },
            });
            setDraftId(response.draftId);
            batchProgress.done += 1;
        }
        await productsData.refresh();
        productsSuccess.value = `Сохранено измененных SKU: ${batchProgress.done}`;
    } catch (err: any) {
        productsError.value = err?.data?.statusMessage ?? "Не удалось выполнить массовое сохранение SKU";
    } finally {
        batchSaving.value = false;
    }
}

async function uploadFile() {
    uploadError.value = null;
    uploadSuccess.value = null;
    const file = uploadRef.value?.files?.[0];
    if (!file) {
        uploadError.value = "Сначала выберите файл.";
        return;
    }
    uploading.value = true;
    try {
        const payload = new FormData();
        payload.append("file", file);
        if (draftId.value) {
            payload.append("draftId", draftId.value);
        }
        const response = await apiFetch<{ draftId: string }>("/api/admin/files", {
            method: "POST",
            body: payload,
        });
        setDraftId(response.draftId);
        if (uploadRef.value) {
            uploadRef.value.value = "";
        }
        await filesData.refresh();
        uploadSuccess.value = "Файл загружен в черновик.";
    } catch (err: any) {
        uploadError.value = err?.data?.statusMessage ?? "Не удалось загрузить файл.";
    } finally {
        uploading.value = false;
    }
}

async function deleteFile(fileId: string) {
    const response = await apiFetch<{ draftId: string }>(`/api/admin/files/${fileId}`, {
        method: "DELETE",
        query: { draftId: draftId.value ?? undefined },
    });
    setDraftId(response.draftId);
    await filesData.refresh();
}
</script>
