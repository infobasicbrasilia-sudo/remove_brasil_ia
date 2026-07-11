import express from 'express';
import multer from 'multer';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3000;
const upload = multer({ storage: multer.memoryStorage() });

const HF_TOKEN = process.env.HF_TOKEN;

if (!HF_TOKEN) {
  console.error('❌ HF_TOKEN não definido no .env');
  process.exit(1);
}

app.post('/api/remove-bg', upload.single('image_file'), async (req, res) => {
  console.log('🚀 Processando com Hugging Face (nateraw)...');

  try {
    const file = req.file;
    if (!file) return res.status(400).send('Nenhuma imagem.');
    if (file.size > 5 * 1024 * 1024) return res.status(413).send('Arquivo grande.');

    const response = await fetch(
      'https://api-inference.huggingface.co/models/nateraw/background-remover',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': file.mimetype || 'image/png',
        },
        body: file.buffer,
      }
    );

    console.log('📊 Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro:', errorText);
      return res.status(response.status).send(`Erro: ${response.status}`);
    }

    const imageBuffer = await response.buffer();
    res.setHeader('Content-Type', 'image/png');
    res.status(200).send(imageBuffer);
  } catch (error) {
    console.error('❌ Erro:', error);
    res.status(500).send('Erro: ' + error.message);
  }
});

app.use(express.static('.'));
app.listen(port, () => {
  console.log(`🔥 Servidor em http://localhost:${port}`);
  console.log(`📤 POST /api/remove-bg`);
});