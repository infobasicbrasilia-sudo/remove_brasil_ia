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

  const PIXEL_API_KEY = process.env.PIXEL_API_KEY;
  if (!PIXEL_API_KEY) {
    console.error('❌ PIXEL_API_KEY não configurada');
    return res.status(500).send('Chave da PixelAPI não configurada.');
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

    // Converte a imagem para base64 (PixelAPI aceita isso)
    const base64Image = file.buffer.toString('base64');
    const payload = {
      image: base64Image,
      format: 'png'
    };

    console.log('📤 Enviando para PixelAPI...');
    const response = await fetch('https://api.pixelapi.com/remove-background', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PIXEL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('📊 Status da resposta:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ PixelAPI error (${response.status}):`, errorText);
      return res.status(response.status).send(`Erro na PixelAPI: ${response.status}`);
    }

    // PixelAPI retorna a imagem em base64
    const data = await response.json();
    if (!data.image) {
      throw new Error('Resposta da PixelAPI não contém imagem');
    }

    const imageBuffer = Buffer.from(data.image, 'base64');
    res.setHeader('Content-Type', 'image/png');
    return res.status(200).send(imageBuffer);
    
  } catch (error) {
    console.error('❌ Erro no handler:', error);
    return res.status(500).send('Erro interno: ' + (error.message || 'sem detalhes'));
  }
}