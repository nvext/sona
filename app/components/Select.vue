<template>
    <div class="space-y-1">
        <UCheckbox
            v-for="option in options"
            v-model="option.selected"
            :label="option.label"
            :disabled="option.disabled"
            size="sm"
            color="neutral" />
    </div>
</template>

<script setup lang="ts">
const options = defineModel<SelectItem[]>();
</script>
