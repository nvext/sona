import { FileRepo } from "~~/server/domain/file/repo";
import { ProductCardRepo } from "~~/server/domain/product-card/repo";
import { ProductColorRepo } from "~~/server/domain/product-color/repo";
import { ProductRepo } from "~~/server/domain/product/repo";
import { NotFoundError } from "~~/server/shared/errors";

export class GetProductCardDetails {
    constructor(
        private readonly productCardRepo: ProductCardRepo,
        private readonly productColorRepo: ProductColorRepo,
        private readonly productRepo: ProductRepo,
        private readonly fileRepo: FileRepo,
    ) {}

    async execute(input: GetProductCardDetailsInput) {
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

        const imageIds = Array.from(new Set(colors.flatMap((color) => color.imageIds)));
        const { data: files } = await this.fileRepo.getByIds({ ids: imageIds });
        const filesById = new Map(files.map((file) => [file.id, file]));

        return {
            card,
            colors: colors.map((color) => {
                const { imageIds, ...colorWithoutImageIds } = color;
                return {
                    ...colorWithoutImageIds,
                    images: imageIds.flatMap((imageId) => {
                    const file = filesById.get(imageId);
                    return file ? [{ id: file.id, url: file.url }] : [];
                }),
                };
            }),
            products,
        };
    }
}

type GetProductCardDetailsInput = {
    cardId: string;
};
