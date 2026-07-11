import Busboy from 'busboy';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Segurança
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método inválido' });
  }

  const CLIPDROP_KEY = process.env.CLIPDROP_API_KEY;
  if (!CLIPDROP_KEY) {
    console.error('❌ CLIPDROP_API_KEY não configurada');
    return res.status(500).send('Chave da API não configurada.');
  }

  try {
    // Processa o multipart com busboy
    const fileBuffer = await new Promise((resolve, reject) => {
      const busboy = Busboy({ headers: req.headers });
      let buffer = null;
      let mimetype = null;

      busboy.on('file', (fieldname, file, info) => {
        if (fieldname !== 'image_file') {
          file.resume(); // descarta
          return;
        }
        const chunks = [];
        file.on('data', (chunk) => chunks.push(chunk));
        file.on('end', () => {
          buffer = Buffer.concat(chunks);
          mimetype = info.mimeType;
        });
      });

      busboy.on('error', (err) => reject(err));
      busboy.on('finish', () => {
        if (!buffer) {
          reject(new Error('Nenhuma imagem enviada.'));
        } else {
          resolve({ buffer, mimetype });
        }
      });

      req.pipe(busboy);
    });

    const { buffer, mimetype } = fileBuffer;

    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(413).send('Arquivo muito grande (máx 5MB).');
    }

    // Envia para Clipdrop
    const response = await fetch('https://clipdrop-api.co/remove-background/v1', {
      method: 'POST',
      headers: {
        'x-api-key': CLIPDROP_KEY,
        'Content-Type': mimetype || 'image/png',
      },
      body: buffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Clipdrop API error (${response.status}):`, errorText);
      return res.status(response.status).send(`Erro na API: ${response.status}`);
    }

    const resultBuffer = await response.buffer();
    res.setHeader('Content-Type', 'image/png');
    return res.status(200).send(resultBuffer);
  } catch (error) {
    console.error('❌ Erro no handler:', error);
    return res.status(500).send('Erro interno: ' + error.message);
  }
}