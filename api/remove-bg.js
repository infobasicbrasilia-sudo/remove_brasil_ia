export const config = {
  api: {
    bodyParser: false, // Essencial para não corromper a foto
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Apenas POST' });

  const API_KEY = process.env.REMOVE_BG_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: "Chave não encontrada no Vercel" });
  }

  try {
    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": API_KEY,
        "Content-Type": req.headers['content-type']
      },
      body: req // Repassa a imagem pura
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).send(errorText);
    }

    const imageBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'image/png');
    return res.status(200).send(Buffer.from(imageBuffer));

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}