import { DiffBucket } from 'api-diff'

class DiffFormatter
{
    static toPrettyJsonString(diffBucket: DiffBucket): string {
        return JSON.stringify(diffBucket, null, 2)
    }
}

export default DiffFormatter