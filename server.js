import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
const upload = multer({ dest: 'temp/' });

if (!fs.existsSync('temp')) fs.mkdirSync('temp');

app.post('/api/remove-bg', upload.single('image_file'), (req, res) => {
  const inputPath = req.file.path;
  const outputPath = path.join('temp', uuidv4() + '.png');

  console.log(`📥 Imagem: ${req.file.originalname} (${req.file.size} bytes)`);
  console.log(`📁 Entrada: ${inputPath}`);
  console.log(`📁 Saída: ${outputPath}`);

  // Chama o script Python
  const command = `python remove_bg.py "${inputPath}" "${outputPath}"`;
  console.log(`🔄 Executando: ${command}`);

  exec(command, (error, stdout, stderr) => {
    console.log('📤 stdout:', stdout);
    console.log('📤 stderr:', stderr);

    if (error) {
      console.error(`❌ Erro: ${error.message}`);
      return res.status(500).send('Erro: ' + stderr || error.message);
    }

    if (!fs.existsSync(outputPath)) {
      console.error('❌ Arquivo de saída não gerado.');
      return res.status(500).send('Arquivo de saída não gerado.');
    }

    console.log('✅ Imagem processada! Enviando...');
    res.sendFile(outputPath, { root: '.' }, (err) => {
      try { fs.unlinkSync(inputPath); } catch (e) {}
      try { fs.unlinkSync(outputPath); } catch (e) {}
      if (err) console.error('Erro ao enviar:', err);
    });
  });
});

app.use(express.static('.'));

app.listen(port, () => {
  console.log(`🔥 Servidor em http://localhost:${port}`);
  console.log(`📤 POST /api/remove-bg`);
});