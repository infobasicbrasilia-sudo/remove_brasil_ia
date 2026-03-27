export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    // A chave fica SEGURA aqui, pois este código roda no servidor
    const API_KEY = process.env.CONVERTIO_KEY; 
    const body = req.body;

    try {
        const response = await fetch('https://api.convertio.co/convert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                apikey: API_KEY,
                input: 'base64',
                file: body.file,
                filename: body.filename,
                outputformat: 'mp3'
            })
        });

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Erro no servidor' });
    }
}