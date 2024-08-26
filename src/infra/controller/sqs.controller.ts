import { NotificacionUseCase } from '../../core/modules/notificacion/application/notificacion.usecase';
import { OrdenUseCase } from '../../core/modules/orden/application/orden.usecase';
import { OrdenMongoRepository } from '../repository/orden/orden.repository.mongo';
import { EmailService } from '../services/emailService/email.service';

export const SQSController = async (event: any) => {
  const { action, body } = event;

  const ordenRepository = new OrdenMongoRepository();
  const ordenUseCase = new OrdenUseCase(ordenRepository);

  const emailService = new EmailService();

  const notificacionUseCase = new NotificacionUseCase(ordenUseCase, emailService);

  if (action === 'notificar-paciente') {
    const response = await notificacionUseCase.notificarRecompraPacientesCronicos(body.id);

    return { statusCode: response.status, body: JSON.stringify({ message: response.message, data: response.data }) };
  }

  return { statusCode: 200, body: JSON.stringify(event) };
};
