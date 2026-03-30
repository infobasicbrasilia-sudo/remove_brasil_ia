export const config = {
  api: {
    bodyParser: false, // Necessário para processar o stream da imagem corretamente
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Apenas POST permitido' });

  // Agora usamos apenas a chave do ClipDrop
  const CLIPDROP_KEY = process.env.CLIPDROP_API_KEY;

  if (!CLIPDROP_KEY) {
    console.error("ERRO: Variável CLIPDROP_API_KEY não configurada na Vercel.");
    return res.status(500).json({ error: "Configuração de API ausente." });
  }

  try {
    // Coleta os dados brutos da imagem (Buffer)
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const bufferBody = Buffer.concat(chunks);

    console.log("Processando imagem via ClipDrop API...");

    // Chamada direta para o ClipDrop
    const response = await fetch("https://clipdrop-api.co/remove-background/v1", {
      method: "POST",
      headers: {
        "x-api-key": CLIPDROP_KEY,
        "Content-Type": req.headers['content-type'] // Repassa o multipart/form-data original
      },
      body: bufferBody
    });

    // Se a API do ClipDrop retornar erro (ex: limite atingido ou chave inválida)
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro na API ClipDrop:", errorText);
      return res.status(response.status).send(errorText);
    }

    // Sucesso: Recebe a imagem processada
    const imageBuffer = await response.arrayBuffer();
    
    // Configura o cabeçalho para responder como imagem PNG
    res.setHeader('Content-Type', 'image/png');
    return res.status(200).send(Buffer.from(imageBuffer));

  } catch (error) {
    console.error("Erro interno no servidor Brasil IA:", error.message);
    return res.status(500).json({ error: "Falha interna: " + error.message });
  }
}