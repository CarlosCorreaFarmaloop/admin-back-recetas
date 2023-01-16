const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { formatBatches } = require('./format');

module.exports.handler = async (event, context, callback) => {
  try {
    const dynamoClient = new DynamoDBClient();
    const dynamoDbClient = DynamoDBDocumentClient.from(dynamoClient);

    // const { batchs } = JSON.parse(event.body);

    console.log('Batches: ', event.detail.batchs);

    const { batchs } = event.detail;

    for (let i = 0; i < batchs.length; i++) {

      const formattedBatches = formatBatches(batchs[i].batchs);
      const discounts = [];

      formattedBatches.forEach(batch => {
        discounts.push(batch.normalPrice !== 0 ? (1 - batch.settlementPrice / batch.normalPrice) * 100 : 0);
      });

      let biggerDiscount = 0;
      if (discounts.length === 0) {
        biggerDiscount = 0;
      } else {
        biggerDiscount = Math.round(Math.max(...discounts));
      }

      await dynamoDbClient.send(
        new UpdateCommand({
          TableName: 'ProductTableQa',
          Key: {
            sku: batchs[i].sku,
          },
          UpdateExpression: `SET #batchs = :batchs, #bestDiscount = :bestDiscount`,
          ExpressionAttributeValues: {
            ':batchs': formattedBatches,
            ':bestDiscount': biggerDiscount,
          },
          ExpressionAttributeNames: {
            '#batchs': 'batchs',
            '#bestDiscount': 'bestDiscount',
          },
        })
      );
    }

    console.log('Success, Batches updated');

    return callback(undefined, {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: 'Updated batches.',
          input: event,
        },
        null,
        2
      ),
    });
  } catch (error) {
    console.log(error);
    return callback(undefined, {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: 'Error updating batches.',
          input: event,
        },
        null,
        2
      ),
    });
  }
};
