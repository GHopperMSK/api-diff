class Logger
{
    readonly LINE_MAX_LENGTH: number = 60
    readonly OK_TEXT: string = "[OK]"
    readonly FAIL_TEXT: string = "[FAIL]"
    readonly logger: { (...data: any[]): void; (message?: any, ...optionalParams: any[]): void }

    constructor() {
        this.logger = console.log
    }

    log(message: string) {
        this.logger(message)
    }

    ok(message: string): void {
        const maxMessageLength: number = this.LINE_MAX_LENGTH - (this.OK_TEXT.length + 1)
        if (message.length > maxMessageLength) {
            this.log(message.slice(0, maxMessageLength + 1))
            this.ok("  " + message.slice(maxMessageLength + 1))
            return
        }

        const dotsAmount: number = Math.max(this.LINE_MAX_LENGTH - message.length - this.OK_TEXT.length, 0)
        const line: string = message + ".".repeat(dotsAmount) + this.OK_TEXT
        this.log(line)
    }

    fail(message: string) {
        const maxMessageLength: number = this.LINE_MAX_LENGTH - (this.FAIL_TEXT.length + 1)
        if (message.length > maxMessageLength) {
            this.log(message.slice(0, maxMessageLength + 1))
            this.fail("  " + message.slice(maxMessageLength + 1))
            return
        }

        const dotsAmount: number = Math.max(this.LINE_MAX_LENGTH - message.length - this.FAIL_TEXT.length, 0)
        const line: string = message + ".".repeat(dotsAmount) + this.FAIL_TEXT
        this.log(line)
    }

    error(message: string) {
        this.log("ERROR: " + message)
    }

}

export default Logger