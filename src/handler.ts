import { SQSHandler } from 'aws-lambda';

import { connectToDatabase } from './database';
import { Order } from './types';
import { generateSignedUrl } from './s3Utils';
import { extrarInfo } from './openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? '';

export const handler: SQSHandler = async (event) => {
  console.log('Event: ', JSON.stringify(event, null, 2));

  const record = event.Records[0];

  try {
    const { id } = JSON.parse(record.body);

    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API Key not configured');
    }

    if (!id) {
      throw new Error('Attribute id is required');
    }

    const db = await connectToDatabase();
    const collection = db.collection<Order>('orders');

    const order = await collection.findOne({ id });
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.statusOrder !== 'ENTREGADO') {
      throw new Error('Order in invalid status');
    }

    const prescriptionRequired = order.productsOrder.some((element) => element.requirePrescription);
    if (!prescriptionRequired) {
      throw new Error('Order does not require a prescription');
    }

    const prescriptionUrl = getPrescriptionUrl(order);
    const signedUrl = await generateSignedUrl(prescriptionUrl);

    console.log('URL: ', signedUrl);

    const response = await extrarInfo(signedUrl);

    console.log('Predicted data: ', response);

    if (!response.clinica || !response.doctor || !response.especialidad) {
      throw new Error('Invalid GPT response');
    }

    await collection.updateOne(
      { id },
      {
        $set: {
          'resumeOrder.prediccion_clinica': response.clinica,
          'resumeOrder.prediccion_doctor': response.doctor,
          'resumeOrder.prediccion_especialidad': response.especialidad,
        },
      }
    );

    console.log('Order updated: ', id);
  } catch (error) {
    const err = error as Error;
    console.log(err.message);
    throw new Error('General error');
  }
};

const getPrescriptionUrl = (order: Order): string => {
  const product = order.productsOrder.find((product) => product.requirePrescription);
  if (!product) return '';

  const prescriptionUrl = product.prescription.file;
  return prescriptionUrl;
};
