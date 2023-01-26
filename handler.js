const {MongoClient} = require("mongodb");
const { v4: uuidv4 } = require('uuid');
const credencialsMongo = process.env.mongo_connection;
const database = 'test';

const client = new MongoClient(credencialsMongo);

module.exports.handler = async (event, context, callback) => {

    try{

      await client.connect();
      const connect = client.db(database);

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


    } finally {
        await client.close();
        console.log('finalizado');
    }

    return {
      statusCode: '200',
      body: JSON.stringify(event)
    };
}