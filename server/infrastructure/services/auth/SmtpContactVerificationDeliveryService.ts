import nodemailer from "nodemailer";
import type {
    ContactVerificationDeliveryService,
    SendContactVerificationInput,
} from "~~/server/application/auth/services/contact-verification-delivery";
import { logInfo } from "~~/server/infrastructure/runtime";
import type { SmtpContactVerificationConfig } from "./read-contact-verification-config";

type MailSender = {
    sendMail(message: {
        from: string;
        to: string;
        subject: string;
        text: string;
        replyTo?: string;
    }): Promise<unknown>;
};

export class SmtpContactVerificationDeliveryService implements ContactVerificationDeliveryService {
    private readonly mailSender: MailSender;

    constructor(
        private readonly config: SmtpContactVerificationConfig,
        mailSender?: MailSender,
    ) {
        this.mailSender = mailSender ?? nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: config.user
                ? {
                    user: config.user,
                    pass: config.password ?? "",
                }
                : undefined,
        });
    }

    async send(input: SendContactVerificationInput): Promise<void> {
        if (input.channel !== "email") {
            throw new Error(`Unsupported contact verification channel: ${input.channel}`);
        }

        await this.mailSender.sendMail({
            from: this.config.from,
            to: input.destination,
            subject: "Sona: код подтверждения email",
            text: buildEmailBody(input),
            replyTo: this.config.replyTo ?? undefined,
        });

        logInfo("auth.verification.email_sent", {
            userId: input.userId,
            destination: input.destination,
            expiresAt: input.expiresAt,
            provider: "smtp",
        });
    }
}

function buildEmailBody(input: SendContactVerificationInput): string {
    return [
        "Здравствуйте!",
        "",
        "Ваш код подтверждения для Sona:",
        input.code,
        "",
        `Код действует до ${input.expiresAt.toISOString()}.`,
        "Если вы не запрашивали подтверждение, просто проигнорируйте это письмо.",
    ].join("\n");
}
