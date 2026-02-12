export abstract class ApplicationError extends Error {
    readonly status: number;

    protected constructor(message: string = "Application error", status: number = 500) {
        super(message);
        this.status = status;
        this.name = new.target.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
