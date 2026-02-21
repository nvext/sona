import type { CartItem } from "~/types/cart";

export function useCart() {
    const items = useState<CartItem[]>("cart-items", () => []);
    const cartId = useState<string | null>("cart-id", () => null);
    const loading = useState<boolean>("cart-loading", () => false);
    const { apiFetch } = useApiClient();
    const { isAuthenticated } = useAuth();

    async function refresh() {
        if (!isAuthenticated.value) {
            items.value = [];
            cartId.value = null;
            return;
        }
        loading.value = true;
        try {
            const response = await apiFetch<{ data: CartItem[]; meta: { cartId: string | null } }>(
                "/api/cart/items",
            );
            items.value = response.data;
            cartId.value = response.meta.cartId;
        } finally {
            loading.value = false;
        }
    }

    async function addItem(
        input: { productId: string; productColorId: string },
        quantity = 1,
    ) {
        const safeQuantity = Math.max(1, Math.floor(quantity));
        await apiFetch("/api/cart/items", {
            method: "POST",
            body: {
                ...input,
                quantity: safeQuantity,
            },
        });

        await refresh();
    }

    async function removeItem(itemId: string) {
        await apiFetch(`/api/cart/items/${itemId}`, {
            method: "DELETE",
        });
        await refresh();
    }

    async function increment(productId: string, productColorId: string) {
        await addItem({ productId, productColorId });
    }

    async function decrement(itemId: string) {
        await removeItem(itemId);
    }

    const total = computed(() =>
        items.value.reduce((sum, item) => sum + item.price * item.quantity, 0),
    );

    const count = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0));

    if (process.client) {
        watch(isAuthenticated, () => {
            refresh();
        }, { immediate: true });
    }

    return {
        items,
        cartId,
        loading,
        refresh,
        addItem,
        removeItem,
        increment,
        decrement,
        total,
        count,
    };
}
