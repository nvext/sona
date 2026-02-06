export type CartItemSnapshot = {
    title: string;
    description: string;

    imageIds: string[];

    props: Record<string, string | number | boolean>;

    price: number;
};
