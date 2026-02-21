<template>
    <div class="flex items-center gap-2">
        <UButton
            v-for="color in colors"
            :key="color.id"
            type="button"
            color="neutral"
            variant="ghost"
            :aria-label="`Цвет ${color.id}`"
            :ui="{
                base: 'rounded-full border border-dark-bg/20 transition-[width,box-shadow] duration-150 p-0 min-w-0',
            }"
            :style="{
                backgroundColor: color.hex,
                height: `${sizePx}px`,
                width: selectedId === color.id ? `${sizePx * 2.5}px` : `${sizePx}px`,
            }"
            @click="selectedId = color.id" />
    </div>
</template>

<script setup lang="ts">
type ColorItem = {
    id: string;
    hex: string;
};

const props = withDefaults(
    defineProps<{
        colors: ColorItem[];
        size?: number;
    }>(),
    {
        size: 28,
    },
);

const selectedId = defineModel<string | null>();

const sizePx = computed(() => props.size);
</script>
