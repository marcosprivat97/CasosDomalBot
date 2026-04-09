require('dotenv').config();
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const { generateStory } = require('./story');
const { createViralCollage } = require('./image');
const { postToFacebook } = require('./facebook');
const { getTrendingTopic } = require('./trend');
const videoModule = require('./modules/video.module');
const imageModule = require('./modules/image.module');
const historyModule = require('./modules/history.module');
const trendsModule = require('./trend');
const orchestrator = require('./agents/orchestrator');
const axios = require('axios');

const CONFIG_PATH = path.join(__dirname, '..', 'data', 'config.json');
const TEMP_IMG_PATH = path.join(__dirname, '..', 'temp_viral_post.jpg');
const TEMP_VIDEO_INPUT = path.join(__dirname, '..', 'temp_raw_video.mp4');
const TEMP_VIDEO_OUTPUT = path.join(__dirname, '..', 'temp_elite_video.mp4');

// Locks contra Condições de Corrida (v12.0)
let isProcessingViral = false;
let isProcessingAudit = false;

/**
 * Utilitário para Escrita Atômica de JSON (v12.0)
 */
function atomicWriteJson(filePath, data) {
    try {
        const tempPath = `${filePath}.tmp`;
        fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
        fs.renameSync(tempPath, filePath);
    } catch (e) {
        logger.error(`❌ Falha na escrita atómica em ${path.basename(filePath)}: ${e.message}`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }
}

function getConfig() {
    if (!fs.existsSync(path.dirname(CONFIG_PATH))) {
        fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    }
    if (!fs.existsSync(CONFIG_PATH)) {
        const defaultConfig = {
            isActive: true,
            postsPerDay: 5,
            growthMode: true,
            pivôInternacional: true,
            lastRun: null,
            nextRun: null
        };
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
        return defaultConfig;
    }
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

/**
 * HELPER FUNCTIONS (ESTATÍSTICAS)
 */
function _updateStats(title) {
    try {
        const statsPath = path.join(__dirname, '..', 'data', 'stats.json');
        let stats = fs.existsSync(statsPath) ? JSON.parse(fs.readFileSync(statsPath, 'utf8')) : {
            totalPosts: 0,
            totalImagesGenerated: 0,
            totalStoriesGenerated: 0,
            startTime: new Date().toISOString()
        };

        stats.totalPosts = (stats.totalPosts || 0) + 1;
        stats.totalImagesGenerated = (stats.totalImagesGenerated || 0) + 1;
        stats.totalStoriesGenerated = (stats.totalStoriesGenerated || 0) + 1;
        stats.lastCase = title;

        atomicWriteJson(statsPath, stats);
    } catch (e) {
        logger.error('Erro ao atualizar stats:', e.message);
    }
}

function _updateConfigRun() {
    try {
        let config = getConfig();
        config.lastRun = new Date().toISOString();
        atomicWriteJson(CONFIG_PATH, config);
    } catch (e) {
        logger.error('Erro ao atualizar config run:', e.message);
    }
}

/**
 * Ciclo Viral de Elite v9.0 - ECOSSISTEMA AUTÔNOMO
 */
async function runViralCycle() {
    if (isProcessingViral) {
        logger.warn('⚠️ [CONFLIT] Ciclo Viral já está em andamento. Pulando execução para evitar duplicidade.');
        return;
    }

    try {
        isProcessingViral = true;
        const config = getConfig();
        if (!config.isActive) return;

        logger.info('🚀 [v9.0] INICIANDO PULSO DE PRODUÇÃO ---');

        logger.info('🚀 [v9.0] INICIANDO PULSO DE PRODUÇÃO ---');

        // 1. Capturar Lista de RSS
        const newsList = await trendsModule.getLatestNews();
        
        let postedAny = false;

        if (newsList && newsList.length > 0) {
            // 2. Estatísticas Atuais
            const statsPath = path.join(__dirname, '..', 'data', 'stats.json');
            const stats = fs.existsSync(statsPath) ? JSON.parse(fs.readFileSync(statsPath, 'utf8')) : {};

            // 3. Loop de Pipeline
            for (const news of newsList) {
                if (historyModule.isPosted(news.link) || historyModule.isTitlePosted(news.title)) continue;

                const production = await orchestrator.produceContent(news);
                if (production.status === "descartado") continue;

                const publication = await orchestrator.publishPhase(production, news, {
                    posts_hoje: stats.totalPostsToday || 0,
                    ultimo_post: config.lastRun
                });

                if (publication.status === "aguardando") {
                    logger.warn(`⏳ Aguardando momento ideal (${publication.minutos}m)`);
                    return;
                }

                if (publication.status === "pronto_para_postar") {
                    const { writer, visual } = production;
                    
                    logger.info(`🔍 [FASE 1] Buscando mídia para: ${news.title}`);
                    let mediaBuffer = await imageModule.extractRealImageFromNews({
                        ...news,
                        ...visual
                    });
                    
                    if (!mediaBuffer) {
                        logger.error(`❌ [ABORT] Post descartado por falta de imagem contextual para: ${news.title}`);
                        continue;
                    }

                    // 4. Fluxo de Decisão: Automático vs Manual
                    if (config.autoApprove && production.gate.decisao === "POSTAR" && production.gate.score_final >= 55) {
                        logger.important(`⚡ [AUTO-APPROVE] Decisão Crítica: POSTAR (Score: ${production.gate.score_final})`);
                        
                        try {
                            const img1 = Array.isArray(mediaBuffer) ? mediaBuffer[0] : mediaBuffer;
                            const img2 = Array.isArray(mediaBuffer) ? mediaBuffer[1] : null;

                            const finalBuffer = await createViralCollage(img1, img2, writer.titulo_imagem, writer.subtitulo_imagem);
                            const tempPath = path.join(__dirname, '..', `temp_auto_${Date.now()}.jpg`);
                            fs.writeFileSync(tempPath, finalBuffer);

                            logger.info(`🚀 [AUTO-POST] Publicando no Facebook: "${writer.titulo_imagem}"...`);
                            const fbResponse = await postToFacebook(writer.post_completo, tempPath);
                            
                            if (fbResponse && fbResponse.id) {
                                logger.info(`✅ [AUTO-POST] SUCESSO! ID: ${fbResponse.id}`);
                                _updateStats(news.title);
                                _updateConfigRun();
                                _saveToHistory(fbResponse.id, news.title, news.link, writer.post_completo);
                                postedAny = true;
                                
                                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                                // Finaliza o ciclo após postagem bem sucedida
                                return true;
                            }
                        } catch (e) {
                            logger.error(`❌ Falha na postagem automática: ${e.message}`);
                        }
                    } else {
                        // SALVAR PARA APROVAÇÃO DA FOTO BRUTA (MODO MANUAL OU REESCRITA)
                        const approvalModule = require('./modules/approval.module');
                        const approvalId = await approvalModule.createPendingRaw(news, mediaBuffer, visual.palavra_chave_busca);
                        
                        logger.important(`🛑 [AGUARDANDO APROVAÇÃO] Foto bruta salva para análise manual.`);
                        logger.info(`📸 Confira a imagem em: data/${approvalId}_raw.jpg`);
                        logger.info(`👉 Para publicar, digite: node approve.js ok`);
                        
                        // Para o ciclo aqui até o usuário aprovar via script externo
                        return;
                    }
                }
            }
        }

        // 4. FALLBACK: Se não postou nada (sem notícias ou todas descartadas), gera Casos Domal Evergreen
        if (!postedAny) {
            logger.info('🔄 [FALLBACK] Nenhuma notícia quente. Gerando post Evergreen de Curiosidades/Mistérios...');
            const evergreenItem = {
                title: "Mistério ou Curiosidade Absurda",
                link: `evergreen_${Date.now()}`,
                description: "Gere um caso de mistério real, curiosidade bizarra, fato desconhecido histórico ou descoberta científica chocante (Estilo Fatos Desconhecidos).",
                category: "Evergreen"
            };
            
            const production = await orchestrator.produceContent(evergreenItem);
            if (production.status !== "descartado") {
                const { writer, visual } = production;
                // Para evergreen, usamos busca no Google Images baseada na palavra-chave do visual
                const imageModule = require('./modules/image.module');
                let mediaBuffer = await imageModule.extractRealImageFromNews({
                    title: writer.titulo_imagem,
                    searchKeyword: visual.palavra_chave_busca
                });

                if (mediaBuffer) {
                    if (config.autoApprove && production.gate.decisao === "POSTAR" && production.gate.score_final >= 55) {
                        logger.important(`⚡ [AUTO-APPROVE] Evergreen: POSTAR (Score: ${production.gate.score_final})`);
                        
                        try {
                            const img1 = Array.isArray(mediaBuffer) ? mediaBuffer[0] : mediaBuffer;
                            const img2 = Array.isArray(mediaBuffer) ? mediaBuffer[1] : null;

                            const finalBuffer = await createViralCollage(img1, img2, writer.titulo_imagem, writer.subtitulo_imagem);
                            const tempPath = path.join(__dirname, '..', `temp_auto_evergreen_${Date.now()}.jpg`);
                            fs.writeFileSync(tempPath, finalBuffer);

                            logger.info(`🚀 [AUTO-POST] Publicando História Evergreen: "${writer.titulo_imagem}"...`);
                            const fbResponse = await postToFacebook(writer.post_completo, tempPath);
                            
                            if (fbResponse && fbResponse.id) {
                                logger.info(`✅ [AUTO-POST] SUCESSO! ID: ${fbResponse.id}`);
                                _updateStats(evergreenItem.title);
                                _updateConfigRun();
                                _saveToHistory(fbResponse.id, evergreenItem.title, evergreenItem.link, writer.post_completo);
                                postedAny = true;
                                
                                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                                return true;
                            }
                        } catch (e) {
                            logger.error(`❌ Falha no Auto-Post Evergreen: ${e.message}`);
                        }
                    } else {
                        const approvalModule = require('./modules/approval.module');
                        const approvalId = await approvalModule.createPendingRaw(evergreenItem, mediaBuffer, visual.palavra_chave_busca);
                        
                        logger.important(`🛑 [AGUARDANDO APROVAÇÃO] História Evergreen salva!`);
                        logger.info(`📸 Confira em: data/${approvalId}_raw.jpg`);
                        logger.info(`👉 Para gerar a arte sênior, digite: node approve.js ok`);
                    }
                }
            }
        }
    } finally {
        isProcessingViral = false;
    }
}

function _saveToHistory(id, title, link, texto) {
    historyModule.add({
        id,
        titulo: title,
        link,
        texto
    });
}

/**
 * Pulso de Auditoria: Roda a cada 5 minutos procurando posts de 30 minutos atrás
 */
async function runAuditPulse() {
    if (isProcessingAudit) return;

    try {
        isProcessingAudit = true;
        const historyV9Path = path.join(__dirname, '..', 'data', 'history_v9.json');
        if (!fs.existsSync(historyV9Path)) return;

        let historyV9 = JSON.parse(fs.readFileSync(historyV9Path, 'utf8'));
        const now = new Date();

        for (const entry of historyV9) {
            if (entry.status_analise === "pendente") {
                const postTime = new Date(entry.timestamp);
                const diffMin = (now - postTime) / 60000;

                if (diffMin >= 30) { // 30 minutos após postar
                    logger.info(`🔍 [AUDITORIA] Analisando performance do post ${entry.id}...`);
                    await orchestrator.performAudit(entry);
                }
            }
        }
    } finally {
        isProcessingAudit = false;
    }
}

function validateEnvironment() {
    const required = ['GROQ_API_KEY', 'FB_PAGE_ID', 'FB_ACCESS_TOKEN'];
    const missing = required.filter(k => !process.env[k]);
    
    if (missing.length > 0) {
        logger.error(`🚨 [ERRO CRÍTICO] Variáveis de ambiente faltando: ${missing.join(', ')}`);
        logger.error('Certifique-se de configurar o arquivo .env corretamente.');
        process.exit(1);
    }
    logger.info('✅ Ambiente validado com sucesso.');
}

function startScheduler() {
    validateEnvironment();
    logger.info('🚀 ECOSSISTEMA v9.0 ATIVO: Vigilância e Aprendizado constantes.');
    
    // 1. Ciclo de Aprendizado e Pesquisa (1 vez por dia - Meia noite)
    cron.schedule('0 0 * * *', async () => {
        const { startLearningCycle } = require('./learning_cycle');
        await startLearningCycle();
    });

    // 2. Intervalo de Produção (checa novos temas a cada 15 min)
    cron.schedule('*/15 * * * *', async () => {
        await runViralCycle();
    });

    // 3. Intervalo de Auditoria e Engajamento (checa performance e interage com público a cada 5 min)
    cron.schedule('*/5 * * * *', async () => {
        await runAuditPulse();
    });
}

if (require.main === module) {
    // 1. Validação de Ambiente (Obrigatório Primeiro)
    validateEnvironment();

    // 2. Roda Ciclo de Aprendizado em Background
    const { startLearningCycle } = require('./learning_cycle');
    startLearningCycle();
    
    // 3. Inicia o Coração do Sistema
    startScheduler();
}

module.exports = { startScheduler, runViralCycle, getConfig, runAuditPulse };
