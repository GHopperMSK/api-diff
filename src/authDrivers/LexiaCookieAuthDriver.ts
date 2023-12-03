import { Credentials, AuthResponse, AuthDriverInterface } from '../@types/api-diff'

class LexiaCookieAuthDriver implements AuthDriverInterface
{
    private url: string
    private credentials: Credentials

    private sessionId: string

    constructor(url: string, credentials: Credentials) {
        this.url = url
        this.credentials = credentials
    }

    async auth(): Promise<string> {
        // get auth data (auth server url with query params)
        const authData: AuthResponse = await this.getAuthData(this.url)

        // use the url in order to set PHPSESSID cookie
        const cookies: Array<string> = await this.getCookies(authData.endpoint)

        // parse all cookies in order to extract PHPSESSID value
        return new Promise<string>((resolve, reject) => {
            for (const cookie of cookies) {
                if (cookie.substring(0, 10) !== "PHPSESSID=") {
                    continue
                }

                // extract PHPSESSID from cookie string
                const phpSessId: string = cookie.substring(10, cookie.indexOf("; path="))
                this.sessionId = phpSessId
                resolve(`Authenticated on ${this.url} server`)
            }

            reject("Couldn't get PHPSESSID cookie")
        })
    }

    isAuthenticated(): boolean {
        return typeof this.sessionId !== 'undefined'
    }

    addAuthData(request: Request): void {
        if (!this.isAuthenticated) {
            throw new Error("Call 'auth' method first")
        }

        request.headers.append('cookie', `PHPSESSID=${this.sessionId}`)
    }

    private async getAuthData(url: string): Promise<AuthResponse> {
        const body = {
            "product": "mylexia",
            "username": this.credentials.username,
            "password": this.credentials.password
        }
        return fetch(url, {
            "method": 'POST',
            "body": JSON.stringify(body),
            "headers": {'Content-Type': 'application/json; charset=UTF-8'},
        }).then((response) => {
            if (!response.ok) {
                throw new Error(`Couldn't reach ${url} server`)
            }
            return response.json() as Promise<AuthResponse>
        }).then((data: AuthResponse) => {
            if (!data.valid) {
                throw new Error(`Authentication failed on ${url}`)
            }
            return data
        })
    }

    private async getCookies(url: string): Promise<Array<string>> {
        return fetch(url, {
            "method": 'GET',
            "redirect": "manual",
            "headers": {'Content-Type': 'application/json; charset=UTF-8'},
        }).then((response) => {
            return response.headers
        }).then((headers) => {
            return headers.getSetCookie()
        }).catch((error: Error) => {
            throw new Error(`Couldn't get data from ${url}`)
        })
    }
}

export default LexiaCookieAuthDriver