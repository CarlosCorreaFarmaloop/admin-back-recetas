module.exports.formatBatches = (batches) => {
  const formattedBatches = batches.map((batch) => {
    return {
      id: batch.id,
      normalPrice: validateNumberType(batch?.normalPrice),
      settlementPrice: validateNumberType(batch?.settlementPrice),
      stock: validateNumberType(batch?.stock),
      expireDate: validateStringType(batch?.expireDate),
    };
  });

  return formattedBatches;
};

const validateNumberType = (value) => {
  if (value && typeof value === 'number') return value;
  return 0;
};

const validateStringType = (value) => {
  if (value && typeof value === 'string') return value;
  return '';
};
