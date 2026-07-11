import multer from 'multer';
import fetch from 'node-fetch';

export const config = {
  api: {
    bodyParser: false,
  },
};

const upload = multer({ storage: multer.memoryStorage() });

const MODELS = [
  'nateraw/background-remover',
  'Xenova/remove-background',
  'briaai/RMBG-1.4'
];

export default async function handler(req, res) {
  console.log('🚀 Função iniciada');
  console.log('🔑 Token presente?', !!process.env.HF_TOKEN);
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método inválido' });
  }

  const HF_TOKEN = process.env.HF_TOKEN;
  if (!HF_TOKEN) {
    console.error('❌ Token não encontrado');
    return res.status(500).send('Token não configurado.');
  }

  try {
    await new Promise((resolve, reject) => {
      upload.single('image_file')(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const file = req.file;
    if (!file) return res.status(400).send('Nenhuma imagem.');
    if (file.size > 5 * 1024 * 1024) return res.status(413).send('Arquivo grande.');

    console.log(`📁 Imagem: ${file.originalname} (${file.size} bytes)`);

    let lastError = null;
    for (const model of MODELS) {
      try {
        console.log(`➡️ Tentando modelo: ${model}`);
        const start = Date.now();
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
        const elapsed = Date.now() - start;
        console.log(`⏱️ Tempo: ${elapsed}ms, Status: ${response.status}`);

        if (response.ok) {
          console.log(`✅ Sucesso com ${model}`);
          const buffer = await response.buffer();
          res.setHeader('Content-Type', 'image/png');
          return res.status(200).send(buffer);
        } else {
          const text = await response.text();
          console.warn(`⚠️ ${model} falhou (${response.status}): ${text}`);
          lastError = `${model}: ${response.status} - ${text.substring(0, 100)}`;
        }
      } catch (err) {
        console.warn(`⚠️ Erro com ${model}: ${err.message}`);
        lastError = `${model}: ${err.message}`;
      }
    }

    throw new Error(`Todos falharam. Último: ${lastError}`);

  } catch (error) {
    console.error('❌ Erro final:', error);
    return res.status(500).send('Erro interno.');
  }
}