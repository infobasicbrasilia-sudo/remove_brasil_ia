import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Defina sua NOVA chave aqui (a que você gerou após revogar)
const API_KEY = '2b5e49258b218687d9a67067f61751a36b7b81ae3d3afc41b3e8febfb2bfce1caa748f1d4b2d570af9308d6cc1d9f4ad';

// Caminho da imagem (coloque uma imagem na pasta, ex: 'foto.jpg')
const imagePath = 'foto.jpg'; // <-- ALTERE PARA O NOME DO SEU ARQUIVO

// Função para detectar o MIME type a partir do buffer
function detectMimeType(buffer) {
  const signatures = {
    'ffd8ffe0': 'image/jpeg',
    'ffd8ffe1': 'image/jpeg',
    'ffd8ffe2': 'image/jpeg',
    '89504e47': 'image/png',
    '47494638': 'image/gif',
    '52494646': 'image/webp',
  };
  const hex = buffer.toString('hex', 0, 4).toLowerCase();
  return signatures[hex] || 'image/png'; // fallback
}

async function testClipdrop() {
  // Verifica se o arquivo existe
  if (!fs.existsSync(imagePath)) {
    console.error(`❌ Arquivo "${imagePath}" não encontrado.`);
    console.log('📌 Coloque uma imagem (ex: foto.jpg) na mesma pasta.');
    return;
  }

  // Lê a imagem
  const imageBuffer = fs.readFileSync(imagePath);
  console.log(`✅ Imagem lida: ${(imageBuffer.length / 1024).toFixed(2)} KB`);

  // Detecta o tipo MIME
  const mimeType = detectMimeType(imageBuffer);
  console.log(`📌 Tipo detectado: ${mimeType}`);

  // Envia para a Clipdrop
  console.log('📤 Enviando para Clipdrop...');
  try {
    const response = await fetch('https://clipdrop-api.co/remove-background/v1', {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': mimeType,
      },
      body: imageBuffer,
    });

    console.log(`📊 Status da resposta: ${response.status}`);

    if (!response.ok) {
      // Tenta ler o corpo do erro como texto
      const errorText = await response.text();
      console.error(`❌ Erro na Clipdrop: ${errorText}`);
      
      // Se for JSON, tenta parsear
      try {
        const errorJson = JSON.parse(errorText);
        console.error('Detalhes:', errorJson);
      } catch (e) {}
      return;
    }

    // Salva o resultado
    const resultBuffer = await response.buffer();
    const outputPath = 'resultado_sem_fundo.png';
    fs.writeFileSync(outputPath, resultBuffer);
    console.log(`✅ Sucesso! Imagem salva como "${outputPath}"`);
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

testClipdrop();