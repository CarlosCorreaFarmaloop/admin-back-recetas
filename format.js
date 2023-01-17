const formatBatch = (batch) => {
  return {
    id: batch.id,
    normalPrice: validateNumberType(batch?.normalPrice),
    settlementPrice: validateNumberType(batch?.settlementPrice),
    stock: validateNumberType(batch?.stock),
    expireDate: validateStringType(batch?.expireDate),
  };
};

module.exports.compareAndFormatBatches = (batches) => {
  const newFilteredBatches = batches.news.filter((batch) => batch.id);
  if (!batches.old && batches.olds.length <= 0) {
    return newFilteredBatches.map((newBatch) => formatBatch(newBatch));
  }

  const newBatches = batches.olds;
  for (let i = 0; i < newFilteredBatches.length; i++) {
    const findedIndex = newBatches.findIndex((batch) => batch.id === newFilteredBatches[i].id);
    if (findedIndex >= 0) {
      newBatches[findedIndex] = { ...newBatches[findedIndex], ...newFilteredBatches[i] };
    } else {
      newBatches.push(formatBatch(newFilteredBatches[i]));
    }
  }
  return newBatches;
};

const validateNumberType = (value) => {
  if (value && typeof value === 'number') return value;
  return 0;
};

const validateStringType = (value) => {
  if (value && typeof value === 'string') return value;
  return '';
};
