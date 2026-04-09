const { createViralCollage } = require("./src/image");
const { postToFacebook } = require("./src/facebook");
const imageModule = require("./src/modules/image.module");
const logger = require("./src/logger");
const fs = require('fs');
const path = require('path');

async function runImpeccablePost() {
    try {
        logger.info('🏆 [GRAND FINALE] Iniciando Postagem de Elite: O Bot Impecável');

        // 1. DADOS DA NOTÍCIA (Alinhamento Total + Narrativa Magnética)
        const news = {
            title: "CORINTHIANS: A virada de chave ou o início do desespero?",
            link: "https://www.gazetaesportiva.com/times/corinthians/dupla-inicia-transicao-fisica-e-se-aproxima-de-retorno-no-corinthians/",
            personagem_principal: "Corinthians"
        };

        const caption = `**CORINTHIANS:** O alívio que a Fiel esperava ou apenas uma cortina de fumaça para a crise? ⚽🔥

A notícia que acaba de explodir nos corredores do CT Joaquim Grava traz um misto de esperança e angústia para quem respira o Timão 24 horas por dia. A transição física de peças-chave do elenco não é apenas um relatório médico, é o sopro de vida em um time que parece caminhar no fio da navalha. Mas será que o retorno desses jogadores é a solução mágica que todos pregam? 💣

Nos bastidores, o clima é de uma tensão que se pode cortar com faca. O peso da camisa do Corinthians nunca foi tão grande para quem está subindo do departamento médico para o gramado. A verdade nua e crua é que não há mais espaço para erros amadores. O torcedor, que já viu glórias imensuráveis, hoje assiste a um drama que parece não ter fim, e a volta de nomes importantes é o último cartucho antes do caos total. 🏟️🔴

Imagine entrar no caldeirão da Neo Química Arena sabendo que cada passe, cada dividida e cada gota de suor será pesada em uma balança de cobrança extrema. Esses jogadores não estão voltando apenas para jogar futebol; eles estão sendo convocados para uma guerra de sobrevivência. Onde está o brio? Onde está a garra que um dia fez o mundo se curvar ao bando de loucos? A transição física é o de menos; o que o Corinthians precisa é de uma transição de alma. 🥅👀

Não se enganem: o problema do Timão vai muito além de quem entra em campo. É político, é estrutural, é visceral. Mas para quem está na arquibancada, o que importa é o gol, o suor e a vitória. Ver o maior clube do povo lutar contra as próprias sombras é um vexame que a história não vai esquecer. O retorno iminente é a luz no fim do túnel ou apenas o trem da realidade vindo na direção contrária para um impacto histórico? 🏆🚨

A paciência da Fiel esgotou e o crédito para desculpas esfarrapadas está no vermelho. O Corinthians não pode ser tratado como um laboratório de testes; ele é um patrimônio sagrado que exige respeito e resultados imediatos. Chegou a hora da verdade: ou esses jogadores assumem a responsabilidade de carregar o peso do escudo, ou o despenadeiro será o único destino final. 💥⚪

Até quando vamos aceitar que o gigante seja humilhado por falta de planejamento e garra? Você acredita que esses reforços caseiros vão salvar o ano, ou o buraco é muito mais embaixo do que a diretoria quer admitir? O debate está incendiado e o seu comentário é o combustível para essa resenha. O Corinthians é gigante demais para ser pequeno! 👇💬

#Corinthians #Timao #Fiel #FutebolBrasileiro #SerieA #Polemica #Craque #CasosDomal`;

        const subtitle = "A ESPERANÇA NO FIO DA NAVALHA";
        const titleArt = "CORINTHIANS: O RETORNO!";

        // 2. EXTRAÇÃO DE FOTO REAL (Com o novo motor impecável)
        logger.info(`📸 Buscando foto real e de alta qualidade para: ${news.personagem_principal}`);
        const mediaBuffer = await imageModule.extractRealImageFromNews(news);
        
        if (!mediaBuffer) {
            throw new Error("Não foi possível encontrar uma imagem real de alta qualidade.");
        }

        // 3. COMPOSIÇÃO DE ARTE (Layout Centralizado Casos Domal)
        logger.info('🎨 Aplicando Identidade Visual Casos Domal (Elite v9.7)...');
        const finalBuffer = await createViralCollage(mediaBuffer, null, titleArt, subtitle);
        
        const tempPath = path.join(__dirname, 'temp_impeccable.jpg');
        fs.writeFileSync(tempPath, finalBuffer);

        // 4. PUBLICAÇÃO FINAL
        logger.info('🚀 Disparando Postagem Impecável para o Facebook...');
        const postResult = await postToFacebook(tempPath, caption);

        if (postResult && postResult.id) {
            logger.info(`✅ [SUCESSO TOTAL] Post Impecável publicado! ID: ${postResult.id}`);
            fs.unlinkSync(tempPath);
        } else {
            throw new Error("Falha ao receber ID de postagem do Facebook.");
        }

    } catch (error) {
        logger.error(`❌ Falha no Grand Finale: ${error.message}`);
    }
}

runImpeccablePost();
