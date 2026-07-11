import multer from 'multer';
import fetch from 'node-fetch';

export const config = {
  api: {
    bodyParser: false,
  },
};

const upload = multer({ storage: multer.memoryStorage() });

const HF_MODELS = [
  'nateraw/background-remover',
  'Xenova/remove-background',
];

export default async function handler(req, res) {
  console.log('🚀 Função remove-bg iniciada');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método inválido' });
  }

  const HF_TOKEN = process.env.HF_TOKEN;
  const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;

  try {
    await new Promise((resolve, reject) => {
      upload.single('image_file')(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const file = req.file;
    if (!file) return res.status(400).send('Nenhuma imagem.');
    if (file.size > 5 * 1024 * 1024) return res.status(413).send('Arquivo muito grande.');

    // 1. Tenta Hugging Face (se token existir)
    if (HF_TOKEN) {
      console.log('📤 Tentando Hugging Face...');
      for (const model of HF_MODELS) {
        try {
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
            const buffer = await response.buffer();
            console.log(`✅ Sucesso com Hugging Face (${model})`);
            res.setHeader('Content-Type', 'image/png');
            return res.status(200).send(buffer);
          } else {
            const text = await response.text();
            console.warn(`⚠️ ${model} falhou (${response.status}): ${text.substring(0, 100)}`);
          }
        } catch (err) {
          console.warn(`⚠️ Erro com ${model}: ${err.message}`);
        }
      }
      console.log('⚠️ Hugging Face falhou, tentando Replicate...');
    }

    // 2. Fallback para Replicate (se token existir)
    if (REPLICATE_TOKEN) {
      console.log('📤 Tentando Replicate...');
      const base64Image = file.buffer.toString('base64');
      const imageDataUrl = `data:${file.mimetype || 'image/png'};base64,${base64Image}`;

      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${REPLICATE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'cjwbw/rembg',
          input: { image: imageDataUrl },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Replicate erro:', errorText);
        throw new Error(`Replicate: ${response.status} - ${errorText}`);
      }

      const prediction = await response.json();
      const predictionId = prediction.id;

      let result = null;
      for (let i = 0; i < 30; i++) {
        const statusRes = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
          headers: { 'Authorization': `Token ${REPLICATE_TOKEN}` },
        });
        const statusData = await statusRes.json();
        if (statusData.status === 'succeeded') {
          result = statusData.output;
          break;
        } else if (statusData.status === 'failed') {
          throw new Error('Falha no Replicate');
        }
        await new Promise(r => setTimeout(r, 1000));
      }

      if (!result) throw new Error('Timeout Replicate');
      const imageUrl = Array.isArray(result) ? result[0] : result;
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) throw new Error('Falha ao baixar imagem');

      const imageBuffer = await imageResponse.buffer();
      console.log('✅ Sucesso com Replicate');
      res.setHeader('Content-Type', 'image/png');
      return res.status(200).send(imageBuffer);
    }

    throw new Error('Nenhuma API configurada (HF_TOKEN ou REPLICATE_API_TOKEN)');

  } catch (error) {
    console.error('❌ Erro final:', error);
    return res.status(500).send('Erro interno: ' + error.message);
  }
}