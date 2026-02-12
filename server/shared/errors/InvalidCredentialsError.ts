import { ApplicationError } from "./ApplicationError";

export class InvalidCredentialsError extends ApplicationError {
    constructor(message: string = "Invalid credentials") {
        super(message, 401)
    }
}