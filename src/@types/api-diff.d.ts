export type Credentials = {
    username: string,
    password: string,
}

export type AuthResponse = {
    valid: boolean
    error: string
    name: string
    role: string
    personId: string
    token: string
    endpoint: string
    mobileEndpoint: string
}

export type JSON =
    | string
    | number
    | boolean
    | { [x: string]: JSON }
    | Array<JSON>

export type DiffBucket = {[endpoint: string]: Object}

export interface AuthDriverInterface {
    auth(): Promise<string>
    isAuthenticated(): boolean
    addAuthData(request: Request): void
}