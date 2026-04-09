const { runScout } = require("./scout");
const { runWriter } = require("./writer");
const { runVisualDirector } = require("./visual");
const { runCaptionAgent } = require("./caption_agent");
const { runFormattingAgent } = require("./formatting_agent");
const { runGateKeeper } = require("./gatekeeper");
const { runSchedulerAgent } = require("./scheduler_agent");
const { runAnalyst } = require("./analyst");
const { runCEO } = require("./ceo");
const { runAnalytics } = require("./analytics");
const { postToFacebook, postStoryToFacebook, addCommentToPost } = require("../facebook");
const { createViralCollage, createTextViralPost } = require("../image");
const { searchImages } = require("./utils");
const BrainModule = require("../modules/brain.module");
const logger = require("../logger");
const fs = require("fs");
const path = require("path");

/**
 * ORQUESTRADOR v11.0 - "O DONO DA PÁGINA"
 * Coordena os ciclos de postagem internacional, engajamento e monetização.
 */
class Orchestrator {
    constructor() {
        this.historyPath = path.join(__dirname, "../../data/history_v9.json");
        this.statsPath = path.join(__dirname, "../../data/stats.json");
        this.statusPath = path.join(__dirname, "../../data/agents_status.json");
        this.imageMemoryPath = path.join(__dirname, "../../data/image_memory.json");
    }

    updateAgentStatus(agentName, status, active = true) {
        try {
            let statuses = {};
            if (fs.existsSync(this.statusPath)) {
                statuses = JSON.parse(fs.readFileSync(this.statusPath, 'utf8'));
            }
            statuses[agentName] = { name: agentName, status, active, lastUpdate: new Date().toISOString() };
            fs.writeFileSync(this.statusPath, JSON.stringify(statuses, null, 2));
        } catch (e) {
            logger.error(`Erro ao atualizar status do agente ${agentName}: ${e.message}`);
        }
    }

    /**
     * Ciclo de Postagem Viral v11.0 (Mix de Conteúdo & Pivô Internacional)
     */
    async runViralCycle(isManual = false, preSelectedNews = null) {
        try {
            logger.important(`🚀 INICIANDO CICLO VIRAL ELITE v11.0 (Pivô Internacional)`);
            
            const brainData = BrainModule.getBrain();
            const brainContext = BrainModule.getInsightsForAI();
            
            // 1. Decidir Tipo de Postagem (Mix: 60% Foto, 20% Texto, 20% Story)
            // const dice = Math.random();
            let postType = 'photo';
            // if (dice > 0.8) postType = 'text';
            // else if (dice > 0.6) postType = 'story';

            logger.info(`🎲 Estratégia do Ciclo: ${postType.toUpperCase()}`);

            // 2. Scout - Encontrar pauta global ou avaliar pre-selecionada
            const scoutData = await runScout({ 
                titulo: preSelectedNews ? preSelectedNews.title : null,
                fonte: preSelectedNews ? preSelectedNews.source : "Global Discovery",
                shares: preSelectedNews ? preSelectedNews.shares : 0,
                categoria: preSelectedNews ? preSelectedNews.category : "Curiosidade",
                ultimo_tema: brainData.last_case,
                brain_context: brainContext 
            });

            // 3. Redação (Adaptada ao tipo de post)
            const pauta = await runWriter({
                tema: scoutData.tema,
                angulo_chocante: scoutData.angulo_chocante,
                nicho: scoutData.nicho,
                emocao_alvo: scoutData.emocao_alvo,
                fatos_coletados: scoutData.angulo_chocante,
                brain_context: brainContext,
                modo_curto: postType === 'text' || postType === 'story'
            });

            // 4. Visual - Direção de Arte e Geração (NOVO: Super Poder v6.2)
            const visualData = await runVisualDirector({
                tema: scoutData.tema,
                angulo_chocante: scoutData.angulo_chocante,
                emocao_alvo: scoutData.emocao_alvo,
                titulo_imagem: pauta.titulo_imagem,
                nicho: scoutData.nicho,
                gancho: pauta.gancho,
                resumo_historia: pauta.texto_principal // PASSA O CONTEXTO REAL DA HISTÓRIA
            });

            // 4.1 NOVO: Formatação e UX de Leitura (Emojis e Espaços)
            logger.info(`✨ [FORMATTER] Aplicando polimento visual e emojis ao texto...`);
            const formatação = await runFormattingAgent({
                texto_bruto: pauta.post_completo,
                nicho: scoutData.nicho
            });
            const textoFinal = formatação.legenda_formatada || pauta.post_completo;

            let imageBuffer;
            let postData = { id: 'preview' };

            // 5. MODO ARTE FINAL (Com IA e Caça Web Prioritária)
            if (postType === 'photo' || postType === 'story') {
                try {
                    logger.important(`📸 [GERAÇÃO VISUAL] Acionando Diretor de Arte Inteligente...`);
                    const ImageGenerator = require("../modules/image_generator.module");
                    
                    const visualResult = await ImageGenerator.generate(visualData.tema, visualData);

                    if (!visualResult) {
                        logger.error(`🚨 [FALHA TOTAL] Nenhuma imagem (Real ou IA) foi obtida. Usando Stock.`);
                        const stockBuffer = require("../modules/image.module").getStockBackground();
                        imageBuffer = await createViralCollage(stockBuffer, null, pauta.titulo_imagem, pauta.subtitulo_imagem);
                    } else if (visualResult.img1 && visualResult.img2) {
                        imageBuffer = await createViralCollage(
                            visualResult.img1, 
                            visualResult.img2, 
                            pauta.titulo_imagem, 
                            pauta.subtitulo_imagem,
                            { type: postType === 'story' ? 'story' : 'feed', documentaryMode: true }
                        );
                    } else {
                        imageBuffer = await createViralCollage(
                            visualResult.buffer || visualResult, 
                            null, 
                            pauta.titulo_imagem, 
                            pauta.subtitulo_imagem,
                            { type: postType === 'story' ? 'story' : 'feed', documentaryMode: true }
                        );
                    }

                    const tempPath = path.join(__dirname, `../../temp_post_${Date.now()}.jpg`);
                    fs.writeFileSync(tempPath, imageBuffer);

                    if (!isManual) {
                        if (postType === 'story') {
                            postData = await postStoryToFacebook(tempPath);
                        } else {
                            postData = await postToFacebook(textoFinal, tempPath);
                        }
                    }
                } catch (imgError) {
                    logger.error(`❌ [FALHA CRÍTICA] Erro na Arte Final: ${imgError.message}`);
                    throw imgError;
                }
            } else if (postType === 'text') {
                const queryImg = scoutData.tema;
                const images = await searchImages(queryImg, 1);
                
                imageBuffer = await createViralCollage(
                    images[0] ? images[0].buffer : null,
                    null,
                    pauta.titulo_imagem,
                    pauta.subtitulo_imagem,
                    { type: 'feed', documentaryMode: true }
                );

                const tempPath = path.join(__dirname, `../../temp_text_${Date.now()}.jpg`);
                fs.writeFileSync(tempPath, imageBuffer);

                if (!isManual) {
                    postData = await postToFacebook(textoFinal, tempPath); 
                }
            }

            logger.important(`✅ CICLO FINALIZADO: ${postType} publicado com ID ${postData.id}`);
            
            // 5. Monetização Automática (Somente se não for manual)
            if (!isManual && postData.id !== 'preview') {
                this.handleMonetization(postData.id, scoutData.nicho).catch(err => {
                    logger.error(`❌ Erro na automação de monetização: ${err.message}`);
                });
            }

            // Atualizar Brain
            BrainModule.updateBrain({
                last_case: scoutData.tema,
                last_post_type: postType
            });

            return { success: true, type: postType, texto_final: textoFinal };

        } catch (error) {
            logger.error(`❌ Falha no Ciclo v11.0: ${error.message}`);
            throw error;
        }
    }

    /**
     * Sistema de Monetização Automática v11.0
     */
    async handleMonetization(postId, niche) {
        try {
            const productsPath = path.join(__dirname, '../../data/products.json');
            if (!fs.existsSync(productsPath)) {
                logger.warn(`💸 Monetização ignorada: products.json não encontrado.`);
                return;
            }

            const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
            
            const matchedProducts = products.filter(p => p.niche.toLowerCase() === niche.toLowerCase());
            const product = matchedProducts.length > 0 
                ? matchedProducts[Math.floor(Math.random() * matchedProducts.length)]
                : products[0]; 

            if (!product || product.link === 'SEU_LINK_AQUI') {
                logger.info(`💸 Monetização ignorada: Link de afiliado não configurado.`);
                return;
            }

            logger.info(`⏳ Agendando link de monetização para daqui a 15 min no post ${postId}...`);
            
            setTimeout(async () => {
                const comment = `${product.cta}\n\n👉 Confira aqui: ${product.link}`;
                await addCommentToPost(postId, comment);
                logger.important(`💰 Link de Monetização publicado no post ${postId}!`);
            }, 900000);

        } catch (error) {
            logger.error(`❌ Erro no handleMonetization: ${error.message}`);
        }
    }

    /**
     * FASE 1 & 2: PRODUÇÃO (Legado v9 para compatibilidade)
     */
    async produceContent(newsItem) {
        logger.info(`🚀 [PRODUÇÃO] Iniciando ciclo estratégico para: ${newsItem.title}`);
        return this.runViralCycle(false, newsItem);
    }

    getLastPostedTheme() {
        const history = this.getHistory();
        return history.length > 0 ? history[history.length - 1].titulo : "Sem posts anteriores";
    }

    getLastCriticism(agentName) {
        const history = this.getHistory();
        const lastWithCritica = history.reverse().find(p => p.critica && p.critica[`ordens_${agentName}`]);
        return lastWithCritica ? lastWithCritica.critica[`ordens_${agentName}`] : "Mantenha o foco em alta retenção.";
    }

    async publishPhase(production, newsItem, stats) {
        logger.info(`[FASE 3: PUBLICAÇÃO] Consultando estrategista de horários...`);
        const scheduler = await runSchedulerAgent({
            posts_hoje: stats.posts_hoje || 0,
            ultimo_post_horario: stats.ultimo_post
        });
        if (!scheduler.pode_postar_agora) {
            return { status: "aguardando", minutos: scheduler.minutos_para_aguardar };
        }
        return { status: "pronto_para_postar", data: production };
    }

    async performAudit(postEntry) {
        logger.info(`📊 [FASE 4: APRENDIZADO] Auditando post: ${postEntry.id}`);
        const { getPostMetrics, getComments, replyToComment, likeComment } = require("../facebook");
        const { runEngagementAgent } = require("./engagement");
        const brainModule = require("../modules/brain.module");
        const metrics = await getPostMetrics(postEntry.id);
        logger.info(`💬 [INTERAÇÃO] Buscando comentários para engajamento...`);
        const comments = await getComments(postEntry.id);
        const filteredComments = comments.filter(c => c.message.split(' ').length > 2).slice(0, 5);
        for (const comment of filteredComments) {
            try {
                const action = await runEngagementAgent({
                    post_context: postEntry.texto,
                    comment_text: comment.message,
                    commenter_name: comment.from?.name || "Seguidor"
                });
                if (action.estrategia === "responder" && action.resposta_sugerida) {
                    logger.important(`🤖 Respondendo a ${comment.from?.name}: "${action.resposta_sugerida}"`);
                    await replyToComment(comment.id, action.resposta_sugerida);
                    if (action.curtir) await likeComment(comment.id);
                } else if (action.curtir) {
                    await likeComment(comment.id);
                }
            } catch (err) {
                logger.error(`Erro ao interagir com comentário: ${err.message}`);
            }
        }
        const critica = await runAnalyst({
            post_texto: postEntry.texto,
            likes: metrics.likes,
            comments: metrics.comments,
            shares: metrics.shares,
            reach: metrics.reach,
            engagement_rate: metrics.engagement_rate,
            hora_postagem: postEntry.hora
        });
        brainModule.recordPerformance({
            id: postEntry.id,
            tema: postEntry.titulo,
            metrics,
            insight: critica.o_que_matou_o_post
        });
        const history = this.getHistory();
        if (history.length % 5 === 0) {
            logger.info(`👑 [CEC] Emitindo novas ordens estratégicas...`);
            const analytics = await runAnalytics({
              followers: 21000, 
              new_followers: 150,
              reach_7d: 50000,
              posts_data: history.slice(-5)
            });
            await runCEO({
              criticas: critica,
              historico: history.slice(-7),
              metricas: analytics
            });
        }
        return { status: "auditado", score: metrics.engagement_rate };
    }

    getHistory() {
        if (!fs.existsSync(this.historyPath)) return [];
        return JSON.parse(fs.readFileSync(this.historyPath, 'utf8'));
    }

    savePerformance(id, metrics, critica) {
        let history = this.getHistory();
        const index = history.findIndex(p => p.id === id);
        if (index !== -1) {
            history[index].metrics = metrics;
            history[index].critica = critica;
            history[index].status_analise = "concluido";
            fs.writeFileSync(this.historyPath, JSON.stringify(history, null, 2));
        }
    }

    getImageMemory() {
        if (!fs.existsSync(this.imageMemoryPath)) {
            return { estilos_usados: [], prompts_usados: [], seeds_usados: [], total_imagens_geradas: 0, ultimo_grupo_usado: null };
        }
        return JSON.parse(fs.readFileSync(this.imageMemoryPath, 'utf8'));
    }

    updateImageMemory(resultado_visual) {
        try {
            const memory = this.getImageMemory();
            memory.estilos_usados.unshift(resultado_visual.estilo_escolhido);
            memory.total_imagens_geradas += 1;
            fs.writeFileSync(this.imageMemoryPath, JSON.stringify(memory, null, 2));
        } catch (e) {
            logger.error(`Erro ao atualizar memória visual: ${e.message}`);
        }
    }
}

module.exports = new Orchestrator();
