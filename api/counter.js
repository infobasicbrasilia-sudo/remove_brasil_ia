import fs from "fs";
import path from "path";

export default async function handler(req, res) {

    try {

        const filePath = path.join(
            process.cwd(),
            "data",
            "counter.json"
        );

        const data = JSON.parse(
            fs.readFileSync(filePath, "utf8")
        );

        return res.status(200).json({
            visits: data.visits
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            visits: 0
        });
    }
}