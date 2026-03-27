export const config = {
  api: {
    bodyParser: false, // Mantemos desativado para a imagem passar pura
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Apenas POST' });

  const API_KEY = process.env.REMOVE_BG_KEY;

  if (!API_KEY) {
    console.error("ERRO: Chave REMOVE_BG_KEY não encontrada.");
    return res.status(500).json({ error: "Configuração de API ausente." });
  }

  try {
    // Coletamos os dados brutos da requisição (a imagem vinda do FormData)
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const bufferBody = Buffer.concat(chunks);

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": API_KEY,
        "Content-Type": req.headers['content-type'] // Repassa o multipart/form-data
      },
      body: bufferBody // Agora enviamos o Buffer completo e sólido
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro na API Externa:", errorText);
      return res.status(response.status).send(errorText);
    }

    const imageBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'image/png');
    return res.status(200).send(Buffer.from(imageBuffer));

  } catch (error) {
    console.error("Erro interno:", error.message);
    return res.status(500).json({ error: "Falha na função: " + error.message });
  }
}