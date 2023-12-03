import Logger from './Logger'
import HttpClient from './HttpClient'
import { JSON, DiffBucket } from 'api-diff'

class Comparor
{
    readonly CHUNK_SIZE: number = 10
    private logger: Logger

    constructor(logger: Logger) {
        this.logger = logger
    }

    async compareEndpoints(endpoints: Array<string>, clientNew: HttpClient, clientOld: HttpClient): Promise<DiffBucket> {
        const diffs: DiffBucket = {}
        while (endpoints.length) {
            await Promise.all(endpoints.splice(0, this.CHUNK_SIZE).map((endpoint: string) => {
                return Promise.all([clientNew.fetch(endpoint), clientOld.fetch(endpoint)]).then((values) => {
                        const newJson = values[0]
                        const oldJson = values[1]
                        const endpointMessage: string = `Endpoint /${endpoint}`
                        const diff: Object|null = this.getDifference(newJson, oldJson)
                        if (diff == null) {
                            this.logger.ok(endpointMessage)
                        } else {
                            this.logger.fail(endpointMessage)
                            diffs[endpoint] = diff
                        }
                    }).catch((error: Error) => {
                        this.logger.log("Error: " + error.message)
                    })
            })).catch((error: Error) => {
                this.logger.log('Error: ' + error.message)
            })
        }

        return Promise.resolve(diffs)
    }

    private getDifference(newJson: JSON, oldJson: JSON): Object|null {
        // check if JSONs are exactly same
        if (JSON.stringify(newJson) === JSON.stringify(oldJson)) {
            return null
        }

        const diff: Object = this.diff(newJson, oldJson)
        if (Object.keys(diff).length === 0) {
            // aren't same but equal
            return null
        }

        // JSONs are different
        return diff
    }

    /**
     * Copied from diffler repository and adopted to typescript syntax
     * @see https://github.com/omgaz/diffler
     */
    private diff(newJson: JSON, oldJson: JSON) {
        var diff = {}

        // Iterate over obj1 looking for removals and differences in existing values
        for (var key in newJson as Object) {
            if (newJson.hasOwnProperty(key) && typeof newJson[key] !== 'function') {
                const obj1Val = newJson[key]
                const obj2Val = oldJson[key]

                if (typeof obj1Val !== typeof obj2Val) {
                    diff[key] = {
                        from: obj1Val,
                        to: obj2Val,
                    }
                    break
                }

                if (!(key in (oldJson as Object))) {
                    // If property exists in obj1 and not in obj2 then it has been removed
                    diff[key] = {
                        from: obj1Val,
                        to: null,
                    }
                } else if (typeof obj1Val === 'object') {
                    // If property is an object then we need to dive in
                    var tempDiff = this.diff(obj1Val, obj2Val)
                    if (Object.keys(tempDiff).length > 0) {
                        if (tempDiff) {
                            diff[key] = tempDiff
                        }
                    }
                } else if (obj1Val !== obj2Val) {
                    // If property is in both obj1 and obj2 and values are different
                    diff[key] = {
                        from: obj1Val,
                        to: obj2Val,
                    }
                }
            }
        }

        for (key in oldJson as Object) {
            if (oldJson.hasOwnProperty(key) && typeof oldJson[key] !== 'function') {
                if (newJson === null) {
                    diff[key] = {
                        from: newJson,
                        to: oldJson[key],
                    }
                    break
                }

                const obj1Val = newJson[key]
                const obj2Val = oldJson[key]

                if (!(key in (newJson as Object))) {
                    if (!diff) {
                        diff = {}
                    }
                    diff[key] = {
                        from: null,
                        to: obj2Val,
                    }
                }
            }
        }

        return diff
    }
}

export default Comparor