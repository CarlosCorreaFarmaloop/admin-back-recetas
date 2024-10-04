import axios, { AxiosInstance } from 'axios';

import { Envio, ICourierService, ObtenerEnviosParams } from './interface';

export class CourierService implements ICourierService {
  private readonly axiosInstance: AxiosInstance;
  private readonly isProd = process.env.ENV === 'PROD';

  constructor() {
    this.axiosInstance = axios.create({
      headers: { 'Content-Type': 'application/json' },
      baseURL: this.isProd ? 'https://ecommerce.fc.farmaloop.cl/courier' : 'https://ecomm-qa.fc.farmaloop.cl/courier',
    });
  }

  async obtenerEnvios(params: ObtenerEnviosParams) {
    try {
      const response = await this.axiosInstance.post<{ data: { respuesta: { envios: Envio[] } } }>('/obtener-envios', {
        ...params,
        productos: [],
      });
      return response.data.data.respuesta.envios;
    } catch (error) {
      const err = error as Error;
      console.log(err.message);
      throw new Error(err.message);
    }
  }
}
