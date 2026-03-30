export const config = {
  api: {
    bodyParser: false, // Mantemos desativado para a imagem passar pura
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Apenas POST' });

  // Puxa as duas chaves das variáveis de ambiente da Vercel
  const REMOVE_BG_KEY = process.env.REMOVE_BG_KEY;
  const CLIPDROP_KEY = process.env.CLIPDROP_API_KEY;

  try {
    // Coleta os dados brutos da requisição (Buffer)
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const bufferBody = Buffer.concat(chunks);

    console.log("Tentativa 1: Enviando para Remove.bg...");

    // TENTATIVA 1: Remove.bg (Prioridade)
    let response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": REMOVE_BG_KEY,
        "Content-Type": req.headers['content-type']
      },
      body: bufferBody
    });

    // TENTATIVA 2: Se o Remove.bg falhar (status não for 200) e tivermos a chave do ClipDrop
    if (!response.ok && CLIPDROP_KEY) {
      console.warn("Remove.bg sem créditos ou falhou. Tentativa 2: ClipDrop...");
      
      response = await fetch("https://clipdrop-api.co/remove-background/v1", {
        method: "POST",
        headers: {
          "x-api-key": CLIPDROP_KEY,
          "Content-Type": req.headers['content-type']
        },
        body: bufferBody
      });
    }

    // Se após as duas tentativas ainda estiver com erro
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Ambas as APIs falharam:", errorText);
      return res.status(response.status).send(errorText);
    }

    // Se uma das duas deu certo, processa o resultado
    const imageBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'image/png');
    return res.status(200).send(Buffer.from(imageBuffer));

  } catch (error) {
    console.error("Erro crítico no servidor:", error.message);
    return res.status(500).json({ error: "Falha na função: " + error.message });
  }
}