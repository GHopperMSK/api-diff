import * as fs from 'fs'

class FileSystemClient
{
    static readonly DEFAULT_ENDPOINTS_FILENAME: string = "endpoints.txt"
    static readonly DEFAULT_OUTPUT_FILENAME: string = "diff.json"

    async read(fileName: string): Promise<Array<string>> {
        return fs.promises.readFile(fileName).then((buffer: Buffer) => {
            return new Promise<Array<string>>(resolve => {
                const lines: Array<string> = buffer.toString().split("\n")
                resolve(this.cleanup(lines))
            })
        }).catch(() => {
            throw new Error(`Couldn't read ${fileName} file`)
        })
    }

    async write(fileName: string, data: string): Promise<string> {
        await fs.promises.writeFile(fileName, data).catch(() => {
            Promise.reject(`Couldn't save ${fileName} file`)
        })

        return Promise.resolve(`${fileName} file created`)
    }

    private cleanup(lines: Array<string>): Array<string> {
        const res: Array<string> = []
        for (var line of lines) {
            line = line.trim()

            // we don't want empty lines
            if (line.length === 0) {
                continue
            }

            // we don't want comments
            if (line.match(/^#.*$/gm)) {
                continue
            }

            res.push(line)
        }
        return res
    }
}

export default FileSystemClient