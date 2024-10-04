import axios, { AxiosInstance } from 'axios';

import { EnviarMensajeParams, IWhatsAppService } from './interface';

export class WhatsAppService implements IWhatsAppService {
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.WISECX_API_KEY,
      },
      baseURL: 'https://api.wcx.cloud/core/v1',
    });
  }

  async enviarMensajeRecompra(params: EnviarMensajeParams) {
    try {
      await this.autenticar();

      const {
        asunto,
        etiquetas,
        id_asistente,
        id_template,
        url_carrito,
        nombre_cliente,
        nombre_completo_cliente,
        telefono_cliente,
        correo_electronico_cliente,
      } = params;

      const response = await this.axiosInstance.post('/cases', {
        subject: asunto,
        source_channel: 'whatsapp',
        group_id: 29859,
        tags: etiquetas,
        user_id: id_asistente,
        activities: [
          {
            type: 'user_reply',
            template: {
              template_id: id_template,
              parameters: [
                { key: '1', value: nombre_cliente },
                { key: '1', value: url_carrito },
              ],
            },
            contacts_to: [{ name: nombre_completo_cliente, phone: telefono_cliente, email: correo_electronico_cliente }],
          },
        ],
      });

      return response.data.data;
    } catch (error) {
      const err = error as Error;
      console.log(err.message);
      throw new Error(err.message);
    }
  }

  private async autenticar() {
    try {
      const response = await this.axiosInstance.get<{ token: string }>('/authenticate', {
        params: { user: 'api_farmaloop' },
      });

      this.axiosInstance.defaults.headers.common.Authorization = `Bearer ${response.data.token}`;
    } catch (error) {
      const err = error as Error;
      console.log(err.message);
      throw new Error(err.message);
    }
  }
}
