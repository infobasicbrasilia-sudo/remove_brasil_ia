import formidable from 'formidable';
import fs from 'fs';
import fetch from 'node-fetch'; // se Node <18, senão use fetch nativo

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método inválido' });
  }

  const CLIPDROP_KEY = process.env.CLIPDROP_API_KEY;
  if (!CLIPDROP_KEY) {
    return res.status(500).send('Chave da API não configurada.');
  }

  // Parse do multipart
  const form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.maxFileSize = 5 * 1024 * 1024; // 5MB

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Erro no parse:', err);
      return res.status(400).send('Erro ao processar o arquivo.');
    }

    const file = files.image_file;
    if (!file) {
      return res.status(400).send('Nenhuma imagem enviada.');
    }

    // Lê o arquivo temporário
    const fileBuffer = fs.readFileSync(file.filepath);

    // Limpa o arquivo temporário (opcional)
    try { fs.unlinkSync(file.filepath); } catch (e) {}

    try {
      // Envia apenas o binário para a Clipdrop
      const response = await fetch('https://clipdrop-api.co/remove-background/v1', {
        method: 'POST',
        headers: {
          'x-api-key': CLIPDROP_KEY,
          'Content-Type': file.mimetype || 'image/png',
        },
        body: fileBuffer,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Clipdrop error (${response.status}):`, errorText);
        return res.status(response.status).send(`Erro na API: ${response.status}`);
      }

      const imageBuffer = await response.buffer();
      res.setHeader('Content-Type', 'image/png');
      return res.status(200).send(imageBuffer);
    } catch (error) {
      console.error('Erro ao chamar Clipdrop:', error);
      return res.status(500).send('Erro interno.');
    }
  });
}