import { AuthDriverInterface } from 'api-diff'

class HttpClient
{
    private authDriver: AuthDriverInterface
    private serverHost: string

    constructor(serverHost: string, authDriver: AuthDriverInterface) {
        this.authDriver = authDriver
        this.serverHost = serverHost
    }

    async fetch(endpoint: string): Promise<string> {
        const url: string = `${this.serverHost}/${endpoint}`
        const options = {
            method: "GET",
            headers: {
                'accept': '*/*',
            }
        }
        const request: Request = new Request(url, options)
        this.authDriver.addAuthData(request)

        return fetch(request).then((response) => {
            if (!response.ok) {
                throw new Error(response.statusText)
            }
            return response.json()
        }).then((data) => {
            return data
        }).catch(() => {
            throw new Error(`Couldn't get data from ${url}`)
        })
    }

}

export default HttpClient