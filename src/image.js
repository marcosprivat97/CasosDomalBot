const sharp = require('sharp');
const logger = require('./logger');

/**
 * Motor de Composicao Visual Elite v12.0 - "Ultra Quality Mode"
 * Design: Selo Vermelho + Melhoria de Imagem AI-Style + Máxima Nitidez.
 */

/**
 * Função Auxiliar: Booster de Qualidade (Lanczos3 + Sharpen + Color)
 */
async function boostImageQuality(buffer, targetWidth, targetHeight) {
  try {
    return await sharp(buffer)
      .resize(targetWidth, targetHeight, { 
        fit: 'cover',
        kernel: sharp.kernel.lanczos3 
      })
      .modulate({
        brightness: 1.05,
        contrast: 1.1,
        saturation: 1.15
      })
      .sharpen({
        sigma: 1.2,
        m1: 0.5,
        m2: 0.8
      })
      .toBuffer();
  } catch (e) {
    logger.error(`⚠️ Falha no Booster de Qualidade: ${e.message}`);
    return buffer;
  }
}

async function createViralCollage(image1Buffer, image2Buffer, title, subtitle = "", options = {}) {
  try {
    const isStory = options.type === 'story';
    const documentaryMode = options.documentaryMode !== false;
    
    logger.info(`🎨 [V4.1 Compact] ${isStory ? 'STORY' : 'FEED'} - Título: ${title.substring(0, 30)}`);
    
    const WIDTH = 1080;
    const HEIGHT = isStory ? 1920 : 1080;

    // 1. Processar Imagem(s) com Boost de Qualidade
    let baseImage;
    if (image2Buffer && !isStory) {
      logger.info(`✨ Aplicando Filtros de Nitidez e Qualidade (Dual Mode)...`);
      const img1 = await boostImageQuality(image1Buffer, WIDTH / 2, HEIGHT);
      const img2 = await boostImageQuality(image2Buffer, WIDTH / 2, HEIGHT);
      
      baseImage = await sharp({
        create: { width: WIDTH, height: HEIGHT, channels: 4, background: { r: 17, g: 17, b: 17, alpha: 1 } }
      })
      .composite([
        { input: img1, left: 0, top: 0 }, 
        { input: img2, left: WIDTH / 2, top: 0 }
      ])
      .jpeg()
      .toBuffer();
    } else {
      logger.info(`✨ Aplicando Filtros de Nitidez e Qualidade (Single Mode)...`);
      baseImage = await boostImageQuality(image1Buffer, WIDTH, HEIGHT);
    }

    // 2. Efeito Dramático e Textura Ultra
    let processedBase = sharp(baseImage);
    
    // Filtro de "Grão Cinematográfico" para mascarar pixelização e dar textura premium
    const noiseSvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.60" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.06" />
          </feComponentTransfer>
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    `);

    // 3. Gradiente para Legenda (Apenas no Rodapé)
    const gradientSvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="45%" style="stop-color:black;stop-opacity:0" />
            <stop offset="70%" style="stop-color:black;stop-opacity:0.95" />
            <stop offset="100%" style="stop-color:black;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)" />
      </svg>
    `);

    // 4. Lógica de Wrapping e Resize (Escala Adaptativa)
    let fontSize = 90;
    let titleLineH = 100;
    let titleLines = wrapText(title, 14, 6);

    if (titleLines.length > 3) {
      fontSize = 75;
      titleLineH = 85;
      titleLines = wrapText(title, 18, 6);
    }
    if (titleLines.length > 4) {
      fontSize = 60;
      titleLineH = 70;
      titleLines = wrapText(title, 22, 8);
    }

    // Subtítulo Master Inteligent
    const subtitleLinesArr = wrapText(subtitle, 45).slice(0, 3);

    // ─── GEOMETRIA COMPACTA 4.1 (Bottom-Up) ────────────────────────────
    const bottomMargin = isStory ? 250 : 140;
    
    // 1. Subtítulo (Base)
    const subtitleH = subtitleLinesArr.length * 42;
    const subtitleY_Base = HEIGHT - bottomMargin;
    const subtitleY_Start = subtitleY_Base - (subtitleLinesArr.length > 1 ? (subtitleLinesArr.length - 1) * 42 : 0);

    // 2. Título (Acima do Subtítulo)
    const titleGap = subtitleLinesArr.length > 0 ? 25 : 15;
    const titleBlockH = (titleLines.length - 1) * titleLineH; 
    const titleY_Last = subtitleY_Base - (subtitleH ? subtitleH + titleGap : 0);
    const titleY_First = titleY_Last - titleBlockH;

    // 3. Branding (Logo Badge Compacto)
    const brandingGap = 35;
    const brandingY = (titleY_First - fontSize * 0.9) - brandingGap;
    const badgeW = 320;
    const badgeH = 50;

    const textSvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}">
        <defs>
          <linearGradient id="rubyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#D00000" />
            <stop offset="100%" stop-color="#900000" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="black" flood-opacity="0.6"/>
          </filter>
        </defs>

        <style>
          .t-brand { fill: white; font-size: 30px; font-family: 'Arial Black', sans-serif; font-weight: 900; letter-spacing: 4px; text-transform: uppercase; }
          .t-title { fill: white; font-size: ${fontSize}px; font-family: 'Arial Black', sans-serif; font-weight: 900; text-transform: uppercase; }
          .t-sub { fill: white; font-size: 34px; font-family: 'Arial', sans-serif; }
        </style>
        
        <!-- Logo Badge Premium v2 -->
        <g filter="url(#shadow)">
          <rect x="${WIDTH/2 - (badgeW + 20)/2}" y="${brandingY - badgeH/2 - 8}" 
                width="${badgeW + 20}" height="${badgeH + 4}" 
                fill="url(#rubyGrad)" stroke="white" stroke-width="1.5" rx="2" />
          <text x="50%" y="${brandingY + 2}" text-anchor="middle" class="t-brand">CASOS DOMAL</text>
        </g>

        <text x="50%" y="${titleY_First}" text-anchor="middle" class="t-title">
          ${titleLines.map((l, i) => `<tspan x="50%" dy="${i === 0 ? 0 : titleLineH}">${l}</tspan>`).join('')}
        </text>

        ${subtitleLinesArr.length > 0 ? `
        <text x="50%" y="${subtitleY_Start}" text-anchor="middle" class="t-sub">
          ${subtitleLinesArr.map((l, i) => `<tspan x="50%" dy="${i === 0 ? 0 : 42}">${l}</tspan>`).join('')}
        </text>` : ''}
      </svg>
    `);

    const finalBuffer = await processedBase
      .composite([
        { input: noiseSvg, left: 0, top: 0 }, // Camada de Textura Mestra
        { input: gradientSvg, left: 0, top: 0 },
        { input: textSvg, left: 0, top: 0 }
      ])
      .jpeg({ quality: 95 }) // Aumento da qualidade final para 95%
      .toBuffer();

    logger.info(`✅ Arte Final Compacta 4.1 Criada!`);
    return finalBuffer;

  } catch (error) {
    logger.error('❌ Erro no Gerador de Imagem:', error.message);
    throw error;
  }
}

/**
 * Gerador de Post de Texto (Fundo Sólido "Fake Native")
 */
async function createTextViralPost(text, backgroundColor = '#D00000') {
  const WIDTH = 1080;
  const HEIGHT = 1080;
  
  const titleLines = wrapText(text, 15, 8);
  const lineHeight = 100;
  
  const textSvg = Buffer.from(`
    <svg width="${WIDTH}" height="${HEIGHT}">
      <rect width="100%" height="100%" fill="${backgroundColor}" />
      <style>
        .t-text { 
          fill: white; 
          font-size: 85px; 
          font-family: 'Arial Black', sans-serif; 
          font-weight: 900; 
          text-transform: uppercase;
        }
      </style>
      <text x="50%" y="45%" text-anchor="middle" class="t-text">
        ${titleLines.map((l, i) => `<tspan x="50%" dy="${i === 0 ? 0 : lineHeight}">${l}</tspan>`).join('')}
      </text>
    </svg>
  `);

  return await sharp(textSvg).jpeg({ quality: 95 }).toBuffer();
}

function wrapText(text, maxChars, maxLines = 10) {
  if (!text) return [];
  const cleanText = String(text).replace(/\s+/g, ' ');
  const words = cleanText.split(' ');
  const lines = [];
  let current = '';
  
  words.forEach(w => {
    const spaceOffset = current.length > 0 ? 1 : 0;
    if ((current.length + spaceOffset + w.length) <= maxChars) {
      current += (current ? ' ' : '') + w;
    } else {
      current = current.trim();
      if (current) lines.push(current);
      current = w;
    }
  });
  if (current) lines.push(current.trim());
  
  // --- SMART BALANCE: Evita "viúvas" ---
  if (lines.length > 1) {
    const lastLine = lines[lines.length - 1];
    const prevLine = lines[lines.length - 2];
    const lastWords = lastLine.split(/\s+/);
    const prevWords = prevLine.split(/\s+/);

    if (lastWords.length === 1 && prevWords.length > 1) {
      const movedWord = prevWords.pop();
      lines[lines.length - 2] = prevWords.join(' ');
      lines[lines.length - 1] = movedWord + ' ' + lastLine;
    }
  }

  return lines.slice(0, maxLines);
}

module.exports = { createViralCollage, createTextViralPost };
