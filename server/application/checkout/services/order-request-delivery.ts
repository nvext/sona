import { OrderRequest } from "~~/server/domain/order-request/entity";
import { ProductSnapshot } from "~~/server/domain/product-snapshot/entity";

export interface OrderRequestDeliveryService {
    send(input: { orderRequest: OrderRequest; snapshots: ProductSnapshot[] }): Promise<void>;
}
