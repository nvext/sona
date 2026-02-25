import type {
    ContactVerificationDeliveryService,
    SendContactVerificationInput,
} from "~~/server/application/auth/services/contact-verification-delivery";
import { logInfo } from "~~/server/infrastructure/runtime";

export class LogContactVerificationDeliveryService implements ContactVerificationDeliveryService {
    async send(input: SendContactVerificationInput): Promise<void> {
        logInfo("auth.verification.code_sent", {
            userId: input.userId,
            channel: input.channel,
            destination: input.destination,
            code: input.code,
            expiresAt: input.expiresAt,
        });
    }
}
