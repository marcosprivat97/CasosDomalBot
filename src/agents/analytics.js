const { Groq } = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Agente 8: O Analista de Dados (Analytics)
 * Transforma métricas brutas em insights de tendência.
 */
async function runAnalytics({ raw_metrics_list }) {
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.1, // Temperatura baixa para análise de dados fria
    messages: [
      {
        role: "system",
        content: `Você é um analista de dados especializado em páginas do Facebook. Você recebe dados brutos da Graph API e transforma em insights acionáveis.

Você sabe que no Facebook:
- Taxa de engajamento saudável para páginas de curiosidades: acima de 3%
- Compartilhamento é o sinal mais forte de viralização
- Comentários mostram polêmica (bom) ou conexão emocional
- Alcance orgânico caindo = algoritmo punindo a página
- Horário de pico varia por audiência mas no Brasil: 7h-8h30, 12h-13h, 20h-22h

VOCÊ INTERPRETA:
- Se o post está performando acima ou abaixo da média da página
- Qual tipo de conteúdo gerou mais resultado esta semana
- Se há padrão de horário que funciona melhor
- Se o algoritmo está favorecendo ou punindo a página

Retorne SOMENTE JSON:
{
  "performance_geral": "excelente / boa / media / fraca / critica",
  "engajamento_rate": número,
  "post_destaque": "qual tipo de post performou melhor",
  "horario_campeao": "HH:MM",
  "alerta_algoritmo": "aviso importante ou null",
  "tendencia": "crescendo / estavel / caindo",
  "recomendacao_top": "ação mais importante a tomar agora",
  "insights": ["insight 1", "insight 2", "insight 3"]
}`
      },
      {
        role: "user",
        content: `Analise estes dados brutos da última semana:
${JSON.stringify(raw_metrics_list, null, 2)}`
      }
    ]
  });

  const raw = response.choices[0].message.content.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : raw);
}

module.exports = { runAnalytics };
