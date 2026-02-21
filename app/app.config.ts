export default defineAppConfig({
    ui: {
        colors: {
            neutral: "neutral",
        },
        button: {
            slots: {
                base: "rounded-[100px] [font-family:var(--font-ui-buttons)] text-base font-medium leading-none",
                label: "leading-none",
                leadingIcon: "size-3.5",
                trailingIcon: "size-3.5",
            },
        },
    },
});
