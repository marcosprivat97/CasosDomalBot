const { Groq } = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Agente: Estrategista de Tráfego v12.0 (Elite)
 * Gerencia o timing perfeito e o fluxo de posts para máxima tração.
 */
async function runSchedulerAgent({ posts_hoje, ultimo_post_horario }) {
  const agoraStr = new Date().toLocaleTimeString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit' });
  const [hora, minuto] = agoraStr.split(':').map(Number);
  const minutosAtuais = hora * 60 + minuto;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2, // Baixa temperatura para precisão lógica
    messages: [
      {
        role: "system",
        content: `Você é o "Estrategista de Tráfego Elite v12.0". Sua missão é dominar o algoritmo do Facebook através do Timing Perfeito.

JANELAS DE OURO (Horário de Brasília):
1. MANHÃ (Identificação): 07:30 - 09:30
2. NOITE (Narrativas): 19:30 - 21:30

REGRAS DE OURO:
- Intervalo mínimo de 10 horas entre posts (Obrigatório para evitar spam).
- Máximo de 2 posts por dia (Manhã e Noite).
- Calcule o "Score de Oportunidade" (0-100). Só recomende postar se o score for > 90.
- Se estiver fora das janelas acima, REJEITE a postagem imediatamente.

Retorne SOMENTE JSON válido.`
      },
      {
        role: "user",
        content: `DADOS DO MOMENTO:
Hora Atual: ${agoraStr}
Posts Hoje: ${posts_hoje}
Último Post: ${ultimo_post_horario || 'Nunca postado hoje'}

Decida se devemos postar agora ou calcular a espera. Responda APENAS o JSON.`
      }
    ]
  });

  const raw = response.choices[0].message.content.trim();
  let json;

  // 1. Parsing Robusto
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON não encontrado");
    json = JSON.parse(jsonMatch[0]);
  } catch (e) {
    logger.warn(`🚨 [SCHEDULER] IA falhou no JSON. Ativando Fallback de Segurança.`);
    json = getLocalFallback(hora, minutosAtuais, posts_hoje, ultimo_post_horario);
  }

  // 2. Logs Estratégicos
  if (json.pode_postar_agora) {
    logger.important(`🎯 [OPORTUNIDADE] Janela: ${json.janela_alvo} | Score: ${json.score_oportunidade || 'N/A'}`);
    logger.info(`📝 Estratégia: ${json.estrategia_janela}`);
  } else {
    logger.info(`⏳ [AGUARDANDO] Próxima Janela: ${json.janela_alvo} (${json.minutos_para_aguardar}min)`);
  }

  return json;
}

/**
 * Lógica de Segurança Local (Fallback)
 * Garante que o bot funcione mesmo se a IA estiver offline ou errática.
 */
function getLocalFallback(hora, totalMinutos, postsHoje, ultimoPost) {
  const janelas = [
    { nome: "Manhã", start: 7*60+30, end: 9*60+30 },
    { nome: "Noite", start: 19*60+30, end: 21*60+30 }
  ];

  const janelaAtual = janelas.find(j => totalMinutos >= j.start && totalMinutos <= j.end);
  const proximaJanela = janelas.find(j => j.start > totalMinutos) || janelas[0];

  let podePostar = false;
  let motivo = "Fora de janelas de pico (Manhã/Noite).";

  if (janelaAtual && postsHoje < 2) {
    podePostar = true;
    motivo = "Dentro da janela estratégica (Fallback Local).";
  }

  return {
    pode_postar_agora: podePostar,
    janela_alvo: janelaAtual ? janelaAtual.nome : proximaJanela.nome,
    minutos_para_aguardar: janelaAtual ? 0 : proximaJanela.start - totalMinutos,
    estrategia_janela: motivo,
    score_oportunidade: podePostar ? 90 : 0
  };
}

module.exports = { runSchedulerAgent };
