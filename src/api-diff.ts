import LexiaCookieAuthDriver from './authDrivers/LexiaCookieAuthDriver'
import HttpClient from './HttpClient'
import Logger from './Logger'
import FileSystemClient from './FileSystemClient'
import Comparor from './Comparor'
import DiffFormatter from './DiffFormatter'
import { Credentials, AuthDriverInterface, DiffBucket } from 'api-diff'

const DEFAULT_PARALLEL_REQUEST_COUNT: number = 10
const logger = new Logger()
const { version } = require('../package.json')
const comparor: Comparor = new Comparor()
const fileClient: FileSystemClient = new FileSystemClient()

logger.log(`api-diff v.${version}\n===`)

require('dotenv').config()
const errors: Array<string> = validateEnv()
if (errors.length !== 0) {
    errors.forEach((error: string) => {
        logger.error(error)
    })
    process.exit()
}
setDefaults()

const oldServerCredentials: Credentials = {
    username: process.env.OLD_AUTH_USERNAME,
    password: process.env.OLD_AUTH_PASSWORD,
}

const newServerCredentials: Credentials = {
    username: process.env.NEW_AUTH_USERNAME,
    password: process.env.NEW_AUTH_PASSWORD,
}

const authOld: AuthDriverInterface = new LexiaCookieAuthDriver(process.env.OLD_AUTH_URL, oldServerCredentials)
const authNew: AuthDriverInterface = new LexiaCookieAuthDriver(process.env.NEW_AUTH_URL, newServerCredentials)
Promise.all([authOld.auth(), authNew.auth(), fileClient.read(process.env.ENDPOINTS_FILE_NAME)]).then((values) => {
    logger.log(values[0])
    logger.log(values[1])
    logger.log(`File ${process.env.ENDPOINTS_FILE_NAME} is loaded`)
    return compare(values[2])
}).then((diffBucket: DiffBucket) => {
    return saveResult(process.env.DIFF_FILE_NAME, diffBucket)
}).then((message: string) => {
    logger.log(message)
}).catch((error: Error) => {
    logger.error(error.message)
}).finally(() => {
    logger.log("done")
})

async function *packIntoBatches(endpoints: Array<string>): AsyncGenerator<string[][], never, void> {
    const clientOld: HttpClient = new HttpClient(process.env.OLD_HOST, authOld)
    const clientNew: HttpClient = new HttpClient(process.env.NEW_HOST, authNew)
    while (endpoints.length) {
        yield Promise.all(endpoints.splice(0, Number(process.env.PARALLEL_REQUEST_COUNT)).map(async (endpoint: string) => {
                return Promise.all([
                    endpoint,
                    clientNew.fetch(endpoint),
                    clientOld.fetch(endpoint)
                ])
            })
        )
    }

    return
}

async function compare(endpoints: Array<string>): Promise<DiffBucket> {
    const diffs: DiffBucket = {}
    for await (const result of packIntoBatches(endpoints)) {
        result.forEach((requestResult) => {
            const endpoint: string = requestResult[0]
            const diff = comparor.getDifference(requestResult[1], requestResult[2])
            if (diff == null) {
                logger.ok(endpoint)
            } else {
                logger.fail(endpoint)
                diffs[endpoint] = diff
            }
        })
    }

    return Promise.resolve(diffs)
}

async function saveResult(fileName: string, diffBucket: DiffBucket): Promise<string> {
    if (Object.keys(diffBucket).length === 0) {
        return Promise.resolve("All processed endpoints are equal")
    }

    const fileContent: string = DiffFormatter.toPrettyJsonString(diffBucket)
    return fileClient.write(fileName, fileContent)
}

function validateEnv(): Array<string> {
    const errors: Array<string> = []
    const mandatoryVariables: Array<string> = [
        "OLD_AUTH_URL",
        "OLD_AUTH_USERNAME",
        "OLD_AUTH_PASSWORD",
        "OLD_HOST",
        "NEW_AUTH_URL",
        "NEW_AUTH_USERNAME",
        "NEW_AUTH_PASSWORD",
        "NEW_HOST",
    ]

    mandatoryVariables.forEach((varName: string) => {
        if (!(varName in process.env)) {
            errors.push(`Mandatory .env file variable ${varName} doesn't exist`)
        }
    })

    return errors
}

function setDefaults(): void {
    if (!("ENDPOINTS_FILE_NAME" in process.env)) {
        process.env.ENDPOINTS_FILE_NAME = FileSystemClient.DEFAULT_ENDPOINTS_FILENAME
    }

    if (!("DIFF_FILE_NAME" in process.env)) {
        process.env.DIFF_FILE_NAME = FileSystemClient.DEFAULT_OUTPUT_FILENAME
    }

    if (!("PARALLEL_REQUEST_COUNT" in process.env)) {
        process.env.PARALLEL_REQUEST_COUNT = DEFAULT_PARALLEL_REQUEST_COUNT.toString()
    }
}