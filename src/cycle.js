const { runGateKeeper } = require("./agents/gatekeeper");
const { runSchedulerAgent } = require("./agents/scheduler_agent");
const logger = require("./logger");

/**
 * runCycle - Gerente da Equipe de Bots (Integrado)
 * Localização: src/cycle.js (Ponto de entrada para a equipe de bots)
 */
async function runCycle({ texto, descricao_imagem, tema, link, posts_hoje, ultimo_post }) {

  // Passo 1 — verificar se é hora de postar
  logger.info("[SCHEDULER] Consultando estrategista de horários...");
  const schedule = await runSchedulerAgent({
    posts_hoje,
    ultimo_post_horario: ultimo_post
  });

  logger.info(`[SCHEDULER] Resultado: ${JSON.stringify(schedule)}`);

  if (!schedule.pode_postar_agora) {
    logger.warn(`[SCHEDULER] Aguardando ${schedule.minutos_para_aguardar} min. Motivo: ${schedule.motivo}`);
    return { status: "aguardando", minutos: schedule.minutos_para_aguardar };
  }

  // Passo 2 — Gate Keeper aprova o post
  logger.info("[GATE KEEPER] Enviando post para aprovação...");
  const avaliacao = await runGateKeeper({ texto, descricao_imagem, tema, link });

  logger.info(`[GATE KEEPER] Score: ${avaliacao.score_final} | Decisão: ${avaliacao.decisao}`);

  if (avaliacao.decisao === "DESCARTAR") {
    logger.warn(`[GATE KEEPER] Post descartado. Motivo: ${avaliacao.justificativa}`);
    return { status: "descartado", motivo: avaliacao.justificativa };
  }

  if (avaliacao.decisao === "REESCREVER") {
    logger.warn(`[GATE KEEPER] Post precisa de revisão: ${avaliacao.sugestoes_melhoria}`);
    return { status: "reescrever", sugestoes: avaliacao.sugestoes_melhoria };
  }

  // Passo 3 — Liberado para postar
  logger.info("[GATE KEEPER] Post APROVADO. Liberando para publicação...");
  return { status: "aprovado", score: avaliacao.score_final };
}

module.exports = { runCycle };
