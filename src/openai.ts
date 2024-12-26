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

  const SYSTEM_PROMPT =
    'You are an AI assistant specialized in extracting and formatting information from medical prescriptions.\n\nFormat rules:\nFor institution:\n- Replace spaces with underscores (_)\n- Maintain original capitalization\n- Format: INSTITUTION_NAME\n\nFor doctor:\n- Include full names and first surname\n- Only initial of second surname followed by uppercase\n- Replace spaces with underscores (_)\n- Format: NAME_FIRSTNAME_SURNAME_X\n\nExample:\nOriginal: "Dr. Carlos Miguel Correa Martínez - Clínica Alemana"\nFormatted: {\n  "clinica": "Clinica_Alemana",\n  "doctor": "Carlos_Miguel_Correa_M"\n}\n\nExtract and format the information regardless of whether it exists in the reference database.';

  const USER_PROMPT =
    'From the prescription file provided, extract the clinic name and doctor name. Format them according to the rules and return in JSON format. If you cannot determine either field with certainty, leave it blank.\nReturn only the JSON in this format: { "clinica": "Formatted_Clinic_Name", "doctor": "Formatted_Doctor_Name", "especialidad": "Specialty" }';

  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: USER_PROMPT,
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

    console.log(response);

    const responseText = response.data.choices[0].message.content;
    const cleanedResponseText = responseText
      .trim()
      .replace(/^```json\s*/, '')
      .replace(/```$/, '');

    return JSON.parse(cleanedResponseText);
  } catch (error) {
    const err = error as AxiosError;
    console.error(JSON.stringify(err.response, null, 2));
    throw new Error('Failed to process medical information');
  }
};
