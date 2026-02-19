import { GetCartItemsQuery } from "../queries";

export class GetCartItems {
    constructor(private readonly getCartItemsQuery: GetCartItemsQuery) {}

    async execute(input: { userId: string }) {
        return this.getCartItemsQuery.execute({ userId: input.userId });
    }
}
