import { connectToDatabase } from './database';
import { Order } from './types';
import { generateSignedUrl } from './s3Utils';
import { extrarInfo } from './openai';
import data from '../a.json';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? '';

export const handler = async (event: any) => {
  // console.log('Event: ', JSON.stringify(event, null, 2));

  // const record = event.Records[0];

  try {
    // const id = JSON.parse(record.body)?.detail.id;
    const db = await connectToDatabase();
    const collection = db.collection<Order>('orders');
    for (const orden of data) {
      const order = await collection.findOne({ id: orden.id });

      if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API Key not configured');
      }

      if (!orden) {
        throw new Error('Attribute id is required');
      }

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
      if (!prescriptionUrl) {
        throw new Error('The order does not have a prescription');
      }

      const isPDF = validateIsPDF(prescriptionUrl);
      const signedUrl = await generateSignedUrl(prescriptionUrl);

      const response = await extrarInfo(signedUrl, isPDF);

      console.log('Predicted data: ', JSON.stringify(response, null, 2));
    }

    // if (!response.clinica || !response.doctor || !response.especialidad) {
    //   throw new Error('Invalid GPT response');
    // }

    // await collection.updateOne(
    //   { id },
    //   {
    //     $set: {
    //       'resumeOrder.prediccion_clinica': response.clinica,
    //       'resumeOrder.prediccion_doctor': response.doctor,
    //       'resumeOrder.prediccion_especialidad': response.especialidad,
    //     },
    //   }
    // );

    // console.log('Order updated: ', id);
    return {
      status: 200,
      data: 'Predicted',
      message: 'Predicted',
    };
  } catch (error) {
    const err = error as Error;
    console.log('Error: ', err.message);

    return {
      status: 502,
      data: 'Error',
      message: 'Error',
    };
  }
};

const getPrescriptionUrl = (order: Order): string => {
  const product = order.productsOrder.find((product) => product.requirePrescription);
  if (!product) return '';

  const prescriptionUrl = product.prescription.file;
  return prescriptionUrl;
};

const validateIsPDF = (fileUrl: string): boolean => {
  return fileUrl.toLowerCase().endsWith('.pdf');
};
