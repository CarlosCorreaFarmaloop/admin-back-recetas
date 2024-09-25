import axios, { AxiosInstance } from 'axios';

import { Carrito, ICarritoService } from './interface';

export class CarritoService implements ICarritoService {
  private readonly axiosInstance: AxiosInstance;
  private readonly isProd = process.env.ENV === 'PROD';

  constructor() {
    this.axiosInstance = axios.create({
      headers: { 'Content-Type': 'application/json' },
      baseURL: this.isProd ? 'https://ecommerce.fc.farmaloop.cl/carrito' : 'https://ecomm-qa.fc.farmaloop.cl/carrito',
    });
  }

  async crearCarrito(carrito: Carrito) {
    try {
      const response = await this.axiosInstance.post<{ data: Carrito }>('/crear-o-actualizar', carrito);

      return response.data.data;
    } catch (error) {
      const err = error as Error;
      console.log(err.message);
      throw new Error(err.message);
    }
  }

  async obtenerCarrito(id: string) {
    try {
      const response = await this.axiosInstance.get<{ data: Carrito }>(`/obtener-carrito/${id}`);

      return response.data.data;
    } catch (error) {
      const err = error as Error;
      console.log(err.message);
      throw new Error(err.message);
    }
  }
}
