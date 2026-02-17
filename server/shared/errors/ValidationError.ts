import { ApplicationError } from "./ApplicationError";

export class ValidationError extends ApplicationError {
    constructor(message: string = "Validation failed") {
        super(message, 400);
    }
}
