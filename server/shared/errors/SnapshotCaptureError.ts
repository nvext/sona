import { ApplicationError } from "./ApplicationError";

export class SnapshotCaptureError extends ApplicationError {
    constructor(message: string = "Failed to capture cart snapshot") {
        super(message, 500);
    }
}
