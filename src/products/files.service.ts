import { Injectable } from '@nestjs/common';
import { ParseResult, parse } from 'papaparse';
import { Readable } from 'stream';

@Injectable()
export class FilesService {
    async parseCsv(csv: Express.Multer.File): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const stream = Readable.from(csv.buffer.toString());

            const results: any[] = [];

            parse(stream, {
                header: true,
                skipEmptyLines: true,
                delimiter: ',',
                transformHeader: (header) => header.toLowerCase(),
                complete: (parsedResult: ParseResult<Record<string, unknown>>) => {
                    if (parsedResult.data) {
                        results.push(...parsedResult.data);
                    }
                },
                error: (error) => {
                    reject(error.message);
                },
                download: false,
            });

            stream.on('end', () => {
                resolve(results);
            });
        });
    }
}
