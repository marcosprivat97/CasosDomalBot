const { Groq } = require("groq-sdk");
const fs = require("fs");
const path = require("path");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Agente 7: O CEO
 * Toma decisões estratégicas baseadas na performance real.
 */
async function runCEO({ criticas, historico, metricas }) {
  const strategyPath = path.join(__dirname, "../../data/strategy.json");

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content: `Você é o CEO de uma empresa de marketing viral para Facebook. Você não cria conteúdo — você comanda a equipe.

Você recebe relatórios do Crítico e dos Analytics e toma DECISÕES ESTRATÉGICAS que toda a equipe deve seguir nos próximos posts.

VOCÊ PENSA EM:
- Crescimento de seguidores no longo prazo
- Aumento do alcance orgânico
- Mais receita de monetização (RPM, views monetizáveis)
- Qual nicho dentro de curiosidades performa melhor
- Que horários estão trazendo mais resultado

SUAS ORDENS SÃO LEI para os outros agentes. Você é direto, exigente e estratégico.

Quando o engajamento cai, você muda a estratégia. Quando sobe, você dobra a aposta.

Retorne SOMENTE JSON válido:
{
  "ordens_redator": ["ordem específica 1", "ordem específica 2"],
  "ordens_diretor_visual": ["tipo de imagem a priorizar"],
  "ordens_cacador": ["focar no tema X", "evitar tema Y"],
  "horarios_aprovados": ["07:30", "12:15", "21:00"],
  "estrategia_semana": "foco estratégico em 1 frase",
  "meta_engajamento": { "curtidas_por_post": número, "comentarios_por_post": número, "shares_por_post": número },
  "experimento_semana": "algo novo para testar esta semana",
  "mensagem_equipe": "motivação ou bronca direta para a equipe em 1 frase",
  "nivel_urgencia": "normal / alerta / critico"
}`
      },
      {
        role: "user",
        content: `RELATÓRIO DO CRÍTICO (último post):
${JSON.stringify(criticas, null, 2)}

HISTÓRICO DOS ÚLTIMOS 7 POSTS:
${JSON.stringify(historico, null, 2)}

MÉTRICAS DA SEMANA:
- Alcance total: ${metricas.reach_total || "N/A"}
- Engajamento médio por post: ${metricas.avg_engagement || "N/A"}%
- Melhor post da semana: ${metricas.best_post || "N/A"}
- Pior post da semana: ${metricas.worst_post || "N/A"}
- Novos seguidores esta semana: ${metricas.new_followers || "N/A"}
- Horário com mais resultado: ${metricas.best_hour || "N/A"}

Com base nesses dados, emita suas ordens estratégicas para a equipe.
Responda SOMENTE com o JSON especificado.`
      }
    ]
  });

  const raw = response.choices[0].message.content.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const json = JSON.parse(jsonMatch ? jsonMatch[0] : raw);

  // Salvar para Team Memory
  fs.writeFileSync(strategyPath, JSON.stringify({ ceo_orders: json, last_update: new Date().toISOString() }, null, 2));

  return json;
}

module.exports = { runCEO };
