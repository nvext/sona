import { OrderRequestDeliveryService } from "~~/server/application/checkout/services/order-request-delivery";

export class NoopOrderRequestDeliveryService implements OrderRequestDeliveryService {
    async send(input: { orderRequestId: string }): Promise<void> {
        void input;
        return;
    }
}
