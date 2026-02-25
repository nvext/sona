export type ContactVerificationChannel = "email" | "phone";

export type SendContactVerificationInput = {
    userId: string;
    channel: ContactVerificationChannel;
    destination: string;
    code: string;
    expiresAt: Date;
};

export interface ContactVerificationDeliveryService {
    send(input: SendContactVerificationInput): Promise<void>;
}
