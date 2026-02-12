export interface TokenHasher {
    hash(token: string): Promise<string>;
    verify(hash: string, token: string): Promise<boolean>;
}