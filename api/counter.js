import fs from "fs";
import path from "path";

export default async function handler(req, res) {
    
    // 🔒 Configurar CORS para permitir requisições do painel
    const allowedOrigins = [
        'https://seu-painel.vercel.app',  // Substitua pelo seu domínio
        'https://remove-brasil-ia.vercel.app',
        'http://localhost:3000'
    ];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Responder preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        const filePath = path.join(process.cwd(), "data", "counter.json");
        
        // Garantir que a pasta data existe
        const dataDir = path.join(process.cwd(), "data");
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        // Garantir que o arquivo existe
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify({ visits: 0 }), "utf8");
        }
        
        // LER contador atual
        const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
        
        // ✅ INCREMENTAR contador (somente para GET, não para OPTIONS)
        if (req.method === 'GET') {
            data.visits = (data.visits || 0) + 1;
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
        }
        
        return res.status(200).json({
            visits: data.visits,
            status: "success"
        });
        
    } catch (error) {
        console.error("Erro no contador:", error);
        
        return res.status(500).json({
            visits: 0,
            error: "Erro interno"
        });
    }
}