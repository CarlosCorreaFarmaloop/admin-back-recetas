import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import crypto from 'crypto';

import { ITokenManagerService } from './interface';

export class TokenManagerService implements ITokenManagerService {
  private readonly client: SecretsManagerClient;
  private readonly secretKey = process.env.SECRET_KEY as string;

  constructor() {
    this.client = new SecretsManagerClient();
  }

  async getToken(secretName: string) {
    try {
      const command = new GetSecretValueCommand({ SecretId: secretName });

      const response = await this.client.send(command);
      if (!response.SecretString) {
        console.log(`Error al obtener token de ${secretName}: `, JSON.stringify(response, null, 2));
        throw new Error(`Error al obtener token de ${secretName}.`);
      }

      const decryptedToken = this.decrypt(response.SecretString);
      return decryptedToken;
    } catch (error) {
      const err = error as Error;
      console.log(`Error al obtener token de ${secretName}: `, err.message);
      throw new Error(`Error al obtener token de  ${secretName}.`);
    }
  }

  private decrypt(encryptedToken: string): string {
    const [ivHex, encryptedHex] = encryptedToken.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-ctr', Buffer.from(this.secretKey, 'hex'), iv);
    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrypted.toString();
  }
}
