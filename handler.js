const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { formatBatches } = require('./format');

module.exports.handler = async (event, context, callback) => {
  try {
    const dynamoClient = new DynamoDBClient({ endpoint: 'http://localhost:8000' });
    const dynamoDbClient = DynamoDBDocumentClient.from(dynamoClient);

    // const { batchs } = JSON.parse(event.body);

    console.log('Batches: ', event.detail.batchs);

    const { batchs } = event.detail;

    for (let i = 0; i < batchs.length; i++) {
      const formattedBatches = formatBatches(batchs[i].batchs);
      await dynamoDbClient.send(
        new UpdateCommand({
          TableName: 'ProductTableQa',
          Key: {
            sku: batchs[i].sku,
          },
          UpdateExpression: `SET #batchs = :batchs`,
          ExpressionAttributeValues: {
            ':batchs': formattedBatches,
          },
          ExpressionAttributeNames: {
            '#batchs': 'batchs',
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
