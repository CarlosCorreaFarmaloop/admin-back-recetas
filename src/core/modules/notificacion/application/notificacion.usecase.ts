/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { v4 as uuid } from 'uuid';

import { HttpCodes } from './api.response';
import { INotificacionUseCase } from './notificacion.usecase.interface';
import { IEmailService } from '../../../../infra/services/emailService/interface';
import { OrdenEntity } from '../../orden/domain/orden.entity';
import { IOrdenUseCase } from '../../orden/application/orden.usecase.interface';
import { IStorageService } from '../../../../infra/services/storage/interface';
import { IProductoUseCase } from '../../producto/application/producto.usecase.interface';
import { Carrito, ICarritoService } from '../../../../infra/services/carritoService/interface';
import { IWhatsAppService } from '../../../../infra/services/whatsAppService/interface';
import { NotificacionRepository } from '../domain/notificacion.repository';
import { NotificacionVO } from '../domain/notificacion.vo';
import { NotificacionEntity } from '../domain/notificacion.entity';
import { ICourierService } from '../../../../infra/services/courierService/interface';

export class NotificacionUseCase implements INotificacionUseCase {
  private readonly isProd = process.env.ENV === 'PROD';
  private readonly productos_fertilidad = [
    '140362',
    '140361',
    '140312',
    '140220',
    '140219',
    '140218',
    '140590',
    '140589',
    '140588',
    '140274',
    '140217',
    '140091',
  ];

  constructor(
    private readonly notificacionRepository: NotificacionRepository,
    private readonly ordenUseCase: IOrdenUseCase,
    private readonly productosUseCase: IProductoUseCase,
    private readonly emailService: IEmailService,
    private readonly storageService: IStorageService,
    private readonly carritoService: ICarritoService,
    private readonly whatsAppService: IWhatsAppService,
    private readonly courierService: ICourierService
  ) {}

  async notificarRecompraPacientes() {
    console.log('Entra notificarRecompraPacientesCronicos()');

    const { inicio, final } = this.obtenerRangoDe25Dias();

    const ordenes = (await this.ordenUseCase.obtenerOrdenesPagadasPorRangoDeFechas(inicio, final)).data;

    const ordenes_sin_fertilidad = ordenes.filter(
      (orden) => !orden.productsOrder.some((producto) => this.productos_fertilidad.includes(producto.sku))
    );

    const productos_con_stock = (await this.productosUseCase.obtenerProductosConStock()).data;

    const skus_con_stock = productos_con_stock.map((producto) => producto.sku);

    const ordenes_con_stock = ordenes_sin_fertilidad
      .map((orden) => {
        const productos_filtrados = orden.productsOrder.filter((element) => skus_con_stock.includes(element.sku));
        return { ...orden, productsOrder: productos_filtrados };
      })
      .filter((orden) => orden.productsOrder.length > 0);

    const nuevos_carritos = [];

    for (const orden of ordenes_con_stock) {
      const carrito_pagado = await this.carritoService.obtenerCarrito(orden.resumeOrder.cartId);

      const productos = carrito_pagado.productos.filter((producto) => skus_con_stock.includes(producto.sku));

      const productos_finales = productos.map((producto) => {
        const producto_base = productos_con_stock.find(({ sku }) => sku === producto.sku);
        if (!producto_base) {
          return producto;
        }

        const lote_base = producto_base.batchs.find(({ id }) => id === producto.batch.id);

        return {
          ...producto,
          batch: {
            id: lote_base ? lote_base.id : producto_base.batchs[0].id,
            active: true,
            bestDiscount: producto.batch.bestDiscount,
            expireDate: lote_base ? new Date(lote_base.expireDate) : new Date(producto_base.batchs[0].expireDate),
            normalPrice: lote_base ? lote_base.normalPrice : producto_base.batchs[0].normalPrice,
            qty: producto.batch.qty,
            settlementPrice: lote_base ? lote_base.settlementPrice : producto_base.batchs[0].settlementPrice,
            stock: lote_base ? lote_base.stock : producto_base.batchs[0].stock,
          },
        };
      });

      if (productos_finales.length > 0 && carrito_pagado.email) {
        nuevos_carritos.push({
          billetera: 'Transbank',
          codigo_cupon: '',
          compartido_por: 'Campana Recompra',
          compromiso_entrega: carrito_pagado.compromiso_entrega,
          comuna: carrito_pagado.comuna,
          createdAt: new Date().getTime(),
          descuento_total: 0,
          direccion_numero: carrito_pagado.direccion_numero,
          direccion: carrito_pagado.direccion,
          email: carrito_pagado.email,
          es_delivery: carrito_pagado.es_delivery,
          es_direccion_exacta: carrito_pagado.es_direccion_exacta,
          fecha_compartido: new Date().getTime(),
          id: uuid(),
          latitud: carrito_pagado.latitud,
          longitud: carrito_pagado.longitud,
          nombre_completo: carrito_pagado.nombre_completo,
          numero_depto: carrito_pagado.numero_depto,
          place_id: carrito_pagado.place_id,
          precio_delivery: carrito_pagado.precio_delivery,
          productos: productos_finales,
          referencia_cupon: '',
          referrer: '',
          region: carrito_pagado.region,
          telefono: carrito_pagado.telefono,
          tipo_cupon: '',
          tipo_de_casa: carrito_pagado.tipo_de_casa,
          tipo_envio: carrito_pagado.tipo_envio,
        });
      }
    }

    console.log('Cantidad de clientes a notificar hoy: ', nuevos_carritos.length);

    for (const nuevo_carrito of nuevos_carritos) {
      const carrito_creado = await this.carritoService.crearCarrito(nuevo_carrito);

      await this.emailService.enviarNotificacionHTML({
        asunto: 'Ahorra hasta 80 DCTO renovando tus medicamentos',
        destinatarios: [carrito_creado.email.trim()],
        // destinatarios: ['matias.martinez@farmaloop.cl'],
        fuente: 'Recordatorios Farmaloop <notificaciones@farmaloop.cl>',
        html: this.generarHTMLRecompra(carrito_creado),
      });

      const notificacion = new NotificacionVO().crear(
        {
          cantidad_notificaciones: 1,
          carrito_id: carrito_creado.id,
          correo_electronico: carrito_creado.email,
          nombre: carrito_creado.nombre_completo,
          telefono: carrito_creado.telefono,
          tipo: 'Recompra',
        },
        'Correo'
      );
      await this.notificacionRepository.crearNotificacion(notificacion);

      console.log(`Notificacion enviada a ${carrito_creado.email} - ${carrito_creado.id}`);
    }

    return { data: true, message: 'Ok.', status: HttpCodes.OK };
  }

  async notificarRecompraPacientesSegundoToque() {
    console.log('Entra notificarRecompraPacientesSegundoToque()');

    const { inicio, final } = this.obtenerRangoDe3Dias();
    const notificaciones = await this.notificacionRepository.obtenerNotificacionesPorRangoYTipo(inicio, final, 'Recompra');

    const notificaciones_sin_pagar = await this.removerNotificacionesPagadas(notificaciones);

    console.log('Cantidad de clientes a enviar un segundo toque de recompra: ', notificaciones_sin_pagar.length);

    for (const notificacion of notificaciones_sin_pagar) {
      try {
        const carrito = await this.transformarCarritoADeliveryYAplicarCupon(notificacion);

        await this.emailService.enviarNotificacionHTML({
          asunto: 'Despacho gratis renovando tus medicamentos',
          destinatarios: [carrito.email.trim()],
          // destinatarios: ['matias.martinez@farmaloop.cl'],
          fuente: 'Recordatorios Farmaloop <notificaciones@farmaloop.cl>',
          html: this.generarHTMLRecompraConDescuento(carrito),
        });

        const notificacion_correo = new NotificacionVO().agregarNotificacion(notificacion, 'Correo');
        const notificacion_correo_actualizada = await this.notificacionRepository.actualizarNotificacion(notificacion_correo);

        console.log(`Notificacion de recompra enviada a ${carrito.email} - ${carrito.id}`);

        await this.whatsAppService.enviarMensajeRecompra({
          asunto: `Cart Recovery - ${carrito.id}`,
          etiquetas: ['Cart Recovery', 'Via API'],
          id_asistente: 41365,
          id_template: 19409,
          url_carrito: `check-out/?share=${carrito.id}&utm_source=whatsapp&utm_medium=messaging_app&utm_campaign=recompra`,
          nombre_cliente: carrito.nombre_completo.trim().split(' ')[0],
          nombre_completo_cliente: carrito.nombre_completo,
          // telefono_cliente: '+5492634622209', // 5493541544511 56961717175 5492634622209 56945190245
          telefono_cliente: carrito.telefono.trim(),
          correo_electronico_cliente: carrito.email.trim(),
        });

        const notificacion_whatsapp = new NotificacionVO().agregarNotificacion(notificacion_correo_actualizada, 'WhatsApp');
        await this.notificacionRepository.actualizarNotificacion(notificacion_whatsapp);

        console.log(`WhatsApp de recompra enviado a ${carrito.email} - ${carrito.id}`);
      } catch (error) {
        console.log('Error al enviar notificacion de recompra a: ', notificacion);
      }
    }

    return { data: true, message: 'Ok.', status: HttpCodes.OK };
  }

  async notificarBoleta(id: string) {
    console.log('Entra notificarBoleta(): ', id);

    const orden = (await this.ordenUseCase.obtenerOrdenPorId(id)).data;

    if (!orden.customer) {
      console.log('La orden no tiene cliente para notificar boleta: ', JSON.stringify(orden, null, 2));
      return { data: true, message: 'Ok.', status: HttpCodes.OK };
    }

    const file = this.isProd ? `documentos-tributarios/BE-${id}.pdf` : `documentos-tributarios-qa/BE-${id}.pdf`;
    const boletaBuffer = await this.storageService.obtenerArchivo('farmaloop-privados', file);

    await this.emailService.enviarNotificacionHTMLConAdjuntos({
      archivo: {
        archivo: `BE-${id}.pdf`,
        contenido: boletaBuffer,
      },
      asunto: `Boleta Electrónica ${id} - Farmaloop`,
      destinatarios: [orden.customer],
      fuente: 'Notificaciones Farmaloop <notificaciones@farmaloop.cl>',
      html: this.generarHTMLBoleta(orden),
    });

    return { data: true, message: 'Ok.', status: HttpCodes.OK };
  }

  private generarHTMLRecompra(carrito: Carrito): string {
    const { email, id, nombre_completo, productos } = carrito;

    const total = productos.reduce((acc: number, element) => acc + element.batch.qty * element.batch.settlementPrice, 0);
    const ahorro_total = productos.reduce(
      (acc: number, element) => acc + (element.batch.normalPrice - element.batch.settlementPrice) * element.batch.qty,
      0
    );

    const link_carrito = this.isProd
      ? `https://www.farmaloop.cl/check-out/?share=${id}`
      : `https://ecomm-qa.fc.farmaloop.cl/check-out/?share=${id}`;

    const html = `
      <html>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
        </head>

        <body style="background-color: #ffffff; width:95%; height: 100%; display: inline-block; margin: 0px auto; font-family: 'Poppins', sans-serif; justify-content: center; color: #000000;>
          <div style="display:block; color:#000; background:#fff; width:100%; max-width: 500px; margin:auto; margin-top: 0px auto; text-align: center;">
            <div style="text-align: center; margin: auto; margin-top: 30px;">
              <img src="https://d35lrmue8i33t5.cloudfront.net/campanas/logo.png" width="64px" height="auto">
            </div>

            <div style="text-align:center; margin: auto; margin-top: 32px;">
              <h1 style="font-size: 24px; font-weight: 600; margin: 0; font-family: 'Poppins', sans-serif;">
                ${nombre_completo.trim().split(' ')[0]}, renueva tu última compra en Farmaloop!
              </h1>
            </div>

            <div style="text-align:center; margin: auto; margin-top: 32px;">
              <p style="font-size: 16px; font-weight: 500; font-family: 'Poppins', sans-serif;">
                Recíbela dentro de las próximas 24 hs
              </p>
            </div>

            <div style="width: 100%; max-width: 600px; margin: auto; margin-top: 48px;">
              <table cellspacing="0" cellpadding="0" border="0" style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead style="background-color: #3753FF; color: white;">
                  <tr>
                    <th style="text-align: center; font-size: 12px; font-weight: 400; padding: 4px 0; padding-left: 20px; font-family: 'Poppins', sans-serif;">Producto</th>
                    <th style="text-align: center; font-size: 12px; font-weight: 400; padding: 4px 0; font-family: 'Poppins', sans-serif;">Cantidad</th>
                    <th style="text-align: right; font-size: 12px; font-weight: 400; padding: 4px 0; font-family: 'Poppins', sans-serif;">Precio normal</th>
                    <th style="text-align: right; font-size: 12px; font-weight: 400; padding: 4px 0; padding-right: 20px; font-family: 'Poppins', sans-serif;">Precio liquidación</th>
                  </tr>
                </thead>
                <tbody>
                  ${productos
                    .map(
                      (element) => `
                    <tr style="border-bottom: 1px solid #00000020; height: 100px;">
                      <td style="text-align: center;">
                        <img src=${element.photoURL} alt=${element.fullName} style="width: auto; height: 90px;">
                      </td>
                      <td style="text-align: center; font-family: 'Poppins', sans-serif;">${element.batch.qty}</td>
                      <td style="text-align: right; text-decoration: line-through; font-family: 'Poppins', sans-serif;">${this.formatCLP(
                        element.batch.normalPrice
                      )}</td>
                      <td style="font-size: 16px; text-align: right; font-family: 'Poppins', sans-serif; padding-right: 20px; color: #3753FF;">${this.formatCLP(
                        element.batch.settlementPrice
                      )}</td>
                    </tr>
                  `
                    )
                    .join('')}
                  <tr>
                    <td></td>
                    <td></td>
                    <td style="text-align: right; font-weight: 600; padding: 12px; font-family: 'Poppins', sans-serif;">Total</td>
                    <td style="font-size: 16px; text-align: right; padding: 12px 0; padding-right: 20px; font-family: 'Poppins', sans-serif;">
                      ${this.formatCLP(total)}
                    </td>
                  </tr>
                  ${
                    ahorro_total > 0
                      ? `
                      <tr>
                        <td></td>
                        <td></td>
                        <td> </td>
                        <td style="font-size: 16px; font-weight: 600; text-align: right; padding: 12px 0; padding-right: 20px; font-family: 'Poppins', sans-serif; color: #23AE00;">
                          ¡Ahorras ${this.formatCLP(ahorro_total)}!
                        </td>
                      </tr>
                    `
                      : ''
                  }
                  
                </tbody>
              </table>
            </div>

            <div style="text-align:center; margin: auto; margin-top: 36px;">
              <a href=${link_carrito} style="background-color: #FE0046; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                <span style="font-size: 18px; font-weight: 600; color: #ffffff; margin: 0; font-family: 'Poppins', sans-serif;">COMPRA AQUÍ</span>
                <img src="https://d35lrmue8i33t5.cloudfront.net/campanas/click.png" alt="Icono" style="vertical-align: middle; width: 18px; height: 18px; margin-left: 6px; margin-bottom: 6px;">
              </a>
            </div>

            <div style="text-align:center; margin: auto; margin-top: 56px;">
              <p style="font-size: 10px; font-weight: 400; font-family: 'Poppins', sans-serif;">
                Si no desea recibir más notificaciones <a href="https://www.farmaloop.cl/cancelar-suscripcion/?correo_electronico=${email.trim()}" target="_blank" style="color: #3753FF; cursor: pointer; text-decoration: none;">click aquí<a/> para desuscribirse
              </p>
            </div>

            <div style="text-align: center; margin: 0 auto; margin-top: 16px;">
              <img src="https://d35lrmue8i33t5.cloudfront.net/campanas/envio-farmaloop.png" width="500px" height="auto">
            </div>

            <div style="text-align: center;">
              <table style="width: 100%; max-width: 600px; margin: auto; background-color: #F1F1F1; padding: 4px 12px;">
                <tr>
                  <td style="text-align: left;">
                    <p style="margin: 0; font-size: 14px; font-weight: 400; font-family: 'Poppins', sans-serif;">Farmaloop</p>
                    <p style="margin: 0; font-size: 14px; font-weight: 400; font-family: 'Poppins', sans-serif;">contacto@farmaloop.cl</p>
                  </td>

                  <td style="text-align: right;">
                    <a href="https://www.facebook.com/farmaloopchile/" target="_blank" style="text-decoration: none;">
                      <img src="https://d35lrmue8i33t5.cloudfront.net/campanas/facebook.png" alt="Facebook" style="width: 30px; height: 30px; margin-right: 10px;">
                    </a>
                    <a href="https://www.instagram.com/farmaloopchile/" target="_blank" style="text-decoration: none;">
                      <img src="https://d35lrmue8i33t5.cloudfront.net/campanas/instagram.png" alt="Instagram" style="width: 30px; height: 30px; margin-right: 10px;">
                    </a>
                    <a href="https://www.linkedin.com/company/farmaloop/" target="_blank" style="text-decoration: none;">
                      <img src="https://d35lrmue8i33t5.cloudfront.net/campanas/linkedin.png" alt="LinkedIn" style="width: 30px; height: 30px;">
                    </a>
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </body>
      </html>
    `;

    return html;
  }

  private generarHTMLRecompraConDescuento(carrito: Carrito): string {
    const { email, id, nombre_completo, productos } = carrito;

    const total = productos.reduce((acc: number, element) => acc + element.batch.qty * element.batch.settlementPrice, 0);
    const ahorro_total = productos.reduce(
      (acc: number, element) => acc + (element.batch.normalPrice - element.batch.settlementPrice) * element.batch.qty,
      0
    );

    const link_carrito = this.isProd
      ? `https://www.farmaloop.cl/check-out/?share=${id}&utm_source=email_marketing&utm_medium=email&utm_campaign=recompra`
      : `https://ecomm-qa.fc.farmaloop.cl/check-out/?share=${id}&utm_source=email_marketing&utm_medium=email&utm_campaign=recompra`;

    const html = `
      <html>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
        </head>

        <body style="background-color: #ffffff; width:95%; height: 100%; display: inline-block; margin: 0px auto; font-family: 'Poppins', sans-serif; justify-content: center; color: #000000;>
          <div style="display:block; color:#000; background:#fff; width:100%; max-width: 500px; margin:auto; margin-top: 0px auto; text-align: center;">
            <div style="text-align: center; margin: auto; margin-top: 30px;">
              <img src="https://d35lrmue8i33t5.cloudfront.net/campanas/logo.png" width="64px" height="auto">
            </div>

            <div style="text-align:center; margin: auto; margin-top: 32px;">
              <h1 style="font-size: 24px; font-weight: 600; margin: 0; font-family: 'Poppins', sans-serif;">
                ${nombre_completo.trim().split(' ')[0]}, renueva tu última compra en Farmaloop!
              </h1>
            </div>

            <div style="text-align:center; margin: auto; margin-top: 32px;">
              <p style="font-size: 16px; font-weight: 500; font-family: 'Poppins', sans-serif;">
                Recíbela dentro de las próximas 24 hs con ENVÍO GRATIS
              </p>
            </div>

            <div style="width: 100%; max-width: 600px; margin: auto; margin-top: 48px;">
              <table cellspacing="0" cellpadding="0" border="0" style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead style="background-color: #3753FF; color: white;">
                  <tr>
                    <th style="text-align: center; font-size: 12px; font-weight: 400; padding: 4px 0; padding-left: 20px; font-family: 'Poppins', sans-serif;">Producto</th>
                    <th style="text-align: center; font-size: 12px; font-weight: 400; padding: 4px 0; font-family: 'Poppins', sans-serif;">Cantidad</th>
                    <th style="text-align: right; font-size: 12px; font-weight: 400; padding: 4px 0; font-family: 'Poppins', sans-serif;">Precio normal</th>
                    <th style="text-align: right; font-size: 12px; font-weight: 400; padding: 4px 0; padding-right: 20px; font-family: 'Poppins', sans-serif;">Precio liquidación</th>
                  </tr>
                </thead>
                <tbody>
                  ${productos
                    .map(
                      (element) => `
                    <tr style="border-bottom: 1px solid #00000020; height: 100px;">
                      <td style="text-align: center;">
                        <img src=${element.photoURL} alt=${element.fullName} style="width: auto; height: 90px;">
                      </td>
                      <td style="text-align: center; font-family: 'Poppins', sans-serif;">${element.batch.qty}</td>
                      <td style="text-align: right; text-decoration: line-through; font-family: 'Poppins', sans-serif;">${this.formatCLP(
                        element.batch.normalPrice
                      )}</td>
                      <td style="font-size: 16px; text-align: right; font-family: 'Poppins', sans-serif; padding-right: 20px; color: #3753FF;">${this.formatCLP(
                        element.batch.settlementPrice
                      )}</td>
                    </tr>
                  `
                    )
                    .join('')}
                  <tr>
                    <td></td>
                    <td></td>
                    <td style="text-align: right; font-weight: 600; padding: 12px; font-family: 'Poppins', sans-serif;">Total</td>
                    <td style="font-size: 16px; text-align: right; padding: 12px 0; padding-right: 20px; font-family: 'Poppins', sans-serif;">
                      ${this.formatCLP(total)}
                    </td>
                  </tr>
                  ${
                    ahorro_total > 0
                      ? `
                      <tr>
                        <td></td>
                        <td></td>
                        <td> </td>
                        <td style="font-size: 16px; font-weight: 600; text-align: right; padding: 12px 0; padding-right: 20px; font-family: 'Poppins', sans-serif; color: #23AE00;">
                          ¡Ahorras ${this.formatCLP(ahorro_total)}!
                        </td>
                      </tr>
                    `
                      : ''
                  }
                  
                </tbody>
              </table>
            </div>

            <div style="text-align: center; margin: auto; margin-top: 36px;">
              <a href=${link_carrito} style="background-color: #FE0046; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                <span style="font-size: 18px; font-weight: 600; color: #ffffff; margin: 0; font-family: 'Poppins', sans-serif;">COMPRA AQUÍ</span>
                <img src="https://d35lrmue8i33t5.cloudfront.net/campanas/click.png" alt="Icono" style="vertical-align: middle; width: 18px; height: 18px; margin-left: 6px; margin-bottom: 6px;">
              </a>
            </div>

            <div style="text-align: center; margin: auto; margin-top: 56px;">
              <p style="font-size: 14px; font-weight: 400; font-family: 'Poppins', sans-serif; color: #00000080;">
                Envío gratis en RM y $3.500 descuento a Regiones. 
              </p>
              <p style="font-size: 14px; font-weight: 400; font-family: 'Poppins', sans-serif; color: #00000080;">
                Monto mínimo de compra: $25.000
              </p>
            </div>

            <div style="text-align: center; margin: auto; margin-top: 56px;">
              <p style="font-size: 10px; font-weight: 400; font-family: 'Poppins', sans-serif;">
                Si no desea recibir más notificaciones <a href="https://www.farmaloop.cl/cancelar-suscripcion/?correo_electronico=${email.trim()}" target="_blank" style="color: #3753FF; cursor: pointer; text-decoration: none;">click aquí<a/> para desuscribirse
              </p>
            </div>

            <div style="text-align: center; margin: 0 auto; margin-top: 16px;">
              <img src="https://d35lrmue8i33t5.cloudfront.net/campanas/envio-farmaloop.png" width="500px" height="auto">
            </div>

            <div style="text-align: center;">
              <table style="width: 100%; max-width: 600px; margin: auto; background-color: #F1F1F1; padding: 4px 12px;">
                <tr>
                  <td style="text-align: left;">
                    <p style="margin: 0; font-size: 14px; font-weight: 400; font-family: 'Poppins', sans-serif;">Farmaloop</p>
                    <p style="margin: 0; font-size: 14px; font-weight: 400; font-family: 'Poppins', sans-serif;">contacto@farmaloop.cl</p>
                  </td>

                  <td style="text-align: right;">
                    <a href="https://www.facebook.com/farmaloopchile/" target="_blank" style="text-decoration: none;">
                      <img src="https://d35lrmue8i33t5.cloudfront.net/campanas/facebook.png" alt="Facebook" style="width: 30px; height: 30px; margin-right: 10px;">
                    </a>
                    <a href="https://www.instagram.com/farmaloopchile/" target="_blank" style="text-decoration: none;">
                      <img src="https://d35lrmue8i33t5.cloudfront.net/campanas/instagram.png" alt="Instagram" style="width: 30px; height: 30px; margin-right: 10px;">
                    </a>
                    <a href="https://www.linkedin.com/company/farmaloop/" target="_blank" style="text-decoration: none;">
                      <img src="https://d35lrmue8i33t5.cloudfront.net/campanas/linkedin.png" alt="LinkedIn" style="width: 30px; height: 30px;">
                    </a>
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </body>
      </html>
    `;

    return html;
  }

  private generarHTMLBoleta(orden: OrdenEntity): string {
    const { customer, id, delivery } = orden;
    const { firstName: nombre_cliente } = delivery.delivery_address;

    const html = `
      <html>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
        </head>

        <body style="background-color: #ffffff; width:95%; height: 100%; display: inline-block; margin: 0px auto; font-family: 'Poppins', sans-serif; justify-content: center; color: #000000;>
          <div style="display:block; color:#000; background:#fff; width:100%; max-width: 600px; margin:auto; margin-top: 0px auto; text-align: center;">
            <div style="text-align: center; margin: auto; margin-top: 30px;">
              <img src="https://farmaloop-publicos.s3.us-east-2.amazonaws.com/ecommerce/images/assets/farma_original.png" width="64px" height="auto">
            </div>

            <div style="text-align:center; margin: auto; margin-top: 32px;">
              <p style="font-size: 16px; font-weight: 600;">
                ¡Hola ${nombre_cliente.split(' ')[0]}!
              </p>
            </div>

            <div style="text-align:center; margin: auto; margin-top: 32px; max-width: 355px;">
              <p style="font-size: 14px; font-weight: 400; margin: 0;">
                Te enviamos adjunta la boleta electrónica de tu compra en Farmaloop.
              </p>
              <p style="font-size: 14px; font-weight: 400; margin: 0; margin-top: 12px;">
                Número de Compra: <b>${id}</b>
              </p>
            </div>

            <div style="text-align:center; margin: auto; margin-top: 56px;">
              <p style="font-size: 10px; font-weight: 400;">
                Si no desea recibir más notificaciones <a href="https://www.farmaloop.cl/cancelar-suscripcion/?correo_electronico=${customer}" target="_blank" style="color: #3753FF; cursor: pointer; text-decoration: none;">click aquí<a/> para desuscribirse
              </p>
            </div>

            <div style="text-align: center; margin-top: 16px;">
              <table style="width: 100%; max-width: 600px; margin: auto; background-color: #F1F1F1; padding: 4px 12px;">
                <tr>
                  <td style="text-align: left;">
                    <p style="margin: 0; font-size: 14px; font-weight: 400;">Farmaloop</p>
                    <p style="margin: 0; font-size: 14px; font-weight: 400;">contacto@farmaloop.cl</p>
                  </td>

                  <td style="text-align: right;">
                    <a href="https://www.facebook.com/farmaloopchile/" target="_blank" style="text-decoration: none;">
                      <img src="https://d35lrmue8i33t5.cloudfront.net/campanas/facebook.png" alt="Facebook" style="width: 30px; height: 30px; margin-right: 10px;">
                    </a>
                    <a href="https://www.instagram.com/farmaloopchile/" target="_blank" style="text-decoration: none;">
                      <img src="https://d35lrmue8i33t5.cloudfront.net/campanas/instagram.png" alt="Instagram" style="width: 30px; height: 30px; margin-right: 10px;">
                    </a>
                    <a href="https://www.linkedin.com/company/farmaloop/" target="_blank" style="text-decoration: none;">
                      <img src="https://d35lrmue8i33t5.cloudfront.net/campanas/linkedin.png" alt="LinkedIn" style="width: 30px; height: 30px;">
                    </a>
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </body>
      </html>
    `;

    return html;
  }

  private formatCLP(number: string | number): string {
    const format = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(number));
    return format;
  }

  private obtenerRangoDe25Dias() {
    const fecha_hoy = new Date();

    const fecha = new Date(fecha_hoy);
    fecha.setDate(fecha_hoy.getDate() - 25);

    const fecha_inicio = new Date(fecha);
    fecha_inicio.setHours(0, 0, 0, 0);

    const fecha_final = new Date(fecha);
    fecha_final.setHours(23, 59, 59, 999);

    return { inicio: fecha_inicio.getTime(), final: fecha_final.getTime() };
  }

  private obtenerRangoDe3Dias() {
    const fecha_hoy = new Date();

    const fecha = new Date(fecha_hoy);
    fecha.setDate(fecha_hoy.getDate() - 3);

    const fecha_inicio = new Date(fecha);
    fecha_inicio.setHours(0, 0, 0, 0);

    const fecha_final = new Date(fecha);
    fecha_final.setHours(23, 59, 59, 999);

    return { inicio: fecha_inicio.getTime(), final: fecha_final.getTime() };
  }

  private async removerNotificacionesPagadas(notificaciones: NotificacionEntity[]): Promise<NotificacionEntity[]> {
    const carritos = await Promise.all(
      notificaciones.map(async (notificacion) => {
        try {
          const carrito = await this.carritoService.obtenerCarrito(notificacion.carrito_id);
          return { notificacion, pagado: carrito.estado === 'PAGADO', vacio: carrito.productos.length === 0 };
        } catch (error) {
          console.error('Error al obtener carrito: ', notificacion.carrito_id);
          return { notificacion, pagado: true, vacio: true };
        }
      })
    );

    const carritos_sin_pagar = carritos.filter((carrito) => !carrito.pagado && !carrito.vacio);
    const notificaciones_sin_pagar = carritos_sin_pagar.map((carrito) => carrito.notificacion);
    return notificaciones_sin_pagar;
  }

  private async transformarCarritoADeliveryYAplicarCupon(notificacion: NotificacionEntity) {
    const carrito = await this.carritoService.obtenerCarrito(notificacion.carrito_id);

    const envios = await this.courierService
      .obtenerEnvios({ comuna: carrito.comuna, region: carrito.region, email: carrito.email })
      .catch(() => {
        console.log('Error al obtener envios de carrito: ', carrito.id);
        return null;
      });

    const envio = envios?.find((envio) => envio.tipo === 'Envío 24 horas hábiles' || envio.tipo === 'Envío Estándar (48 horas hábiles)');

    const nuevo_Carrito = await this.carritoService
      .crearCarrito({
        codigo_cupon: 'recompraloop',
        compromiso_entrega: envio?.fecha_entrega ?? 0,
        createdAt: carrito.createdAt,
        descuento_total: 3500,
        es_delivery: true,
        id: carrito.id,
        precio_delivery: envio?.precio ?? 0,
        referencia_cupon: 'coupon',
        tipo_cupon: 'Delivery',
        tipo_envio: envio?.tipo ?? '',
      })
      .catch(() => {
        console.log('Error al actualizar carrito con descuento: ', carrito.id);
        return carrito;
      });

    return nuevo_Carrito;
  }
}
