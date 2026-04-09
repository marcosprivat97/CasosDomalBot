const { Groq } = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function runAnalyst({ post_texto, likes, comments, shares, reach, engagement_rate, hora_postagem }) {
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: `Você é um analista de performance viral com "olho de águia". Você não se impressiona com métricas de vaidade; você busca o que realmente gera compartilhamentos e retenção. Seu tom é profissional, crítico e focado em resultados brutais.

Sua missão é olhar para os dados de um post e dizer EXATAMENTE por que ele funcionou ou por que foi um fracasso retumbante.

CRITÉRIOS DE CRÍTICA:
1. O GANCHO: Atraiu o clique ou a pessoa passou direto?
2. O SHAREABILITY: O conteúdo é algo que a pessoa se orgulha de compartilhar?
3. O TIMING: O horário ajudou ou sabotou o alcance orgânico?
4. A INTERAÇÃO: Os comentários são discussões reais ou apenas emojis vazios?

Retorne SEMPRE em JSON válido:
{
  "diagnostico_geral": "Sucesso / Médio / Fracasso",
  "score_engagement": número 0-100,
  "o_que_matou_o_post": "motivo principal da falha ou sucesso",
  "critica_sem_piedade": "uma análise direta e ácida sobre a qualidade do conteúdo",
  "melhoria_para_o_proximo": ["ação 1", "ação 2"],
  "sugestao_ajuste_horario": "HH:MM",
  "veredito_final": "MUDAR ABORDAGEM / MANTER E OTIMIZAR"
}`
      },
      {
        role: "user",
        content: `Analise a performance deste post publicado:

TEXTO DO POST:
${post_texto}

MÉTRICAS REAIS (Facebook Graph API):
- Curtidas: ${likes}
- Comentários: ${comments}
- Compartilhamentos: ${shares}
- Alcance orgânico: ${reach}
- Taxa de engajamento: ${engagement_rate}%
- Horário que foi postado: ${hora_postagem}

Critique sem piedade. O objetivo é melhorar o próximo post.
Responda SOMENTE com o JSON especificado.`
      }
    ]
  });

  const raw = response.choices[0].message.content.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : raw);
}

module.exports = { runAnalyst };
