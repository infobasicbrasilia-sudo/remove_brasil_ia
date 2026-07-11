import multer from 'multer';
import sharp from 'sharp';
import { removeBackground } from '@imgly/background-removal-node';

export const config = {
  api: {
    bodyParser: false,
  },
};

const upload = multer({ storage: multer.memoryStorage() });

export default async function handler(req, res) {
  console.log('🚀 Função remove-bg (Node) iniciada');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método inválido' });
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

    console.log(`📁 Arquivo recebido: ${file.originalname} (${file.size} bytes, ${file.mimetype})`);

    // Converter para PNG com sharp (garante formato suportado)
    console.log('🔄 Convertendo para PNG...');
    const pngBuffer = await sharp(file.buffer).png().toBuffer();

    // Remover fundo usando a biblioteca Node
    console.log('🧹 Removendo fundo com @imgly/background-removal-node...');
    const outputBuffer = await removeBackground(pngBuffer);

    console.log('✅ Imagem processada com sucesso!');
    res.setHeader('Content-Type', 'image/png');
    return res.status(200).send(outputBuffer);
  } catch (error) {
    console.error('❌ Erro no processamento:', error);
    return res.status(500).send('Erro interno: ' + error.message);
  }
}