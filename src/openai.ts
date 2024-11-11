import axios, { AxiosError } from 'axios';

import { GPTResponse } from './types';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export const extrarInfo = async (fileUrl: string): Promise<GPTResponse> => {
  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant specialized in extracting information from medical prescriptions.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'From the prescription image provided, extract the following details and return only in the specified JSON format without additional explanations.',
              },
              {
                type: 'text',
                text: 'JSON format: { "clinica": "Clinica Name", "doctor": "Doctor Name", "especialidad": "Specialty" }. Only return JSON. Do not include any additional text.',
              },
              {
                type: 'text',
                text: 'Here is a list of clinics with their doctors and specializations. Use this as a reference for possible matches, and match the clinic name, doctor, and specialty exactly. If a match cannot be determined with certainty, leave the field blank.',
              },
              {
                type: 'text',
                text: 'Clinic List:\n\n40&Mas:\n  - \n  - Daniela_Oliva, Specialty: Diabetes, Nutriología, Endocrinologia\n  - Paulina_Solervicens, Specialty: Nutriología\n  - Paulina_Solervicens, Specialty: Diabetes, Nutriología\n\nAlemana:\n  - \n  - Marisel_Figueroa, Specialty: Diabetes, Nutriología\n  - Nestor_Lagos, Specialty: Diabetes\n\nBaroclinic:\n  - \n  - Marcelo_Vargas, Specialty: Diabetes, Nutriología\n\nBiomer:\n  - \n  - Mario_Sandoval, Specialty: Deportología\n  - Felipe_Patricio_Valenzuela_P, Specialty: Endocrinología\n  - Paulina_Villarroel, Specialty: Psicología\n\nCammyn:\n  - \n  - Ada_cuevas, Specialty: Nutriología\n  - Verónica_Alvarez, Specialty: Nutriología\n  - Raúl_Gallegos, Specialty: Nutriología\n  - Rodrigo_Alonso , Specialty: Nutriología\n\nCefir:\n  - \n  - Emilio_ Fernandez, Specialty: Ginecología\n  - Cecilia_ Fabres, Specialty: Ginecología\n\nCefir\xa0:\n  - \n  - Alfredo_ Germain, Specialty: Ginecología\n\nClinica_Alemana:\n  - \n  - Reinaldo_Rosas, Specialty: Infectología\n  - Joaquin Gabriel Errazuriz Valenzuela, Specialty: Ginecología y Obsetricia\n  - Maria Francisca Pais Leal, Specialty: Ginecología y Obsetricia\n  - Patricio Eugenio Gonzalez Suau, Specialty: Ginecología\xa0\n  - Guillermo Andres Durruty Velasco, Specialty: Ginecología y Obsetricia\n  - Francisco Javier Osorio Martini, Specialty: Ginecología\xa0\n  - Patricio Eduardo Donoso Pozo, Specialty: Ginecología y Obsetricia\n  - Pablo Ignacio Sanhueza Ronda, Specialty: Ginecología y Obsetricia\n  - Rene Luis Salinas Sepulveda, Specialty: Ginecología y Obsetricia\n\nClinica_Davila:\n  - \n  - Maria_Luisa_Aguirre, Specialty: Diabetes, Obesidad Infntil\n  - María_Jose_Fernández_M, Specialty: Diabetes, Nutriología\n  - Patricio_Mois, Specialty: Nutriología\n  - Maria_Eugenia_Martinez, Specialty: Nutriología\n  - Felipe_Caceres, Specialty: Nutriología\n  - Andrea_Ruiz_Díaz, Specialty: Nutriología\n  - Carol_Wainstein, Specialty: Nutriología\n\nClinica_IVI:\n  - \n  - Eliseo Sánchez Esteves, Specialty: Ginecología\n  - Rodrigo Carvajal, Specialty: Ginecología y Obstetricia\n  - Rose Marie Meier, Specialty: Ginecología y Obstetricia\n  - Andrés Carvajal, Specialty: Ginecologia\n  - José Antonio Morales, Specialty: Ginecología y Obstetricia\n  - Carlos Troncoso, Specialty: Ginecologia\n\nClinica_MEDS:\n  - \n  - Kenyin_Loo, Specialty: Diabetología\n  - Verner_Codoceo_R, Specialty: Diabetología\n  - Carolina_Schulbach_K, Specialty: Diabetología\n  - Néstor_Soto_I, Specialty: Diabetología\n  - Marcela_Barberán_M, Specialty: Endocrinología\n  - María_Francisca_Gajardo, Specialty: Endocrinología\n  - Verónica_Zurvarra, Specialty: Endocrinología\n  - Andrés_Estrugo_Benado, Specialty: Urología\n  - Cecilia_Fabres_Vicuña, Specialty: Ginecología\n  - Reinaldo_González_Ramos, Specialty: Ginecología\n  - Alejandro_Manzur_Yanine, Specialty: Ginecología\n  - Diego_Masoli_Illanes, Specialty: Ginecología\n  - Carolina_Ortega_Hrepich, Specialty: Ginecología\n  - Cristian_Palma, Specialty: Urología\n  - Ricardo_Pommer_Téllez, Specialty: Ginecología\n  - Abril_Salinas_Quero, Specialty: Ginecología\n  - Hugo_Sovino_Sobarzo, Specialty: Ginecología\n  - Sonia_Villa_Vega, Specialty: Ginecología\n  - Claudio_Villarroel_Quintana, Specialty: Ginecología\n  - Marcelo_Bianchi_Poblete, Specialty: Ginecología\n  - Gigliola_Cannoni_Berd, Specialty: Ginecología\n  - Oriana_Carrasco_Salazar, Specialty: Ginecología\n  - Carolina_Conejero_Roós, Specialty: Ginecología\n  - Gonzalo_Duque_Arredondo, Specialty: Ginecología\n  - Rodrigo_Macaya_Pivet, Specialty: Ginecología\n  - Marcelo_Pradenas_Abarca, Specialty: Ginecología\n  - Sebastián_Prado_Noguera, Specialty: Ginecología\n  - Óscar_Puga_Saiz, Specialty: Ginecología\n  - Julio_Sepúlveda_Zúñiga, Specialty: Ginecología\n  - Daniel_Sfeir, Specialty: Ginecología\n  - Víctor_Valverde, Specialty: Ginecología\n  - Katherina_Villa_Plaza, Specialty: Ginecología\n  - Álvaro_Bustamante, Specialty: Medicina Deportiva\n  - Bárbara_Descalzi_Meléndez, Specialty: Nutriología Bariatrica\n  - César_Kalazich_Rosales, Specialty: Medicina Deportiva\n  - Mónica_Manrique_Espinoza, Specialty: Nutriología Bariatrica\n  - Yudith_Preiss_Contreras, Specialty: Nutriología Bariatrica\n\nClinica_Universidad_de_Los_Andes:\n  - \n  - Alex_Escalona, Specialty: Cirujano digestivo\n  - Camila_Hernandez, Specialty: Nutriología\n\nClinica_las_Condes\xa0:\n  - \n  - Magdalena_ Farías, Specialty: Nutriología\n  - Emilio_Fernandez, Specialty: Ginecología\n  - Sergio_ de_ la_ Fuente, Specialty: Ginecología\n  - Emilio_Fermandez, Specialty: Ginecología\n  - Paloma_Silva_Carrasco, Specialty: Nutriología\n  - Danitza_Troncoso, Specialty: Nutriología\n  - Camila_Rodriguez_Vargas, Specialty: Nutriología\n  - Juan_Carlos_ Vega_C, Specialty: Nutriología\n  - Paula_Lepe, Specialty: Psiquiatría\n  - Gonzalo_Blanco_Pradenas, Specialty: Nutriología\n  - Ximena_Soto, Specialty: Nutriología\n  - Fernando_Carrasco, Specialty: Nutriología\n  - Rodrigo_Blamey, Specialty: Infectología\n\nClínica_Galenicus:\n  - \n  - Christian_ Perez_Fuentevilla, Specialty: Nutriología\n\nConsulta_Propia:\n  - \n  - Diego_Concha\xa0, Specialty: Endocrinología\n  - Javiera_Salvador\xa0, Specialty: Nutriología\n  - Antonia_Leon, Specialty: Nutriología\n  - David_Mendoza, Specialty: Nutriología\n  - Daniela_Zea, Specialty: Nutriología\n  - Constanza_Arancibia, Specialty: Nutriología\n  - Jeffrey_Lamos, Specialty: Psiquiatra\n  - Daniela_Schorwer, Specialty: Médico, Salud Mental\n  - Cristian_Saez, Specialty: Nutriología\n  - Valentina_Vilches, Specialty: Médico, Salud Mental\n  - Marco_Alban, Specialty: Nutriología\n  - Sebastian_Aravena, Specialty: Médico, Salud Mental\n  - Alfredo_Pacheco, Specialty: Medicina Paliativa\n  - Joaquin_Concha, Specialty: Nutriología\n  - Varsha_Vaswani, Specialty: Endocronologia, Diabetes\n  - Monserrat_Diaz, Specialty: Médico, Salud Mental\n  - Carmen_Almada, Specialty: Nutriología\n\nDiabetologos.cl:\n  - \n  - Katerinne_Contreras, Specialty: Nutriología\n  - Felipe_Beasain, Specialty: Urología\n\nIndisa:\n  - \n  - Daniela_Allsop_L, Specialty: Nutriología\n\nKinestcentro:\n  - \n  - Cristina_Saldias, Specialty: Nutriología\n\nMeditres:\n  - \n  - Maria_Elvira_Forero, Specialty: Nutriología\n  - Catalina_Fullerton, Specialty: Nutriología\n  - Karen_Dintrans, Specialty: Nutriología\n\nMettabolic:\n  - \n  - M_ José_ Escaffi, Specialty: Nutriología\n\nNovamed:\n  - \n  - Matias_Sepulveda, Specialty: Nutriología\n  - Yudith_Preiss, Specialty: Nutriología\n  - Sandra_Henriquez_Parada, Specialty: Nutriología\n\nNuclinic:\n  - \n  - Magdalena_ Farías, Specialty: Nutriología\n  - Sabrina_Wigodski\xa0, Specialty: Nutriología\n\nNuevamedicina:\n  - \n  - Gisselle_Melendes, Specialty: Medicina General\n\nNutricion360:\n  - \n  - Natalia_Soto, Specialty: Nutriología\n\nNutrimet:\n  - \n  - Leopoldo_Breschi, Specialty: Nutriología\n\nPolimed\xa0:\n  - \n  - Polimed_Consulta_Médica, Specialty: Nutriología\n  - NFT_ Centro_médico:_ nutrición _y_ ejercicio, Specialty: Nutriología\n  - Esteban_Valenzuela, Specialty: Nutriología\n  - Valentina_Jimenez, Specialty: Psicología\n  - Paloma_Vidueira, Specialty: Nutriología\n  - Valentina_Torres, Specialty: Nutriología\n  - Edith_Vega, Specialty: Nutriología\n\nRed_Salud:\n  - \n  - Leticia_Burgueño, Specialty: Nutriología\n  - Daniela_Allsop_L, Specialty: Nutriología\n  - María_Cecilia_Abuauad_A, Specialty: Nutriología',
              },
              {
                type: 'image_url',
                image_url: { url: fileUrl },
              },
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
