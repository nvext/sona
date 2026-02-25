import { ApplicationError } from "./ApplicationError";

export class ContactNotVerifiedError extends ApplicationError {
    constructor(message: string = "Contact is not verified") {
        super(message, 403);
    }
}
