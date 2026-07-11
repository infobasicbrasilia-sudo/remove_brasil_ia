import multer from 'multer';
import fetch from 'node-fetch';

export const config = {
  api: {
    bodyParser: false,
  },
};

const upload = multer({ storage: multer.memoryStorage() });

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

    // Usando modelo Xenova (leve e rápido)
    const response = await fetch(
      'https://api-inference.huggingface.co/models/Xenova/remove-background',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': file.mimetype || 'image/png',
        },
        body: file.buffer,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro (${response.status}):`, errorText);
      return res.status(response.status).send(`Erro na API: ${response.status}`);
    }

    const imageBuffer = await response.buffer();
    res.setHeader('Content-Type', 'image/png');
    return res.status(200).send(imageBuffer);
  } catch (error) {
    console.error('❌ Erro no handler:', error);
    return res.status(500).send('Erro interno.');
  }
}