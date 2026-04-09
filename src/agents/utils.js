require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { Groq } = require("groq-sdk");
const { HfInference } = require('@huggingface/inference');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("../logger");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const hf = new HfInference(process.env.HF_TOKEN);
const rawGeminiKey = (process.env.GEMINI_API_KEY || "").trim();
const genAI = rawGeminiKey ? new GoogleGenerativeAI(rawGeminiKey) : null;

/**
 * Helper para chamadas Groq com Retry e Backoff Exponencial
 * Evita o erro 429 (Rate Limit Exceeded).
 */
const API_STATUS_PATH = path.join(__dirname, '../../data/api_status.json');
const models = [
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
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
 * Plano Gamma: Gemini (Cérebro Google)
 */
async function geminiRequest(options) {
    if (!genAI) return null;
    
    try {
        logger.warn(`🚀 [PLANO GAMMA] Acionando Cérebro Gemini 2.0...`);
        
        const modelName = "gemini-2.0-flash"; 
        const model = genAI.getGenerativeModel({ model: modelName });

        const systemPrompt = options.messages.find(m => m.role === 'system')?.content || "";
        const userPrompt = options.messages.filter(m => m.role !== 'system').map(m => m.content).join("\n");
        const finalPrompt = systemPrompt ? `INSTRUÇÕES DO SISTEMA: ${systemPrompt}\n\nREQUISIÇÃO: ${userPrompt}` : userPrompt;

        const result = await model.generateContent(finalPrompt);
        const text = result.response.text();

        if (!text) throw new Error("Resposta do Gemini 2.0 vazia.");

        return { choices: [{ message: { content: text } }] };
    } catch (e) {
        logger.error(`❌ Falha no Cérebro Gemini 2.0: ${e.message}`);
        
        try {
            logger.warn(`🔄 Tentando Fallback para Gemini 2.0 Flash-Lite...`);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
            const result = await model.generateContent(options.messages.map(m => m.content).join("\n"));
            const text = result.response.text();
            return { choices: [{ message: { content: text } }] };
        } catch (e2) {
            logger.error(`❌ Falha Total no Gemini Nova Geração: ${e2.message}`);
            return null;
        }
    }
}

async function groqRequest(options, retries = 5, delay = 3000) {
    let status = getSharedStatus();
    let currentSharedIndex = status.index || 0;
    
    for (let i = 0; i < retries; i++) {
        const currentModel = models[currentSharedIndex];
        const requestOptions = {
            model: currentModel,
            ...options
        };

        try {
            const response = await groq.chat.completions.create(requestOptions);
            return response;
        } catch (error) {
            const errorMsg = error.message || "";
            const status = error.status || (error.response ? error.response.status : null);
            const isRateLimit = status === 429 || errorMsg.includes("Rate limit");
            const isDecommissioned = errorMsg.includes("decommissioned") || status === 400;

            if ((isRateLimit || isDecommissioned) && currentSharedIndex < models.length - 1) {
                currentSharedIndex++;
                saveSharedStatus({ index: currentSharedIndex });
                logger.warn(`🔄 [BACKUP GROQ] Mudando GLOBALMENTE para: ${models[currentSharedIndex]}`);
                i--; continue;
            }

            // Exauriu Groq -> Tenta Gemini (NOVO CÉREBRO RESERVA)
            if (isRateLimit && currentSharedIndex === models.length - 1) {
                const geminiResponse = await geminiRequest(options);
                if (geminiResponse) return geminiResponse;

                const novaResponse = await novaApiRequest(options);
                if (novaResponse) return novaResponse;
                
                // Exauriu SambaNova -> Tenta Hugging Face (Plano Z)
                if (process.env.HF_TOKEN) {
                    logger.warn(`🚨 [PLANO Z] Groq e Ciclone esgotados. Acionando Hugging Face (SDK Chat)...`);
                    try {
                        const response = await hf.chatCompletion({
                            model: 'Qwen/Qwen2.5-72B-Instruct', 
                            messages: options.messages,
                            max_tokens: 1200,
                            temperature: 0.7
                        });
                        
                        const content = response.choices[0].message.content;
                        if (content) return { choices: [{ message: { content: content.trim() } }] };
                    } catch (hfError) {
                        logger.error(`❌ Falha no Plano Z (Hugging Face SDK): ${hfError.message}`);
                    }
                }
            }
            
            if (isRateLimit && i < retries - 1) {
                const waitTime = delay * Math.pow(2, i);
                logger.warn(`⏳ Aguardando liberação de cota (Tentativa ${i+1}/${retries})...`);
                await new Promise(r => setTimeout(r, waitTime));
                continue;
            }
            
            logger.error(`❌ Erro Fatal no Fluxo de IA: ${errorMsg}`);
            throw error;
        }
    }
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
    geminiRequest,
    searchImages,
    generateImageViaAI
};
