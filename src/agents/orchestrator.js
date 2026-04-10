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
            const scoutData = await this._safeAgentCall("Scout", () => runScout({
                titulo: preSelectedNews?.title || null,
                fonte: preSelectedNews?.source || "Global Discovery",
                categoria: forcePilar || preSelectedNews?.category || "Curiosidade",
                ultimo_tema: lastCase,
                brain_context: brainContext
            }));

            // 3. Estágio: WRITER (Narrativa Magnética)
            const pauta = await this._safeAgentCall("Writer", () => runWriter({
                tema: scoutData.tema,
                angulo_chocante: scoutData.angulo_chocante,
                nicho: scoutData.nicho,
                fatos_coletados: scoutData.angulo_chocante,
                brain_context: brainContext
            }));

            // 4. Estágio: VISUAL (Direção de Arte)
            const visualData = await this._safeAgentCall("Visual", () => runVisualDirector({
                tema: scoutData.tema,
                angulo_chocante: scoutData.angulo_chocante,
                titulo_imagem: pauta.titulo_imagem,
                nicho: scoutData.nicho,
                gancho: pauta.gancho,
                resumo_historia: pauta.texto_principal
            }));

            // 5. Estágio: FORMAT (Polimento de Texto)
            const formatação = await this._safeAgentCall("Formatter", () => runFormattingAgent({
                texto_bruto: pauta.post_completo || pauta.texto_principal,
                nicho: scoutData.nicho
            }));
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
            }

            logger.important(`✅ [SUCESSO] Ciclo v12.0 finalizado com ID: ${postData.id}`);
            return { success: true, id: postData.id, tema: scoutData.tema };

        } catch (error) {
            logger.error(`❌ [ORCHESTRATOR ERROR] Falha no pipeline: ${error.message}`);
            throw error;
        }
    }

    /**
     * Wrapper de Segurança para Agentes (Retry Logic)
     */
    async _safeAgentCall(agentName, agentFunc, retries = 2) {
        for (let i = 0; i <= retries; i++) {
            try {
                this.updateAgentStatus(agentName, "Executando");
                const result = await agentFunc();
                this.updateAgentStatus(agentName, "Ocioso");
                return result;
            } catch (e) {
                if (i === retries) throw e;
                logger.warn(`🔄 [RETRY] Falha no agente ${agentName}. Tentativa ${i+1}/${retries}...`);
                await new Promise(r => setTimeout(r, 2000));
            }
        }
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
     * handleMonetization - Comentário Estratégico
     */
    async handleMonetization(postId, niche) {
        const productsPath = path.join(__dirname, '../../data/products.json');
        if (!fs.existsSync(productsPath)) return;

        setTimeout(async () => {
            try {
                const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
                const product = products.find(p => p.niche.toLowerCase() === niche.toLowerCase()) || products[0];
                if (product && product.link !== 'SEU_LINK_AQUI') {
                    const comment = `${product.cta}\n\n👉 Confira aqui: ${product.link}`;
                    await addCommentToPost(postId, comment);
                    logger.important(`💰 Monetização ativa no post ${postId}`);
                }
            } catch (e) {
                logger.error(`Erro na monetização: ${e.message}`);
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
