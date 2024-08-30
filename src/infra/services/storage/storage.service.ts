import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

import { IStorageService } from './interface';

export class StorageService implements IStorageService {
  private readonly s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({ region: 'us-east-2' });
  }

  async obtenerArchivo(bucket: string, archivo: string) {
    try {
      const command = new GetObjectCommand({ Bucket: bucket, Key: archivo });
      const response = await this.s3Client.send(command);

      if (!response.Body) {
        console.error('Error al obtener archivo: ', JSON.stringify({ bucket, archivo, response }, null, 2));
        throw new Error('Error al obtener archivo.');
      }

      return response.Body;

      // const bodyContents = await this.streamToBuffer(response.Body as ReadableStream);
      // return bodyContents;
    } catch (error) {
      const err = error as Error;
      console.error('Error general al obtener archivo', JSON.stringify({ bucket, archivo, error: err.message }, null, 2));
      throw new Error(err.message);
    }
  }

  // private async streamToBuffer(stream: ReadableStream): Promise<Buffer> {
  //   const chunks: Uint8Array[] = [];
  //   const reader = stream.getReader();

  //   while (true) {
  //     const { done, value } = await reader.read();
  //     if (done) break;
  //     chunks.push(value);
  //   }

  //   return Buffer.concat(chunks);
  // }
}
