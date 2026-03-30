export const config = {
  api: {
    bodyParser: false, 
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Apenas POST' });

  // Pega a chave que você salvou na Vercel
  const CLIPDROP_KEY = process.env.CLIPDROP_API_KEY;

  if (!CLIPDROP_KEY) {
    return res.status(500).send("ERRO TÉCNICO: Chave CLIPDROP_API_KEY não encontrada no sistema da Vercel.");
  }

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const bufferBody = Buffer.concat(chunks);

    // Chamada direta para ClipDrop
    const response = await fetch("https://clipdrop-api.co/remove-background/v1", {
      method: "POST",
      headers: {
        "x-api-key": CLIPDROP_KEY,
        "Content-Type": req.headers['content-type']
      },
      body: bufferBody
    });

    if (!response.ok) {
      const errorDetail = await response.text();
      console.error("Erro ClipDrop:", errorDetail);
      // Retorna o erro real para o seu HTML mostrar no console
      return res.status(response.status).send(`Erro na API ClipDrop: ${errorDetail}`);
    }

    const imageBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'image/png');
    return res.status(200).send(Buffer.from(imageBuffer));

  } catch (error) {
    return res.status(500).send("Erro interno: " + error.message);
  }
}