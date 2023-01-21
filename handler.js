
/*module.exports.handler = async (event, context, callback) => {
  try {
    
    console.log('test successfully');

    return callback(undefined, {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: 'test successfully',
        }
      ),
    });
  } catch (error) {
    console.log(error);
    return callback(undefined, {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: 'Error',
        }
      ),
    });
  }
};
*/
const MongoClient = require("mongodb").MongoClient;
//import { v4 as uuid } from 'uuid';
const credencialsMongo = process.env.mongo_connection
//const database = 'test';
//const credencialsMongo = 'mongodb://sudev:dev%4031415@3.137.164.24:27017';
const database = 'test';

module.exports.handler = async (event, context, callback) => {


    await MongoClient.connect(credencialsMongo).then(async (client) => {
        console.log('conectado a mongo');
    });

    return {
      statusCode: '200',
      body: JSON.stringify(event)
    };
}