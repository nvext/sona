import type {
    ContactVerificationDeliveryService,
    SendContactVerificationInput,
} from "~~/server/application/auth/services/contact-verification-delivery";

export class ChannelRoutingContactVerificationDeliveryService implements ContactVerificationDeliveryService {
    constructor(
        private readonly services: Record<SendContactVerificationInput["channel"], ContactVerificationDeliveryService>,
    ) {}

    async send(input: SendContactVerificationInput): Promise<void> {
        await this.services[input.channel].send(input);
    }
}
