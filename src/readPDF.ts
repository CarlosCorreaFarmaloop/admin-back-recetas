import axios from 'axios';
import pdfParse from 'pdf-parse';

export const extractTextFromPDF = async (url: string): Promise<string> => {
  const pdfBuffer = await downloadPDF(url);
  const pdfData = await pdfParse(pdfBuffer);
  return pdfData.text;
};

const downloadPDF = async (url: string): Promise<Buffer> => {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data);
};
