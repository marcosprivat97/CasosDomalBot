const { groqRequest, parseGroqResponse } = require("./utils");
const fs = require("fs");
const path = require("path");
const logger = require("../logger");

/**
 * Agente de Evolução (O Engenheiro-Chefe)
 * Responsável por reescrever a estratégia do dia a dia.
 */
async function runSelfEvolution({ current_brain, performance_last_24h }) {
  const response = await groqRequest({
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: `Você é o "Arquiteto de Sistemas" da Casos Domal. Sua única função é evoluir a inteligência do bot baseado em dados reais.
        
Você analisa o que o bot aprendeu (Cérebro) e como a página performou, e então reescreve o arquivo "master_strategy.json" ou altera os prompts dinâmicos.

OBJETIVO:
- Identificar se o tom de voz precisa mudar.
- Ajustar filtros de notícias se as atuais estão falhando.
- Melhorar os ganchos baseados nos comentários mais curtidos.

Retorne SOMENTE JSON válido:
{
  "versao_logica": "1.x",
  "mudancas_aplicadas": ["descrição da mudança"],
  "novos_prompts_sugeridos": {
    "scout": "instrução atualizada",
    "writer": "instrução atualizada"
  },
  "prioridade_amanha": "nicho específico ou tática de marketing",
  "riscos_detectados": ["risco 1"]
}`
      },
      {
        role: "user",
        content: `ESTADO ATUAL DO CÉREBRO:
${JSON.stringify(current_brain)}

PERFORMANCE ÚLTIMAS 24H:
${JSON.stringify(performance_last_24h)}

Como devemos evoluir hoje para chegar em 1 milhão de seguidores?`
      }
    ]
  });

  const evolution = parseGroqResponse(response);
  
  // Aplicar evolução na memória da equipe (Simulação de escrita no team_memory)
  const memoryPath = path.join(__dirname, "../../data/team_memory.json");
  if (fs.existsSync(memoryPath)) {
      let memory = JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
      memory.ceo_orders.estrategia_semana = evolution.prioridade_amanha;
      memory.ceo_orders.nivel_urgencia = "EVOLUÇÃO AUTÔNOMA APLICADA";
      fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2));
      logger.important(`🧬 [AUTO-EVOLUÇÃO] Nova estratégia aplicada: ${evolution.prioridade_amanha}`);
  }

  return evolution;
}

module.exports = { runSelfEvolution };
