<template>
    <div ref="dropdown">
        <slot name="trigger" :toggle :is-open></slot>
        <ClientOnly>
            <Teleport to="#overlay">
                <div ref="content" v-if="isOpen" class="z-50 size-fit">
                    <slot name="content"></slot>
                </div>
            </Teleport>
        </ClientOnly>
    </div>
</template>

<script setup lang="ts">
import { useOverlay } from "~/composables/useOverlay";

const overlay = useOverlay();

const isOpen = defineModel<boolean>({ default: false });

const contentRef = useTemplateRef("content");
const dropdownRef = useTemplateRef("dropdown");

const toggle = () => {
    isOpen.value = !isOpen.value;
};

const close = () => {
    isOpen.value = false;
};

watch(isOpen, (value) => {
    if (value) {
        nextTick(updatePosition);
        nextTick(() => document.addEventListener("click", handleClickOutside));
        overlay.open();
    } else {
        document.removeEventListener("click", handleClickOutside);
        overlay.close();
    }
});

const handleClickOutside = (event: MouseEvent) => {
    if (
        isOpen.value &&
        !contentRef.value?.contains(event.target as Node) &&
        !dropdownRef.value?.contains(event.target as Node)
    )
        close();
};

const updatePosition = async () => {
    if (!dropdownRef.value || !contentRef.value) return;

    await nextTick(); // ждём рендера контента

    const triggerRect = dropdownRef.value.getBoundingClientRect();
    const contentRect = contentRef.value.getBoundingClientRect();

    // Вычисляем варианты позиций
    const positions = [
        { top: triggerRect.bottom + 4, left: triggerRect.left }, // снизу, слева
        {
            top: triggerRect.top - contentRect.height - 4,
            left: triggerRect.left,
        }, // сверху, слева
        {
            top: triggerRect.bottom + 4,
            left: triggerRect.right - contentRect.width,
        }, // снизу, справа
    ];

    // Выбираем первый, который помещается
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    for (const pos of positions) {
        const fitsRight = pos.left + contentRect.width <= viewportWidth;
        const fitsLeft = pos.left >= 0;
        const fitsTop = pos.top >= 0;
        const fitsBottom = pos.top + contentRect.height <= viewportHeight;

        if (fitsLeft && fitsRight && fitsTop && fitsBottom) {
            Object.assign(contentRef.value.style, {
                position: "fixed",
                top: `${pos.top}px`,
                left: `${pos.left}px`,
                width: `${contentRect.width}px`,
            });
            return;
        }
    }

    // Fallback
    Object.assign(contentRef.value.style, {
        position: "fixed",
        top: "4px",
        left: "4px",
        width: `${contentRect.width}px`,
    });
};

onMounted(() => {
    if (isOpen.value) document.addEventListener("click", handleClickOutside);
});
</script>
