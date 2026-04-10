const { Groq } = require("groq-sdk");
const fs = require("fs");
const path = require("path");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Agente 7: O CEO "Cérebro Estratégico v12.0"
 * Toma decisões resilientes e criativas com memória de longo prazo.
 */
async function runCEO({ criticas, historico, metricas }) {
  const strategyPath = path.join(__dirname, "../../data/strategy.json");
  const historyPath = path.join(__dirname, "../../data/strategy_history.json");

  // 1. Carregar Histórico de Estratégias anteriores (Memória de Aprendizado)
  let strategyHistory = [];
  try {
    if (fs.existsSync(historyPath)) {
      strategyHistory = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    }
  } catch (e) {
    console.error("Erro ao carregar histórico de estratégias:", e.message);
  }

  // 2. Definir Estado de Urgência (Página Morta vs Crescendo)
  const isDeadPage = (metricas.reach_total === 0 || metricas.reach_total === "0" || !metricas.reach_total);
  const healthStatus = isDeadPage 
    ? "⚠️ EMERGÊNCIA: ALCANCE ZERADO (Página em Reach Freeze)" 
    : "✅ OPERACIONAL: Página com tração orgânica";

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.7, // Aumentado para maior criatividade estratégica
    messages: [
      {
        role: "system",
        content: `Você é o "Mestre Estrategista Viral v12.0". Sua missão é transformar uma página travada em um império de 1 milhão de seguidores.

STATUS ATUAL DA PÁGINA: ${healthStatus}

SUAS RESPONSABILIDADES:
1. DIAGNÓSTICO: Identificar por que os números estão baixos (ex: excesso de posts, falta de gancho).
2. MEMÓRIA: Analisar o que você ordenou antes e ajustar se não funcionou.
3. CRIATIVIDADE: Propor fórmulas "quebra-gelo" para reaquecer o algoritmo.

REGRAS DE OURO:
- Se Alcance = 0: Foque 100% em posts de "Identificação Extrema" (situações universais que obrigam o comentário).
- Não repita estratégias que falharam nos últimos 3 ciclos.
- Seja o "Dono" da página: mande, cobre e ajuste a rota.

Retorne SOMENTE JSON válido.`
      },
      {
        role: "user",
        content: `### DADOS PARA DECISÃO:
        
RELATÓRIO DO CRÍTICO (Último Post):
${JSON.stringify(criticas || {}, null, 2)}

EXTRATO DE MÉTRICAS:
- Alcance: ${metricas.reach_total || 0}
- Engajamento: ${metricas.avg_engagement || 0}%
- Histórico Recente: ${JSON.stringify((historico || []).slice(-3), null, 2)}

MEMÓRIA DE ESTRATÉGIAS ANTERIORES (Opcional):
${JSON.stringify(strategyHistory.slice(-3), null, 2)}

Emita suas novas ordens estratégicas. Responda APENAS o JSON.`
      }
    ]
  });

  const raw = response.choices[0].message.content.trim();
  let json;

  // 3. Tratamento de Erro Robusto para JSON
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Nenhum JSON encontrado na resposta da IA");
    json = JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("🚨 [CEO ERROR] Falha no JSON da IA. Usando Fallback Estratégico.", e.message);
    // Fallback de Segurança (Modo Recuperação)
    json = {
      estrategia_atual: "Recuperação de Emergência (Fallback)",
      ordens_redator: ["Focar em ID universal", "Texto curto e impactante"],
      ordens_diretor_visual: ["Foto única, alta clareza"],
      limite_postagem_dia: 3,
      diagnostico_causa_raiz: "IA falhou no JSON, entrando em modo seguro.",
      msg_para_equipe": "Mantenham a simplicidade e foco total em identificação emocional."
    };
  }

  // 4. Salvar Decisão Atual e Atualizar Histórico (Max 30 registros)
  const currentDecision = { 
    timestamp: new Date().toISOString(),
    status_pagina: healthStatus,
    ...json 
  };
  
  strategyHistory.push(currentDecision);
  if (strategyHistory.length > 30) strategyHistory.shift();

  try {
    fs.writeFileSync(strategyPath, JSON.stringify({ ceo_orders: json, last_update: new Date().toISOString() }, null, 2));
    fs.writeFileSync(historyPath, JSON.stringify(strategyHistory, null, 2));
  } catch (e) {
    console.error("Erro ao salvar arquivos do CEO:", e.message);
  }

  return json;
}

module.exports = { runCEO };
