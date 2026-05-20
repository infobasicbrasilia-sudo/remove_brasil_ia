import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "counter.json");

export default async function handler(req, res) {

    try {

        // lê contador atual
        const data = JSON.parse(
            fs.readFileSync(filePath, "utf8")
        );

        // soma +1
        data.visits += 1;

        // salva
        fs.writeFileSync(
            filePath,
            JSON.stringify(data, null, 2)
        );

        // retorna valor
        return res.status(200).json({
            visits: data.visits
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: "Erro no contador"
        });
    }
}