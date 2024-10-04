import { ProductoUseCase } from '../../core/modules/producto/application/producto.usecase';
import { NotificacionUseCase } from '../../core/modules/notificacion/application/notificacion.usecase';
import { OrdenUseCase } from '../../core/modules/orden/application/orden.usecase';
import { OrdenMongoRepository } from '../repository/orden/orden.repository.mongo';
import { ProductoMongoRepository } from '../repository/producto/producto.repository.mongo';
import { EmailService } from '../services/emailService/email.service';
import { StorageService } from '../services/storage/storage.service';
import { CarritoService } from '../services/carritoService/carrito.service';
import { NotificacionDynamoRepository } from '../repository/notificacion/notificacion.repository.dynamo';
import { WhatsAppService } from '../services/whatsAppService/whatsApp.service';
import { CourierService } from '../services/courierService/courier.service';

export const SQSController = async (event: any) => {
  const { action, body } = event;

  const notificacionRepository = new NotificacionDynamoRepository();

  const ordenRepository = new OrdenMongoRepository();
  const ordenUseCase = new OrdenUseCase(ordenRepository);

  const productoRepository = new ProductoMongoRepository();
  const productoUseCase = new ProductoUseCase(productoRepository);

  const emailService = new EmailService();
  const storageService = new StorageService();
  const carritoService = new CarritoService();
  const whatsAppService = new WhatsAppService();
  const courierService = new CourierService();

  const notificacionUseCase = new NotificacionUseCase(
    notificacionRepository,
    ordenUseCase,
    productoUseCase,
    emailService,
    storageService,
    carritoService,
    whatsAppService,
    courierService
  );

  if (action === 'notificar-recompra') {
    const response = await notificacionUseCase.notificarRecompraPacientes();
    return { statusCode: response.status, body: JSON.stringify({ message: response.message, data: response.data }) };
  }

  if (action === 'notificar-recompra-segundo-toque') {
    const response = await notificacionUseCase.notificarRecompraPacientesSegundoToque();
    return { statusCode: response.status, body: JSON.stringify({ message: response.message, data: response.data }) };
  }

  if (action === 'notificar-boleta') {
    const response = await notificacionUseCase.notificarBoleta(body.id);
    return { statusCode: response.status, body: JSON.stringify({ message: response.message, data: response.data }) };
  }

  return { statusCode: 200, body: JSON.stringify(event) };
};
