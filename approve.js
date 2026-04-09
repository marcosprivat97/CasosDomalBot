const fs = require('fs');
const path = require('path');
const logger = require('./src/logger');
const approvalModule = require('./src/modules/approval.module');
const { createViralCollage } = require('./src/image');
const { postToFacebook } = require('./src/facebook');
const orchestrator = require('./src/agents/orchestrator');

async function approve() {
    const args = process.argv.slice(2);
    const command = args[0] ? args[0].toLowerCase() : null;

    const pending = approvalModule.getPending();

    if (!pending) {
        logger.info('📭 Não há nada pendente para aprovação no momento.');
        return;
    }

    if (command === 'ok') {
        if (pending.status === 'WAITING_RAW_APPROVAL') {
            logger.info('⚙️ Foto bruta aprovada! Gerando arte final com design sênior...');
            
            // 1. Chamar o redator para criar o texto final (caso ainda não tenha)
            const production = await orchestrator.produceContent(pending.news);
            const { writer } = production;

            // 2. Aplicar o Design
            const rawBuffer = fs.readFileSync(pending.raw_path);
            const finalBuffer = await createViralCollage(rawBuffer, null, writer.titulo_imagem, writer.subtitulo_imagem);
            
            // 3. Atualizar estado
            await approvalModule.updateToFinal(pending.id, finalBuffer, writer);
            
            logger.important('✅ Arte Final Gerada com Sucesso!');
            logger.info(`📸 Confira o resultado em: data/${pending.id}_final.jpg`);
            logger.info(`🚀 Se estiver perfeito, digite: node approve.js ok (para publicar agora)`);
            logger.info(`❌ Se não gostou, digite: node approve.js redo (para buscar outra foto no Google)`);
        } 
        else if (pending.status === 'WAITING_FINAL_APPROVAL') {
            logger.info('🚀 Publicando no Facebook...');
            
            const tempPath = path.join(__dirname, 'temp_approval_post.jpg');
            fs.writeFileSync(tempPath, fs.readFileSync(pending.final_path));

            try {
                const fbResponse = await postToFacebook(pending.production_text.post_completo, tempPath);
                
                // Logado com sucesso
                logger.info(`✅ POST PUBLICADO COM SUCESSO: ${fbResponse.id}`);
                
                approvalModule.resolveApproval(pending.id, 'POSTED');
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            } catch (e) {
                logger.error(`❌ Erro na postagem: ${e.message}`);
            }
        }
    } 
    else if (command === 'redo') {
        logger.warn('🔄 Descartando imagem e tentando busca alternativa no Google...');
        // Remove do pendente para o scheduler caçar outro na próxima volta
        approvalModule.resolveApproval(pending.id, 'REJECTED');
        logger.info('Pronto. O robô vai buscar uma nova opção em instantes.');
    }
    else {
        console.log(`
        --- PAINEL DE CONTROLE CASOS DOMAL ---
        Status Atual: ${pending.status}
        Notícia: ${pending.news.title}
        
        Comandos:
        node approve.js ok     -> Aprovar etapa atual
        node approve.js redo   -> Rejeitar e tentar outra foto
        `);
    }
}

approve();
