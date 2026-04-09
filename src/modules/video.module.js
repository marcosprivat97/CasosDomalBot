const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const logger = require('../logger');

// Configuração do caminho do ffmpeg no Windows (Winget path)
// Configuração do caminho do ffmpeg no Windows (Short path para evitar problemas com espaços)
const FFMPEG_PATH = "C:\\Users\\SEVENB~1\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffmpeg.exe";
ffmpeg.setFfmpegPath(FFMPEG_PATH);

class VideoModule {
    /**
     * Processa um vídeo original para adicionar legendas e branding.
     * @param {string} inputPath Caminho do vídeo original
     * @param {string} outputPath Caminho do vídeo final
     * @param {string} title Título (Urgente)
     * @param {string} subtitle Legenda do caso
     */
    async processEliteVideo(inputPath, outputPath, title, subtitle) {
        return new Promise((resolve, reject) => {
            logger.info('📽️ Iniciando Processamento de Vídeo Elite v6.0...');
            
            if (!fs.existsSync(inputPath)) {
                return reject(new Error(`Vídeo original não encontrado: ${inputPath}`));
            }

            // Sanitização simples para o drawtext do ffmpeg
            const cleanTitle = title.toUpperCase().replace(/'/g, '').replace(/:/g, '\\:');
            const cleanSub = subtitle.replace(/'/g, '').replace(/:/g, '\\:');

            ffmpeg(inputPath)
                .videoFilters([
                    "drawbox=y=ih-ih/4:w=iw:h=ih/4:color=black@0.7:t=fill",
                    "drawbox=y=ih-ih/4:w=iw:h=5:color=#ff4757:t=fill",
                    `drawtext=text='${cleanTitle}':fontcolor=white:fontsize=ih/18:x=(w-text_w)/2:y=ih-ih/4.5:shadowcolor=black:shadowx=2:shadowy=2`,
                    `drawtext=text='${cleanSub}':fontcolor=#ced6e0:fontsize=ih/24:x=(w-text_w)/2:y=ih-ih/6.5:shadowcolor=black:shadowx=1:shadowy=1`,
                    "drawtext=text='CASOS DOMAL':fontcolor=#ff4757@0.5:fontsize=ih/30:x=w-tw-20:y=20"
                ])
                .outputOptions([
                    '-c:v libx264',
                    '-preset fast',
                    '-crf 23',
                    '-c:a copy',
                    '-t 10'
                ])
                .on('start', (cmd) => logger.debug('FFMPEG CMD: ' + cmd))
                .on('error', (err) => {
                    logger.error('❌ Erro no processamento de vídeo:', err.message);
                    reject(err);
                })
                .on('end', () => {
                    logger.info('✅ Vídeo Elite v6.0 Processado com Sucesso!');
                    resolve(outputPath);
                })
                .save(outputPath);
        });
    }
}

module.exports = new VideoModule();
