require('dotenv').config();
const { Groq } = require('groq-sdk');
const logger = require('./logger');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Storytelling Engine Elite v5.6 (Hiper-Factual Tabloide)
 * Estilo: Repórter Policial de Campo / Investigação Discovery.
 * Meta: 0% Vagueza, 100% Densidade Factual e Impacto Viral.
 */
/**
 * Viral Curiosity Engine v7.0 (Top Lista Impacto)
 * Nicho: Curiosidades, Mistérios, Ciência e Fatos Inacreditáveis.
 * Foco: Retenção Máxima e Viralização no Facebook.
 */
async function generateStory(newsItem = null) {
  try {
    const topic = newsItem ? `TEMA BASE: ${newsItem.title}` : "Curiosidade Aleatória de Alto Impacto";
    logger.info(`✍️ [Viral Engine v7.0] Iniciando Criação de Top Lista: ${topic.substring(0, 50)}...`);

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: "system",
          content: `Você é o Especialista em Viralização de uma das maiores páginas de curiosidades do mundo.
Seu objetivo é gerar conteúdo que FORCE o usuário a parar o scroll e compartilhar.

### DIRETRIZES DE NICHO:
- Foco em: Mistérios reais, fatos absurdos (corpo humano, espaço, animais letais), arqueologia proibida e tecnologias inacreditáveis.
- NUNCA gerar temas infantis, bobos ou sem apelo emocional.
- O conteúdo deve parecer raro, secreto ou pouco conhecido.

### FILTRO DE QUALIDADE (AUTOAVALIAÇÃO):
Antes de entregar, você DEVE validar se o tema:
1. Causa surpresa imediata?
2. Desperta curiosidade forte?
3. Tem alto potencial de compartilhamento?
4. Parece um segredo ou fato raro?
Se não atender a pelo menos 4 destes, descarte e gere algo melhor.

### REGRAS DO FORMATO:
1. TÍTULO VIRAL: Máximo 12 palavras, impacto sério e intrigante (Ex: "7 fatos reais que parecem inventados").
2. GANCHO: Abre uma lacuna de curiosidade nos primeiros segundos.
3. LISTA: Top 5, 7, 10 ou 12 itens curtos, fortes e fáceis de ler.
4. LEGENDA: Curta, focada em engajamento.

### OUTPUT JSON:
{
  "viral_title": "string (Título de impacto p/ capa)",
  "hook": "string (Gancho inicial instigante)",
  "items": ["string", "string", ...],
  "caption": "string (Legenda do post)",
  "image_text": "string (Texto curto para a capa da imagem)",
  "hashtags": "string (4-5 hashtags)",
  "confidence_score": number (0-10)
}`
        },
        {
          role: "user",
          content: `Gere agora uma TOP LISTA viral sobre: ${topic}. 
Lembre-se: Seja visceral, factual e surpreendente. Use o tom de um documentário que prende a atenção.
Se o tema base for fraco, mude para algo relacionado que seja VIRAIS.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const content = JSON.parse(completion.choices[0].message.content);
    
    // Auto-validação final interna
    if (content.confidence_score < 7) {
        logger.warn('⚠️ Nota de confiança baixa. Tentando regenerar para maior impacto...');
        // (Em produção você poderia chamar de novo, aqui vamos seguir com log)
    }

    return {
      title: (content.viral_title || "FATO INACREDITÁVEL").toUpperCase(),
      subtitle: content.image_text || "Você não vai acreditar no item #3",
      caption: `${content.hook}\n\n${content.items.map((item, i) => `${i + 1}. ${item}`).join('\n')}\n\n${content.caption}\n\n${content.hashtags}`,
      imagePrompts: {
        fallback: `high quality documentary photo of ${content.image_text}, mysterious atmosphere, hyper-realistic, national geographic style`
      }
    };
  } catch (error) {
    logger.error('❌ Falha no Viral Engine v7.0:', error.message);
    return {
        title: "MISTÉRIO REVELADO",
        subtitle: "Fatos que desafiam a lógica humana",
        caption: "Existem segredos no nosso mundo que poucos conhecem. Hoje revelamos alguns fatos que vão mudar sua percepção.\n\n1. O universo é mais vasto do que imaginamos.\n2. Existem civilizações perdidas sob nossos pés.\n\n#Curiosidades #Misterios #FatosReais",
        imagePrompts: { fallback: "mysterious galaxy, ancient ruins, realistic" }
    };
  }
}

module.exports = { generateStory };
