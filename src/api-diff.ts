import LexiaCookieAuthDriver from './authDrivers/LexiaCookieAuthDriver'
import HttpClient from './HttpClient'
import Logger from './Logger'
import FileSystemClient from './FileSystemClient'
import Comparor from './Comparor'
import DiffFormatter from './DiffFormatter'
import { Credentials, AuthDriverInterface, DiffBucket } from 'api-diff'
require('dotenv').config()
// TODO: validate .env file

const { version } = require('../package.json')
const logger = new Logger()
const comparor: Comparor = new Comparor(logger)
const fileClient: FileSystemClient = new FileSystemClient()

logger.log(`api-diff v.${version}\n===`)

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
    logger.log(`ERROR: ${error.message}`)
}).finally(() => {
    logger.log("done")
})

async function compare(endpoints: Array<string>): Promise<DiffBucket> {
    const clientOld: HttpClient = new HttpClient(process.env.OLD_HOST, authOld)
    const clientNew: HttpClient = new HttpClient(process.env.NEW_HOST, authNew)
    return comparor.compareEndpoints(endpoints, clientNew, clientOld)
}

async function saveResult(fileName: string, diffBucket: DiffBucket): Promise<string> {
    if (Object.keys(diffBucket).length === 0) {
        return Promise.resolve("All endpoints are equal")
    }

    const fileContent: string = DiffFormatter.toPrettyJsonString(diffBucket)
    return fileClient.write(fileName, fileContent)
}