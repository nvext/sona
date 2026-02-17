export interface OrderRequestDeliveryService {
    send(input: { orderRequestId: string }): Promise<void>;
}
