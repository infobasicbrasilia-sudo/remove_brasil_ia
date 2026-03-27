export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Apenas POST permitido');

  const API_KEY = process.env.REMOVE_BG_KEY;

  try {
    // O Vercel recebe o corpo da requisição (que já é o FormData vindo do seu HTML)
    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": API_KEY },
      body: req.body // Repassa a imagem direto
    });

    if (!response.ok) throw new Error("Erro na API externa");

    const imageBlob = await response.arrayBuffer();
    res.setHeader('Content-Type', 'image/png');
    res.status(200).send(Buffer.from(imageBlob));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}