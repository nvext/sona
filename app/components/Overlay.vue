<template>
    <div
        id="overlay"
        class="absolute inset-0 pointer-events-none **:pointer-events-auto"></div>
</template>

<script setup lang="ts">
import { useOverlay } from "~/composables/useOverlay";

const { isOpen } = useOverlay();
</script>
