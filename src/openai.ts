import axios, { AxiosError } from 'axios';

import { GPTResponse } from './types';
import { extractTextFromPDF } from './readPDF';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export const extrarInfo = async (fileUrl: string, isPDF: boolean): Promise<GPTResponse> => {
  let imagePromp: any = { type: 'image_url', image_url: { url: fileUrl } };

  if (isPDF) {
    const pdfText = await extractTextFromPDF(fileUrl);
    imagePromp = { type: 'text', text: `The following text was extracted from a medical prescription PDF:\n ${pdfText}` };
  }

  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant specialized in extracting and formatting information from medical prescriptions.

Format rules:
For institution:
- Replace spaces with underscores (_)
- Maintain original capitalization
- Format: INSTITUTION_NAME

For doctor:
- Include full names and first surname
- Only initial of second surname followed by uppercase
- Replace spaces with underscores (_)
- Format: NAME_FIRSTNAME_SURNAME_X

Example:
Original: "Dr. Carlos Miguel Correa Martínez - Clínica Alemana"
Formatted: {
  "clinica": "Clinica_Alemana",
  "doctor": "Carlos_Miguel_Correa_M"
}

Extract and format the information regardless of whether it exists in the reference database.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'From the prescription file provided, extract the clinic name and doctor name. Format them according to the rules and return in JSON format. If you cannot determine either field with certainty, leave it blank.',
              },
              {
                type: 'text',
                text: 'Return only the JSON in this format: { "clinica": "Formatted_Clinic_Name", "doctor": "Formatted_Doctor_Name", "especialidad": "Specialty" }',
              },
              imagePromp,
            ],
          },
        ],
        max_tokens: 200,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const tokens = response.data.usage.total_tokens;
    console.log('Used tokens: ', tokens);

    const responseText = response.data.choices[0].message.content;
    const cleanedResponseText = responseText
      .trim()
      .replace(/^```json\s*/, '')
      .replace(/```$/, '');

    return JSON.parse(cleanedResponseText);
  } catch (error) {
    const err = error as AxiosError;
    console.error(err?.response?.data);
    throw new Error('Failed to process medical information');
  }
};
