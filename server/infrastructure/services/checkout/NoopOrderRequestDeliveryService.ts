import { OrderRequestDeliveryService } from "~~/server/application/checkout/services/order-request-delivery";
import { OrderRequest } from "~~/server/domain/order-request/entity";
import { ProductSnapshot } from "~~/server/domain/product-snapshot/entity";

export class NoopOrderRequestDeliveryService implements OrderRequestDeliveryService {
    async send(input: { orderRequest: OrderRequest; snapshots: ProductSnapshot[] }): Promise<void> {
        void input;
        return;
    }
}
