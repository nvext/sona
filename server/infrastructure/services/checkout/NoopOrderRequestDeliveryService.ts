import { OrderRequestDeliveryService } from "~~/server/application/checkout/services/order-request-delivery";
import { OrderRequest } from "~~/server/domain/order-request/entity";

export class NoopOrderRequestDeliveryService implements OrderRequestDeliveryService {
    async send(input: { orderRequest: OrderRequest }): Promise<void> {
        void input;
        return;
    }
}
