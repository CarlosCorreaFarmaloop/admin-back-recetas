export interface ITokenManagerService {
  getToken: (secretName: string) => Promise<string>;
}
