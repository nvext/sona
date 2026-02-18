import { OrderRequest } from "~~/server/domain/order-request/entity";

export interface OrderRequestDeliveryService {
    send(input: { orderRequest: OrderRequest }): Promise<void>;
}
