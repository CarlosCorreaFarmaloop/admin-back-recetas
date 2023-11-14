const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const credencialsMongo = process.env.MONGO_CONECTION;
const database = process.env.MONGO_DATABASE;

module.exports.handler = async (event, _context, _callback) => {
  const client = new MongoClient(credencialsMongo);

  try {
    await client.connect();
    const connect = client.db(database);

    const collection = await connect.collection('orders');

    const order = event.detail;

    const formatOrdenAdmin = {
      id: order.id || uuidv4(),
      customer: order.customer,
      productsOrder: order.productsOrder.map((product) => {
        return {
          ...product,
          prescription: {
            state: '',
            file: product.prescription || '',
            validation: {
              rut: '',
              comments: '',
            },
          },
        };
      }),
      delivery: {
        ...order.delivery,
        provider: {
          provider: '',
          orderTransport: '',
          urlLabel: '',
        },
      },

      payment: order.payment,
      resumeOrder: order.resumeOrder,
      statusOrder: order.statusOrder || 'VALIDANDO_RECETA',
      createdAt: order.createdAt || new Date(),
      billing: {
        type: '',
        number: '',
        emitter: '',
        urlBilling: '',
      },
    };

    if (order.cotizacion) {
      formatOrdenAdmin.cotizacion = order.cotizacion;
    }

    console.log('--- order received --');
    console.log(JSON.stringify(formatOrdenAdmin));

    await collection.insertOne(formatOrdenAdmin);

    console.log('--- order save sucessfully --');
  } finally {
    await client.close();
    console.log('finalizado');
  }

  return {
    statusCode: '200',
    body: JSON.stringify(event),
  };
};
