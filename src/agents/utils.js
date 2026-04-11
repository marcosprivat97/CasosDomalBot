require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { Groq } = require("groq-sdk");

const logger = require("../logger");

// CONFIGURAÇÃO MULTI-ENGINE (RODÍZIO DINÂMICO DE CHAVES)
function getGroqClient() {
    const status = getSharedStatus();
    const keyIndex = status.groq_key_index !== undefined ? status.groq_key_index : 0;
    
    // Busca automática por todas as chaves GROQ_API_KEY, GROQ_API_KEY_2, GROQ_API_KEY_3...
    const keys = Object.keys(process.env)
        .filter(k => k.startsWith("GROQ_API_KEY"))
        .map(k => (process.env[k] || "").trim())
        .filter(k => k.startsWith("gsk_"));

    if (keys.length < 2) {
        logger.warn(`⚠️ [MODO LIMITADO] Apenas ${keys.length} chave(s) do Groq detectada(s). Adicione 'GROQ_API_KEY_2', 'GROQ_API_KEY_3' etc. nos Secrets do GitHub para maior autonomia.`);
    }

    // Segurança: se o index estiver fora do array, reseta
    const safeIndex = keys.length > 0 ? (keyIndex % keys.length) : 0;
    const apiKey = keys[safeIndex];

    if (!apiKey) {
        logger.error("🛑 [CRÍTICO] Nenhuma chave do Groq encontrada!");
        return null;
    }

    return { 
        client: new Groq({ apiKey }), 
        index: safeIndex, 
        total: keys.length,
        next: () => {
            if (keys.length < 2) return; // Não há para onde rotacionar
            const nextIndex = (safeIndex + 1) % keys.length;
            saveSharedStatus({ groq_key_index: nextIndex });
            logger.important(`🔄 [FAILOVER] Alternando chave do Groq para Motor #${nextIndex + 1}`);
        }
    };
}

const siliconKey = (process.env.SILICONFLOW_API_KEY || "").trim();

if (!siliconKey) logger.warn("⚠️ SILICONFLOW_API_KEY ausente.");




/**
 * Helper para chamadas Groq com Retry e Backoff Exponencial
 * Evita o erro 429 (Rate Limit Exceeded).
 */
const API_STATUS_PATH = path.join(__dirname, '../../data/api_status.json');
const models = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
    "gemma2-9b-it"
];

function getSharedStatus() {
    try {
        if (!fs.existsSync(API_STATUS_PATH)) return {};
        return JSON.parse(fs.readFileSync(API_STATUS_PATH, 'utf8'));
    } catch (e) {
        return {};
    }
}

function saveSharedStatus(newData) {
    try {
        const current = getSharedStatus();
        const merged = { ...current, ...newData };
        fs.writeFileSync(API_STATUS_PATH, JSON.stringify(merged, null, 2));
    } catch (e) {
        logger.error('Erro ao salvar status de API:', e.message);
    }
}

async function novaApiRequest(options, retries = 3) {
    let status = getSharedStatus();
    let novaIndex = status.nova_index || 1;
    
    const keysArr = Object.keys(process.env).filter(k => k.startsWith('NOVA_API_KEY_'));
    const totalKeys = keysArr.length;

    if (novaIndex > totalKeys) {
        return null; // Todas as chaves da SambaNova estão esgotadas ou inválidas
    }

    for (let i = 0; i < retries; i++) {
        const apiKey = process.env[`NOVA_API_KEY_${novaIndex}`];
        if (!apiKey) {
             if (novaIndex < totalKeys) { novaIndex++; continue; }
             break;
        }

        logger.warn(`🚀 [PLANO ÔMEGA] SambaNova Ciclone: Usando Chave ${novaIndex}/${totalKeys}...`);

        try {
            const response = await axios.post(
                "https://api.sambanova.ai/v1/chat/completions",
                {
                    model: "Meta-Llama-3.1-70B-Instruct", // Modelo estável
                    messages: options.messages,
                    temperature: options.temperature || 0.7,
                    max_tokens: options.max_tokens || 1000
                },
                {
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json"
                    },
                    timeout: 30000
                }
            );
            return { choices: [{ message: { content: response.data.choices[0].message.content } }] };
        } catch (error) {
            const status = error.response ? error.response.status : null;
            
            // Se a chave for 401 (Unauthorized), ela está morta e não deve ser re-tentada
            if (status === 401 || status === 403) {
                logger.error(`❌ Chave SambaNova ${novaIndex} INVÁLIDA (401/403). Pulando permanentemente...`);
                novaIndex++;
                saveSharedStatus({ nova_index: novaIndex, nova_timestamp: Date.now() });
                if (novaIndex <= totalKeys) {
                    i--; continue;
                } else {
                    break; // Fim das chaves disponíveis
                }
            }
            
            if (status === 429 && novaIndex < totalKeys) {
                novaIndex++;
                saveSharedStatus({ nova_index: novaIndex, nova_timestamp: Date.now() });
                logger.warn(`🔄 [CICLONE] Chave ${novaIndex - 1} esgotada. Tentando Chave ${novaIndex}/${totalKeys}...`);
                i--; continue;
            }
            
            logger.error(`❌ Falha na SambaNova (Chave ${novaIndex}): ${error.message}`);
        }
    }
    logger.error(`⚠️ [ALERTA] Plano Ômega indisponível (Chaves esgotadas ou inválidas).`);
    return null;
}

/**
 * SILICON BRAIN: Redundância Final via SiliconFlow (DeepSeek V3)
 */
async function siliconRequest(options) {
    const apiKey = (process.env.SILICONFLOW_API_KEY || "").trim();
    if (!apiKey) return null;

    logger.warn(`🚀 [PLANO ZERA] SiliconFlow DeepSeek: Acionando última linha de defesa...`);

    try {
        const response = await axios.post(
            "https://api.siliconflow.cn/v1/chat/completions",
            {
                model: "deepseek-ai/DeepSeek-V3",
                messages: options.messages,
                temperature: options.temperature || 0.7,
                max_tokens: options.max_tokens || 2000
            },
            {
                headers: {
                    "Authorization": `Bearer ${apiKey.startsWith('sk-') ? apiKey : 'sk-' + apiKey}`,
                    "Content-Type": "application/json"
                },
                timeout: 45000
            }
        );
        return { choices: [{ message: { content: response.data.choices[0].message.content } }] };
    } catch (error) {
        logger.error(`❌ Falha na SiliconFlow: ${error.message}`);
        return null;
    }
}



/**
 * MASTER BRAIN v12.7: Sistema de Contingência com Downscaling Automático e Multi-Motor
 */
async function masterBrainRequest(options, retries = 3) {
    logger.info(`🧠 [MASTER BRAIN] Iniciando requisição de alta performance...`);

    // 1. TENTA GROQ (NÍVEL MESTRE: 70B+)
    const masterModels = ["llama-3.3-70b-versatile"];
    for (const model of masterModels) {
        // Tentamos TODOS os motores disponíveis dinamicamente
        const initialInfo = getGroqClient();
        const totalMotors = initialInfo ? initialInfo.total : 0;
        
        for (let motorTry = 0; motorTry < totalMotors; motorTry++) {
            const groqInfo = getGroqClient();
            if (!groqInfo) break;

            try {
                logger.warn(`🔄 [MASTER BRAIN] Tentando 70B (${model}) no Motor #${groqInfo.index + 1} (Tentativa ${motorTry + 1}/2)`);
                const response = await groqInfo.client.chat.completions.create({ ...options, model });
                return response;
            } catch (e) {
                if (e.status === 429) {
                    logger.error(`🛑 Motor #${groqInfo.index + 1} sem cota para 70B. Rotacionando...`);
                    groqInfo.next();
                } else {
                    logger.error(`⚠️ Erro no Groq ${model}: ${e.message}`);
                    break; // Se não for erro de cota, pula para o próximo modelo
                }
            }
        }
    }

    // 2. LIFEBOAT CLASSE (8B): Caso o 70B falhe, tentamos o 8B (também em todos os motores)
    const lifeboats = ["llama-3.1-8b-instant", "gemma2-9b-it"];
    for (const model of lifeboats) {
        const initialInfo = getGroqClient();
        const totalMotors = initialInfo ? initialInfo.total : 0;

        for (let motorTry = 0; motorTry < totalMotors; motorTry++) {
            const groqInfo = getGroqClient();
            if (!groqInfo) break;

            try {
                logger.important(`🛶 [LIFEBOAT] Tentando 8B de Resgate (${model}) no Motor #${groqInfo.index + 1}`);
                const response = await groqInfo.client.chat.completions.create({ ...options, model });
                return response;
            } catch (e) {
                if (e.status === 429) {
                    groqInfo.next();
                } else {
                    break;
                }
            }
        }
    }

    // 3. TENTA SAMBANOVA (Fallback Externo)
    const nova = await novaApiRequest(options);
    if (nova) return nova;

    // 4. PLANO ZERA: SILICONFLOW (DeepSeek V3)
    const silicon = await siliconRequest(options);
    if (silicon) return silicon;

    throw new Error("❌ FALHA TOTAL: Todos os motores e modelos (Groq, SambaNova e SiliconFlow) estão sem cota.");
}


/**
 * groqRequest (v13.0 Legacy Wrapper)
 * Redireciona chamadas antigas para o motor de alta resiliencia Master Brain.
 */
async function groqRequest(options, retries = 3) {
    logger.info(`🔄 [LEGACY REDIRECT] Redirecionando para Master Brain para garantir resiliência...`);
    return await masterBrainRequest(options, retries);
}

/**
 * Extrai e converte JSON de respostas da IA (robusto contra markdown)
 */
function parseGroqResponse(response) {
    const raw = response.choices[0].message.content.trim();
    
    // 1. Extração Precisa: Entre a primeira { e a última }
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
        // Fallback: se não houver chaves, mas o conteúdo parecer ser o texto que queremos,
        // tentamos envolver em um objeto genérico para não quebrar o pipeline.
        logger.warn("⚠️ IA não enviou JSON. Tentando reparo de emergência...");
        if (raw.length > 100) {
            return {
                texto_principal: raw,
                legenda_formatada: raw,
                tema: "Caso Detectado",
                titulo_imagem: "Cena do Caso"
            };
        }
        throw new Error(`A IA não retornou um objeto JSON válido. Resposta: ${raw.substring(0, 50)}...`);
    }
    
    let jsonStr = raw.substring(firstBrace, lastBrace + 1);

    try {
        // Tenta Parse Direto
        return JSON.parse(jsonStr);
    } catch (e) {
        logger.warn(`⚠️ JSON Sujo detectado. Tentando higienização profunda...`);
        
        try {
            // 2. Limpeza de strings: escapa quebras de linha e aspas internas
            let cleaned = jsonStr.replace(/"([^"\\]*(\\.[^"\\]*)*)"/gs, (match) => {
                // Remove quebras de linha literais dentro das aspas
                let content = match.substring(1, match.length - 1);
                content = content.replace(/\n/g, "\\n").replace(/\r/g, "\\r");
                // Tenta não quebrar aspas já escapadas, mas escapa as que estão sozinhas
                // (Abordagem simples: escapa todas e depois desfaz o escape duplo se ocorrer)
                // Mas o mais seguro aqui para IA é focar nas quebras de linha que são o erro mais comum.
                return `"${content}"`;
            });

            return JSON.parse(cleaned);
        } catch (e2) {
            logger.error(`❌ Erro Persistente no JSON (IA). Tentando modo agressivo...`);
            
            try {
                // Tentativa final: Remove caracteres de controle mantendo a estrutura
                let aggressive = jsonStr.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F]/g, "");
                return JSON.parse(aggressive);
            } catch (e3) {
                throw new Error(`Falha crítica no parse (IA): ${e2.message}`);
            }
        }
    }
}

/**
 * Carrega a estratégia atual definida pelo CEO.
 */
function getCEOStrategy() {
    const strategyPath = path.join(__dirname, '../../data/team_memory.json');
    if (fs.existsSync(strategyPath)) {
        try {
            const memory = JSON.parse(fs.readFileSync(strategyPath, 'utf8'));
            return memory.ceo_orders || memory; 
        } catch (e) {
            return null;
        }
    }
    return null;
}

/**
 * Formata as ordens do CEO para serem injetadas no prompt.
 */
function formatStrategyForPrompt(strategy) {
    if (!strategy) return "";
    
    return `
--- DIRETRIZES ESTRATÉGICAS DO CEO (OBRIGATÓRIO SEGUIR) ---
ESTRATÉGIA DA SEMANA: ${strategy.estrategia_semana}
ORDENS PARA VOCÊ:
${strategy.ordens_cacador ? `- CAÇADOR: ${strategy.ordens_cacador.join(', ')}` : ''}
${strategy.ordens_redator ? `- REDATOR: ${strategy.ordens_redator.join(', ')}` : ''}
${strategy.ordens_diretor_visual ? `- VISUAL: ${strategy.ordens_diretor_visual.join(', ')}` : ''}
NÍVEL DE URGÊNCIA: ${strategy.nivel_urgencia}
-------------------------------------------------------
`;
}

/**
 * safeFetch - Wrapper robusto para axios com retries e User-Agent rotativo.
 */
async function safeFetch(url, options = {}, retries = 3) {
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0'
    ];

    const referers = [
        'https://www.google.com.br/',
        'https://www.facebook.com/',
        'https://t.co/',
        'https://www.bing.com/',
        'https://news.google.com/'
    ];

    const config = {
        timeout: 30000, 
        ...options,
        headers: {
            'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
            'Referer': referers[Math.floor(Math.random() * referers.length)],
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'cross-site',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            ...(options.headers || {})
        }
    };

    for (let i = 0; i <= retries; i++) {
        try {
            return await axios.get(url, config);
        } catch (error) {
            const status = error.response ? error.response.status : null;
            
            if (status === 404) {
                logger.warn(`🚫 Recurso não encontrado (404): ${url}`);
                throw error;
            }

            const isRetryable = !status || [408, 429, 500, 502, 503, 504].includes(status);

            if (isRetryable && i < retries) {
                const waitTime = 3000 * Math.pow(2, i);
                logger.warn(`⚠️ Erro ${status || 'Network/Timeout'} em ${url}. Tentativa ${i + 1}/${retries}. Retentando em ${waitTime / 1000}s...`);
                await new Promise(r => setTimeout(r, waitTime));
                continue;
            }
            throw error;
        }
    }
}

async function searchImages(query, limit = 1) {
    try {
        const ImageModule = require("../modules/image.module");
        let results = [];
        
        let currentQuery = query.replace(/[^\w\sáàâãéèêíïóôõöúç]/gi, ' ').trim(); 
        let queryWords = currentQuery.split(/\s+/);

        while (queryWords.length >= 2 && results.length < limit) {
            const searchQuery = queryWords.join(" ");
            logger.info(`🔍 [RESILIENTE] Buscando imagens: "${searchQuery}" (Tentativa com ${queryWords.length} palavras)`);
            
            // Usar searchBingImages que é o método correto no image.module.js
            const buffer = await ImageModule.searchBingImages(searchQuery);
            if (buffer) {
                results.push({ buffer });
                if (results.length >= limit) break;
            } else {
                queryWords.pop();
            }
        }

        if (results.length === 0) {
            logger.warn(`⚠️ [FALLBACK] Falha total na busca específica. Tentando termo genérico...`);
            const fallbackBuffer = await ImageModule.searchBingImages("misterios curiosidades arquivo");
            if (fallbackBuffer) results.push({ buffer: fallbackBuffer });
        }
        
        return results;
    } catch (error) {
        logger.error(`❌ Erro em searchImages: ${error.message}`);
        return [];
    }
}

/**
 * Gera uma imagem via IA utilizando Hugging Face (Plano Alpha)
 * @param {string} prompt O prompt detalhado em inglês
 */
async function generateImageViaAI(prompt) {
    try {
        const ImageGeneratorModule = require("../modules/image_generator.module");
        return await ImageGeneratorModule.generate(prompt);
    } catch (error) {
        logger.error(`❌ Falha na Geração IA (Proxy): ${error.message}`);
        return null;
    }
}

module.exports = { 
    getCEOStrategy, 
    formatStrategyForPrompt, 
    groqRequest, 
    safeFetch, 
    parseGroqResponse, 
    novaApiRequest,
    masterBrainRequest,
    searchImages,
    generateImageViaAI
};


