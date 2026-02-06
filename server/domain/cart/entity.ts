import { CartStatus } from "./types";

export interface Cart {
    id: string;

    userId: string

    status: CartStatus;
    
    createdAt: Date;
    updatedAt: Date;
}
