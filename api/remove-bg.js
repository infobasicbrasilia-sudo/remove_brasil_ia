export const config = {
  api: {
    bodyParser: false, 
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Apenas POST' });

  const REMOVE_BG_KEY = process.env.REMOVE_BG_KEY;
  const CLIPDROP_KEY = process.env.CLIPDROP_API_KEY;

  try {
    // 1. Coleta os dados brutos da imagem
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const bufferBody = Buffer.concat(chunks);

    console.log("Tentando processar com Remove.bg...");

    // 2. TENTATIVA 1: Remove.bg
    let response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": REMOVE_BG_KEY,
        "Content-Type": req.headers['content-type']
      },
      body: bufferBody
    });

    // 3. SE FALHAR (ERRO 402 OU QUALQUER OUTRO) E TIVERMOS A CHAVE DO CLIPDROP
    if (!response.ok && CLIPDROP_KEY) {
      console.warn("Remove.bg falhou ou sem créditos. Tentando ClipDrop...");
      
      // O ClipDrop exige um formato levemente diferente (multipart/form-data)
      // Como o bufferBody já contém o boundary e a imagem do seu formulário original,
      // podemos repassá-lo diretamente mudando apenas o Header e a URL.
      
      response = await fetch("https://clipdrop-api.co/remove-background/v1", {
        method: "POST",
        headers: {
          "x-api-key": CLIPDROP_KEY,
          "Content-Type": req.headers['content-type']
        },
        body: bufferBody
      });
    }

    // 4. VERIFICAÇÃO FINAL
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Ambas as APIs falharam:", errorText);
      return res.status(response.status).send(errorText);
    }

    // Retorna a imagem final (independente de qual API processou)
    const imageBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'image/png');
    return res.status(200).send(Buffer.from(imageBuffer));

  } catch (error) {
    console.error("Erro interno no servidor:", error.message);
    return res.status(500).json({ error: "Falha na função: " + error.message });
  }
}