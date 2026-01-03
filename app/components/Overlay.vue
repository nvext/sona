<template>
    <div
        id="overlay"
        class="absolute inset-0"
        :class="isOpen ? 'pointer-events-auto' : 'pointer-events-none'"></div>
</template>

<script setup lang="ts">
import { useOverlay } from "~/composables/useOverlay";

const { isOpen } = useOverlay();
</script>
