const MongoClient = require("mongodb").MongoClient;
const { v4: uuidv4 } = require('uuid');
const credencialsMongo = process.env.mongo_connection;
const database = 'test';

module.exports.handler = async (event, context, callback) => {

    await MongoClient.connect(credencialsMongo).then(async (client) => {

      const connect = await client.db(database);
      const collection = await connect.collection("orders");

      const order = event.detail;

      const FormatOrdenAdmin = {
          "id": order.id || uuidv4(),
          "customer": order.customer,
          "productsOrder": order.productsOrder.map((product) => {
              return {
                  ...product,
                  prescription: {
                      state: "",
                      file: product.prescription || "",
                      validation: {
                          rut: "",
                          comments: ""
                      }
                  }
              } 
          }),
          delivery: { ...order.delivery, 
                      "provider": {
                          "provider": "",
                          "orderTransport": "",
                          "urlLabel": ""
                      }},
          
          
          "payment": order.payment,
          "resumeOrder": order.resumeOrder,
          "statusOrder": order.statusOrder || "VALIDANDO_RECETA",
          "createdAt": order.createdAt || new Date(),
          "billing": {
              "type": "",
              "number": "",
              "emitter": "",
              "urlBilling": ""
          },
      }


      console.log('--- order received --');
      console.log(JSON.stringify(FormatOrdenAdmin));

      await collection.insertOne(FormatOrdenAdmin);

      console.log('--- order save sucessfully --');


    });

    return {
      statusCode: '200',
      body: JSON.stringify(event)
    };
}