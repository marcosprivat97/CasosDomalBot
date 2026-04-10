const path = require('path');
const fs = require('fs');
const logger = require('../logger');
const BrainModule = require('../modules/brain.module');
const { runScout } = require('./scout');
const { runWriter } = require('./writer');
const { runVisualDirector } = require('./visual');
const { runFormattingAgent } = require('./formatting_agent');
const { postToFacebook, addCommentToPost } = require('../modules/facebook.module');
const { runSchedulerAgent } = require('./scheduler_agent');
const { createViralCollage } = require('../image');
const HistoryModule = require('../modules/history.module');

/**
 * ORQUESTRADOR v12.0 - "O MAESTRO ESTRATÉGICO"
 * Coordena o pipeline viral de ponta a ponta com resiliência de elite.
 */
class Orchestrator {
    constructor() {
        this.statusPath = path.join(__dirname, "../../data/agents_status.json");
    }

    /**
     * Ciclo Viral Maestro v12.0
     * Pipeline: Scout -> Writer -> Visual -> Format -> Publish
     */
    async runViralCycle(isManual = false, preSelectedNews = null, forcePilar = null) {
        try {
            logger.important(`🚀 [MASTER] Iniciando Ciclo Viral Elite v12.0`);
            
            // 1. Contexto e Preparação
            const brainContext = BrainModule.getInsightsForAI();
            const lastCase = BrainModule.getBrain().last_case;

            // 2. Estágio: SCOUT (Busca de Tendência)
            const recentTopics = HistoryModule.getRecentTopics(100);
            
            const scoutData = await this._safeAgentCall("Scout", () => runScout({
                titulo: preSelectedNews?.title || null,
                fonte: preSelectedNews?.source || "Global Discovery",
                categoria: forcePilar || preSelectedNews?.category || "Curiosidade",
                ultimo_tema: lastCase,
                recent_topics: recentTopics,
                brain_context: brainContext
            }), { mandatory: ["tema", "nicho", "angulo_chocante", "prompt_web", "prompt_ia"] });

            // Verificação Dupla de Segurança (Código)
            if (HistoryModule.isTopicRepeated(scoutData.tema)) {
                logger.warn(`🚨 [HISTORY] Tema '${scoutData.tema}' já postado. O AGENTE INSISTIU NA REPETIÇÃO.`);
            }

            // 3. Estágio: WRITER (Narrativa Magnética)
            const pauta = await this._safeAgentCall("Writer", () => runWriter({
                tema: scoutData.tema,
                angulo_chocante: scoutData.angulo_chocante,
                nicho: scoutData.nicho,
                fatos_coletados: scoutData.angulo_chocante,
                brain_context: brainContext
            }), { mandatory: ["texto_principal", "titulo_imagem"], minParagraphs: 6 });

            // 4. Estágio: VISUAL (Direção de Arte Smart)
            const visualData = await this._safeAgentCall("Visual", () => runVisualDirector({
                tema: scoutData.tema,
                angulo_chocante: scoutData.angulo_chocante,
                titulo_imagem: pauta.titulo_imagem,
                prompt_web: scoutData.prompt_web,
                prompt_ia: scoutData.prompt_ia,
                resumo_historia: pauta.texto_principal,
                historico_estilos: lastCase
            }), { mandatory: ["decisao_layout", "busca_foto_1", "prompt_flux"] });

            // 5. Estágio: FORMAT (Polimento de Texto)
            const formatação = await this._safeAgentCall("Formatter", () => runFormattingAgent({
                texto_bruto: pauta.texto_principal,
                nicho: scoutData.nicho
            }), { mandatory: ["legenda_formatada"] });
            const textoFinal = formatação.legenda_formatada || pauta.post_completo;

            // 6. Estágio: GENERATION & PUBLISH
            logger.info(`📸 [VISUAL] Gerando ativos visuais profissionais...`);
            const ImageGenerator = require("../modules/image_generator.module");
            const visualResult = await ImageGenerator.generate(visualData.tema, visualData);

            if (!visualResult && !isManual) {
                throw new Error("Falha crítica: Nenhuma imagem válida obtida.");
            }

            const imageBuffer = await this._createFinalCollage(visualResult, pauta);
            const tempPath = path.join(__dirname, `../../temp_post_${Date.now()}.jpg`);
            fs.writeFileSync(tempPath, imageBuffer);

            let postData = { id: 'preview' };
            if (!isManual) {
                logger.important(`📤 [PUBLISH] Enviando para o Facebook...`);
                postData = await postToFacebook(textoFinal, tempPath);
                
                // Pós-Publicação
                this.handleMonetization(postData.id, scoutData.nicho);
                BrainModule.updateBrain({ last_case: scoutData.tema });
                HistoryModule.recordTopic(scoutData.tema);
            }

            logger.important(`✅ [SUCESSO] Ciclo v12.0 finalizado com ID: ${postData.id}`);
            return { success: true, id: postData.id, tema: scoutData.tema };

        } catch (error) {
            logger.error(`❌ [ORCHESTRATOR ERROR] Falha no pipeline: ${error.message}`);
            throw error;
        }
    }

    /**
     * Wrapper de Segurança para Agentes (Retry + Validação)
     */
    async _safeAgentCall(agentName, agentFunc, validationRules = null, retries = 2) {
        for (let i = 0; i <= retries; i++) {
            try {
                this.updateAgentStatus(agentName, "Executando");
                const result = await agentFunc();
                
                // Validação de Integridade (NADA PODE VIR VAZIO)
                if (validationRules) {
                    this._validateResult(agentName, result, validationRules);
                }

                this.updateAgentStatus(agentName, "Ocioso");
                return result;
            } catch (e) {
                if (i === retries) throw e;
                logger.warn(`🔄 [RETRY] ${agentName}: ${e.message}. Tentativa ${i+1}/${retries}...`);
                await new Promise(r => setTimeout(r, 2000));
            }
        }
    }

    /**
     * Validador de Qualidade v12.1 (Deep Narrative Edition)
     */
    _validateResult(agentName, result, rules) {
        if (!result || typeof result !== 'object') throw new Error("Resultado não é um objeto válido");

        for (const field of rules.mandatory) {
            if (!result[field] || String(result[field]).trim() === "") {
                throw new Error(`Campo mandatório '${field}' está vazio ou ausente`);
            }
        }

        if (agentName === "Writer") {
            const text = result.texto_principal;
            const words = text.split(/\s+/).length;
            const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 10);

            // 1. Validação de Extensão (Mínimo 150 palavras)
            if (words < 150) {
                throw new Error(`Texto muito curto (${words} palavras). Mínimo exigido: 150`);
            }

            // 2. Validação de Estrutura (Mínimo 4 parágrafos)
            if (paragraphs.length < 4) {
                throw new Error(`Estrutura incompleta (${paragraphs.length} parágrafos). Mínimo exigido: 4`);
            }

            // 3. Detecção de "Encheção de Linguiça" (Fillers)
            const fillers = ["estou sem palavras", "mundo está louco", "isso é bizarro", "eu não imaginava", "brasileiro não tem limites"];
            const fillerHits = fillers.filter(f => text.toLowerCase().includes(f));
            if (fillerHits.length > 3) {
                throw new Error(`Detectado excesso de frases genéricas (${fillerHits.length}). Foque nos fatos!`);
            }
        }

        logger.info(`✅ [VALIDATION] ${agentName}: Integridade e Densidade confirmadas.`);
    }

    async _createFinalCollage(visualResult, pauta) {
        if (!visualResult) {
            const stockBuffer = require("../modules/image.module").getStockBackground();
            return await createViralCollage(stockBuffer, null, pauta.titulo_imagem, pauta.subtitulo_imagem);
        }
        
        return await createViralCollage(
            visualResult.img1 || visualResult.buffer || visualResult,
            visualResult.img2 || null,
            pauta.titulo_imagem,
            pauta.subtitulo_imagem,
            { documentaryMode: true }
        );
    }

    /**
     * handleMonetization - Comentário Estratégico (v12.2 - Bulletproof)
     */
    async handleMonetization(postId, niche) {
        const productsPath = path.join(__dirname, '../../data/products.json');
        if (!fs.existsSync(productsPath)) return;

        setTimeout(async () => {
            try {
                const productsContent = fs.readFileSync(productsPath, 'utf8');
                const products = JSON.parse(productsContent);

                if (!Array.isArray(products)) {
                    logger.error(`❌ handleMonetization: products.json não é um array.`);
                    return;
                }

                const safeNiche = String(niche || "Geral").toLowerCase();
                
                // Busca segura que ignora itens nulos ou malformados
                const product = products.find(p => 
                    p && 
                    p.niche && 
                    String(p.niche).toLowerCase() === safeNiche
                ) || products[0];

                if (product && product.link && product.link !== 'SEU_LINK_AQUI') {
                    const comment = `${product.cta}\n\n👉 Confira aqui: ${product.link}`;
                    await addCommentToPost(postId, comment);
                    logger.important(`💰 Monetização ativa no post ${postId}`);
                }
            } catch (e) {
                logger.error(`❌ Erro crítico no handleMonetization: ${e.message}`);
            }
        }, 900000); // 15 minutos
    }

    // --- Helpers de Compatibilidade ---
    updateAgentStatus(agentName, status, active = true) {
        try {
            let statuses = fs.existsSync(this.statusPath) ? JSON.parse(fs.readFileSync(this.statusPath, 'utf8')) : {};
            statuses[agentName] = { name: agentName, status, lastUpdate: new Date().toISOString() };
            fs.writeFileSync(this.statusPath, JSON.stringify(statuses, null, 2));
        } catch (e) {}
    }

    async produceContent(newsItem) { return this.runViralCycle(false, newsItem); }

    async publishPhase(production, newsItem, stats) {
        const scheduler = await runSchedulerAgent({
            posts_hoje: stats.posts_hoje || 0,
            ultimo_post_horario: stats.ultimo_post
        });
        if (!scheduler.pode_postar_agora) return { status: "aguardando", minutos: scheduler.minutos_para_aguardar };
        return { status: "pronto_para_postar", data: production };
    }
}

module.exports = new Orchestrator();
