import { ApplicationError } from "./ApplicationError";

export class ConflictError extends ApplicationError {
    constructor(message: string = "Conflict") {
        super(message, 409);
    }
}
