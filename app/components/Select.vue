<template>
    <div>
        <div v-for="option in options">
            {{ option.label }}
        </div>
    </div>
</template>

<script setup lang="ts">
const {options} = defineProps<{ options: SelectOption[] }>();
</script>
