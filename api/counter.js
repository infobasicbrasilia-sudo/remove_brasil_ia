import fs from "fs";
import path from "path";

export default async function handler(req, res) {

    try {

        const filePath = path.join(
            process.cwd(),
            "data",
            "counter.json"
        );

        // cria arquivo se não existir
        if (!fs.existsSync(filePath)) {

            fs.writeFileSync(
                filePath,
                JSON.stringify({
                    visits: 504
                }, null, 2)
            );
        }

        // lê arquivo
        const rawData = fs.readFileSync(
            filePath,
            "utf8"
        );

        const data = JSON.parse(rawData);

        // garante número válido
        if (typeof data.visits !== "number") {
            data.visits = 504;
        }

        // soma acesso
        data.visits += 1;

        // salva
        fs.writeFileSync(
            filePath,
            JSON.stringify(data, null, 2)
        );

        // retorna json
        return res.status(200).json({
            visits: data.visits
        });

    } catch (error) {

        console.error("ERRO COUNTER:", error);

        return res.status(500).json({
            visits: 0,
            error: "Erro contador"
        });
    }
}