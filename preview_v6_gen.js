const videoModule = require('./src/modules/video.module');
const path = require('path');
const fs = require('fs');

async function generatePreview() {
    // Usando caminho relativo simples para evitar problemas de escape no Windows/FFMPEG
    const input = 'sample_crime_video.mp4';
    const output = 'elite_preview_v6.mp4';

    console.log('🎬 Iniciando renderização do Dossiê Vídeo v6.0...');
    
    try {
        await videoModule.processEliteVideo(
            input, 
            output, 
            'OPERAÇÃO ESCORPIÃO', 
            'Suspeito é detido em flagrante após perseguição cinematográfica'
        );
        console.log('✅ VÍDEO PRONTO: elite_preview_v6.mp4');
    } catch (error) {
        console.error('❌ Erro na renderização:', error.message);
    }
}

generatePreview();
