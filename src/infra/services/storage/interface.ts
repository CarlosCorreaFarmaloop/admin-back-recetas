export interface IStorageService {
  obtenerArchivo: (bucket: string, archivo: string) => Promise<any>;
}
