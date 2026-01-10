<template>
    <div :class="['w-full flex items-start justify-center gap-3.75 py-8.75']">
        <ToggleMenu>
            Тип

            <template #content>
                <div class="p-5 pt-0 text-dark-fg-1">
                    <Select :options="typeOptions"></Select>
                </div>
            </template>
        </ToggleMenu>
        <ToggleMenu>
            Цвет

            <template #content>
                <div class="p-5 pt-0 grid grid-cols-3 gap-1">
                    <div
                        v-for="color in colors"
                        :style="{ backgroundColor: color }"
                        class="rounded-full size-5"></div>
                </div>
            </template>
        </ToggleMenu>
        <ToggleMenu>
            Размер

            <template #content>
                <div class="p-5 pt-0 text-dark-fg-1">
                    <Select :options="sizeOptions"></Select>
                </div>
            </template>
        </ToggleMenu>
        <ToggleMenu>
            Цена

            <template #content>
                <div class="px-5 py-2 min-w-35">
                    <USlider
                        color="neutral"
                        size="sm"
                        :min="minPrice"
                        :max="maxPrice"
                        v-model="price"
                        :ui="{
                            track: 'bg-bg-2 h-1',
                            thumb: 'ring-0 bg-dark-bg-1 size-2.5',
                            range: 'bg-dark-bg-1',
                        }" />

                    <div class="flex justify-end mt-2">
                        <p>{{ price[0] }} - {{ price[1] }}</p>
                    </div>
                </div>
            </template>
        </ToggleMenu>
    </div>

    <div class="flex flex-wrap px-25 gap-5 mb-15">
        <ProductCard v-for="product in products" :product class="flex-1" />
    </div>
</template>

<script setup lang="ts">
import products from "~~/public/content/products.json";

const flatProducts = computed(() => products.map((p) => p.variants).flat());

const colors = computed(() => new Set(flatProducts.value.map((p) => p.color)));
const minPrice = Math.min(...flatProducts.value.map((p) => p.price.rub));
const maxPrice = Math.max(...flatProducts.value.map((p) => p.price.rub));
const price = ref([minPrice, maxPrice]);

const typeOptions: SelectOption[] = [
    {
        label: "Напольные",
    },
    {
        label: "Настенные",
    },
    {
        label: "Барабанные",
    },
];

const sizeOptions: SelectOption[] = [
    {
        label: "Маленькие",
    },
    {
        label: "Средние",
    },
    {
        label: "Большие",
    },
];
</script>
