import { ApplicationError } from "./ApplicationError";

export class OperationFailedError extends ApplicationError {
    constructor(message: string = "Operation failed") {
        super(message, 500);
    }
}
