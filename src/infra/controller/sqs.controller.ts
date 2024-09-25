import { ProductoUseCase } from '../../core/modules/producto/application/producto.usecase';
import { NotificacionUseCase } from '../../core/modules/notificacion/application/notificacion.usecase';
import { OrdenUseCase } from '../../core/modules/orden/application/orden.usecase';
import { OrdenMongoRepository } from '../repository/orden/orden.repository.mongo';
import { ProductoMongoRepository } from '../repository/producto/producto.repository.mongo';
import { EmailService } from '../services/emailService/email.service';
import { StorageService } from '../services/storage/storage.service';
import { CarritoService } from '../services/carritoService/carrito.service';

export const SQSController = async (event: any) => {
  const { action, body } = event;

  const ordenRepository = new OrdenMongoRepository();
  const ordenUseCase = new OrdenUseCase(ordenRepository);

  const productoRepository = new ProductoMongoRepository();
  const productoUseCase = new ProductoUseCase(productoRepository);

  const emailService = new EmailService();
  const storageService = new StorageService();
  const carritoService = new CarritoService();

  const notificacionUseCase = new NotificacionUseCase(ordenUseCase, productoUseCase, emailService, storageService, carritoService);

  if (action === 'notificar-pacientes') {
    const response = await notificacionUseCase.notificarRecompraPacientesCronicos();

    return { statusCode: response.status, body: JSON.stringify({ message: response.message, data: response.data }) };
  }

  if (action === 'notificar-boleta') {
    const response = await notificacionUseCase.notificarBoleta(body.id);

    return { statusCode: response.status, body: JSON.stringify({ message: response.message, data: response.data }) };
  }

  return { statusCode: 200, body: JSON.stringify(event) };
};
