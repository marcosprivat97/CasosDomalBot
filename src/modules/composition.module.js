const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const logger = require('../logger');

class CompositionModule {
    /**
     * Layout V4 - "Investigação Limpa"
     * 
     * Baseado no mockup do usuário:
     *   - Sem bordas
     *   - Gradiente escuro no rodapé (linear)
     *   - Textos 100% centralizados
     *   - Estrutura: Branding -> Título -> Subtítulo
     */
    async compose(imagePath, title, subtitle = "") {
        logger.info(`🎨 [V4.1 Compact] Compondo card: "${title.substring(0, 40)}..."`);

        // CARREGA CONHECIMENTO APRENDIDO PELO VISUAL MASTER
        let config = {
            font_size_mult: 1.0,
            gradient_intensity: 0.95,
            stroke_width: 1.5
        };

        const knowledgePath = path.join(__dirname, '../../data/visual_knowledge.json');
        if (fs.existsSync(knowledgePath)) {
            try {
                const knowledge = JSON.parse(fs.readFileSync(knowledgePath, 'utf8'));
                if (knowledge.licao_atual && knowledge.licao_atual.config_layout) {
                    config = { ...config, ...knowledge.licao_atual.config_layout };
                    logger.info(`🧬 [AUTO-ESTILO] Aplicando técnicas aprendidas: FontSizex${config.font_size_mult}`);
                }
            } catch (e) {
                logger.error("Erro ao ler visual_knowledge:", e.message);
            }
        }

        try {
            const metadata = await sharp(imagePath).metadata();
            const canvasW = metadata.width;
            const canvasH = metadata.height;

            const wrapText = (text, maxChars) => {
                if (!text) return [];
                const words = text.toUpperCase().replace(/[🔥💰💸👑🤯🚨✨]/gu, '').trim().split(/\s+/);
                const lines = [];
                let cur = '';
                words.forEach(w => {
                    if (cur.length && (cur + ' ' + w).length > maxChars) {
                        lines.push(cur);
                        cur = w;
                    } else {
                        cur = cur ? cur + ' ' + w : w;
                    }
                });
                if (cur) lines.push(cur);

                // --- SMART BALANCE: Evita "viúvas" (uma palavra sozinha no final) ---
                if (lines.length > 1) {
                    const lastLine = lines[lines.length - 1];
                    const prevLine = lines[lines.length - 2];
                    const lastLineWords = lastLine.split(/\s+/);
                    const prevLineWords = prevLine.split(/\s+/);

                    if (lastLineWords.length === 1 && prevLineWords.length > 1) {
                        const wordToMove = prevLineWords.pop();
                        lines[lines.length - 2] = prevLineWords.join(' ');
                        lines[lines.length - 1] = wordToMove + ' ' + lastLine;
                    }
                }
                return lines;
            };

            // ─── CONFIGURAÇÃO COMPACTA ─────────────────────────────────────
            let fontSize = 90 * config.font_size_mult;
            let lineHeight = 100 * config.font_size_mult; // Reduzido para compactar
            let titleLines = wrapText(title, 14); 

            if (titleLines.length > 3) {
                fontSize = 75 * config.font_size_mult;
                lineHeight = 85 * config.font_size_mult;
                titleLines = wrapText(title, 18);
            }
            if (titleLines.length > 4) {
                fontSize = 60 * config.font_size_mult;
                lineHeight = 70 * config.font_size_mult;
                titleLines = wrapText(title, 22);
            }

            // Subtítulo Inteligente (Sem cortar palavras)
            // Limite reduzido para 45 para evitar vazar nas laterais
            const subtitleLinesArr = wrapText(subtitle.charAt(0).toUpperCase() + subtitle.slice(1), 45).slice(0, 3);

            // ─── GEOMETRIA EXTREMA (Focada no Rodapé - Subida Final) ──────
            const bottomMargin = 140; // Subindo mais para não ficar "colado" no chão
            
            // 1. Subtítulo (Base)
            const subtitleY_Base = canvasH - bottomMargin;
            const subtitleH = subtitleLinesArr.length * 42;
            const subtitleY_Start = subtitleY_Base - (subtitleLinesArr.length > 1 ? 42 : 0);

            // 2. Título (Acima do Subtítulo)
            const titleGap = subtitle ? 25 : 15; // Reduzido para descer o título e a logo
            const titleBlockH = (titleLines.length - 1) * lineHeight; 
            const titleY_Last = subtitleY_Base - (subtitleH ? subtitleH + titleGap : 0);
            const titleY_First = titleY_Last - titleBlockH;

            // 3. Branding (Logo Badge Compacto)
            const brandingGap = 35; // Bem perto do título
            const brandingY = (titleY_First - fontSize * 0.9) - brandingGap;
            const badgeW = 320;
            const badgeH = 50;

            const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${canvasW}" height="${canvasH}">
  <defs>
    <!-- Gradiente escuro adaptável -->
    <linearGradient id="blackGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="black" stop-opacity="0" />
      <stop offset="65%" stop-color="black" stop-opacity="${config.gradient_intensity}" />
      <stop offset="100%" stop-color="black" stop-opacity="1" />
    </linearGradient>

    <!-- Gradiente Rubi para a Logo -->
    <linearGradient id="rubyGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#D00000" />
      <stop offset="100%" stop-color="#900000" />
    </linearGradient>

    <!-- Filtro de Sombra para Profundidade -->
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="black" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Gradiente mais baixo para liberar o topo -->
  <rect x="0" y="${canvasH * 0.45}" width="${canvasW}" height="${canvasH * 0.55}" fill="url(#blackGrad)" />

  <!-- Logo Badge Premium v2 (Com Borda e Sombra) -->
  <g filter="url(#shadow)">
    <rect x="${canvasW / 2 - (badgeW + 20) / 2}" y="${brandingY - badgeH / 2 - 8}" 
          width="${badgeW + 20}" height="${badgeH + 4}" 
          fill="url(#rubyGrad)" stroke="white" stroke-width="${config.stroke_width}" rx="2" />
    <text x="${canvasW / 2}" y="${brandingY + 2}" 
          font-family="'Arial Black', sans-serif" font-size="30" font-weight="900" 
          fill="white" text-anchor="middle" letter-spacing="4">CASOS DOMAL</text>
  </g>

  <!-- Título Principal -->
  <text x="${canvasW / 2}" y="${titleY_First}" 
        font-family="'Arial Black', sans-serif" 
        font-size="${fontSize}" font-weight="900" fill="white" 
        text-anchor="middle">
    ${titleLines.map((line, i) => `<tspan x="${canvasW / 2}" dy="${i === 0 ? 0 : lineHeight}">${line}</tspan>`).join('')}
  </text>

  <!-- Subtítulo Master (34px sem quebra de palavra) -->
  ${subtitleLinesArr.length > 0 ? `
  <text x="${canvasW / 2}" y="${subtitleY_Start}" 
        font-family="'Arial', sans-serif" font-size="34" font-weight="400" 
        fill="white" text-anchor="middle">
    ${subtitleLinesArr.map((line, i) => `<tspan x="50%" dy="${i === 0 ? 0 : 42}">${line}</tspan>`).join('')}
  </text>` : ''}
</svg>`;

            const dataDir = path.join(process.cwd(), 'data/output');
            if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

            const outputPath = path.join(dataDir, `domal_investigacao_${Date.now()}.png`);

            await sharp(imagePath)
                .composite([{ input: Buffer.from(svg, 'utf-8'), top: 0, left: 0 }])
                .png()
                .toFile(outputPath);

            logger.info(`✅ [V4.1 Compact] Card gerado com Sucesso!`);
            return outputPath;

        } catch (error) {
            logger.error(`❌ Erro no CompositionModule V4 (Safe): ${error.message}`);
            throw error;
        }
    }
}

module.exports = new CompositionModule();
