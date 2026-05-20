export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {

  // Segurança
  res.setHeader(
    "X-Content-Type-Options",
    "nosniff"
  );

  if (req.method !== "POST") {

    return res.status(405).json({
      error: "Método inválido"
    });
  }

  const CLIPDROP_KEY =
    process.env.CLIPDROP_API_KEY;

  if (!CLIPDROP_KEY) {

    return res.status(500).send(
      "API não configurada."
    );
  }

  try {

    const chunks = [];

    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const bufferBody = Buffer.concat(chunks);

    // limite 5MB
    if (bufferBody.length > 5 * 1024 * 1024) {

      return res.status(413).send(
        "Arquivo muito grande."
      );
    }

    const response = await fetch(
      "https://clipdrop-api.co/remove-background/v1",
      {
        method: "POST",
        headers: {
          "x-api-key": CLIPDROP_KEY,
          "Content-Type":
            req.headers["content-type"]
        },
        body: bufferBody
      }
    );

    if (!response.ok) {

      const errorText =
        await response.text();

      console.error(errorText);

      return res.status(500).send(
        "Erro ao processar imagem."
      );
    }

    const imageBuffer =
      await response.arrayBuffer();

    res.setHeader(
      "Content-Type",
      "image/png"
    );

    return res
      .status(200)
      .send(Buffer.from(imageBuffer));

  } catch (error) {

    console.error(error);

    return res.status(500).send(
      "Erro interno."
    );
  }
}