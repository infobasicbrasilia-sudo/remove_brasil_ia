import multer from 'multer';
import fetch from 'node-fetch';

export const config = {
  api: {
    bodyParser: false,
  },
};

const upload = multer({ storage: multer.memoryStorage() });

// Modelos gratuitos do Hugging Face (ordem de prioridade)
const MODELS = [
  'Xenova/remove-background',      // Leve e rápido
  'nateraw/background-remover',    // Alternativo
  'Schmunk/rembg'                  // Mais pesado, mas preciso
];

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método inválido' });
  }

  const HF_TOKEN = process.env.HF_TOKEN;
  if (!HF_TOKEN) {
    console.error('❌ HF_TOKEN não configurada');
    return res.status(500).send('Token do Hugging Face não configurado.');
  }

  try {
    // Processar upload
    await new Promise((resolve, reject) => {
      upload.single('image_file')(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const file = req.file;
    if (!file) {
      return res.status(400).send('Nenhuma imagem enviada.');
    }

    if (file.size > 5 * 1024 * 1024) {
      return res.status(413).send('Arquivo muito grande (máx 5MB).');
    }

    console.log(`📤 Testando com ${MODELS.length} modelos...`);

    // Tentar cada modelo em sequência
    let lastError = null;
    for (const model of MODELS) {
      try {
        console.log(`➡️ Tentando: ${model}`);
        const response = await fetch(
          `https://api-inference.huggingface.co/models/${model}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${HF_TOKEN}`,
              'Content-Type': file.mimetype || 'image/png',
            },
            body: file.buffer,
          }
        );

        if (response.ok) {
          console.log(`✅ Sucesso com ${model}`);
          const imageBuffer = await response.buffer();
          res.setHeader('Content-Type', 'image/png');
          return res.status(200).send(imageBuffer);
        } else {
          const errorText = await response.text();
          console.warn(`⚠️ ${model} falhou (${response.status}): ${errorText}`);
          lastError = `${model}: ${response.status} - ${errorText}`;
        }
      } catch (err) {
        console.warn(`⚠️ Erro com ${model}: ${err.message}`);
        lastError = `${model}: ${err.message}`;
      }
    }

    // Se todos falharam
    console.error('❌ Todos os modelos falharam.');
    throw new Error(`Todos os modelos falharam. Último erro: ${lastError}`);

  } catch (error) {
    console.error('❌ Erro final:', error);
    return res.status(500).send('Erro interno: ' + (error.message || 'sem detalhes'));
  }
}