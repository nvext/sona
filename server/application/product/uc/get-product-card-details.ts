import { ProductCardRepo } from "~~/server/domain/product-card/repo";
import { ProductColorRepo } from "~~/server/domain/product-color/repo";
import { ProductRepo } from "~~/server/domain/product/repo";
import { NotFoundError } from "~~/server/shared/errors";

export class GetProductCardDetails {
    constructor(
        private readonly productCardRepo: ProductCardRepo,
        private readonly productColorRepo: ProductColorRepo,
        private readonly productRepo: ProductRepo,
    ) {}

    async execute(input: GetProductCardDetaisInput) {
        const { data: card } = await this.productCardRepo.getById({ id: input.cardId });

        if (card === null) {
            throw new NotFoundError();
        }

        const { data: colors } = await this.productColorRepo.getByProductCardId({
            productCardId: card.id,
        });

        const { data: products } = await this.productRepo.getByProductCardId({
            productCardId: card.id,
        });

        return {
            card,
            colors,
            products,
        };
    }
}

type GetProductCardDetaisInput = {
    cardId: string;
};
