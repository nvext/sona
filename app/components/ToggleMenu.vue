<template>
    <div class="bg-bg-1 rounded-3xl">
        <button
            class="px-5 py-3 w-full flex gap-2 justify-between cursor-pointer text-[15px]"
            type="button"
            @click="toggle">
            <slot />
            <img
                class="w-4 transition-transform"
                src="/icons/chevron-down.svg"
                :style="{
                    transform: isOpen ? 'rotate(-180deg)' : 'rotate(0deg)',
                }" />
        </button>
        <div
            ref="content"
            class="box-border overflow-hidden transition-[max-height]"
            :style="isOpen ? `max-height: ${content?.scrollHeight}px` : 'max-height: 0'">
            <slot name="content"></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
const isOpen = defineModel({ default: false });
const content = useTemplateRef("content");

function toggle() {
    isOpen.value = !isOpen.value;
}
</script>
