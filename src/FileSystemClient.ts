import * as fs from 'fs'

class FileSystemClient
{
    static readonly ENDPOINTS_FILE: string = "endpoints.txt"
    static readonly OUTPUT_FILE: string = "diff.json"

    async read(filename: string): Promise<Array<string>> {
        return fs.promises.readFile(filename).then((buffer: Buffer) => {
            return new Promise<Array<string>>((resolve, reject) => {
                const lines: Array<string> = buffer.toString().split("\n")
                resolve(this.cleanup(lines))
            })
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