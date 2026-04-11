const { masterBrainRequest, parseGroqResponse } = require("./utils");
const fs = require("fs");
const path = require("path");
const logger = require("../logger");
const AuditorModule = require("../modules/auditor.module");

/**
 * Agente Mestre Visual (O Professor)
 * Responsável por pesquisar tendências de design e ensinar o robô editor.
 */
async function runVisualLearning() {
  logger.info("🎨 [VISUAL MASTER] Iniciando ciclo de aprendizado para 2026...");

  // 1. Coletar Feedback de Performance Real
  let performanceSummary = "Dados de performance indisponíveis no momento.";
  try {
      const report = await AuditorModule.generatePerformanceReport(5);
      performanceSummary = `
ÚLTIMA PERFORMANCE (FACEBOOK):
- Alcance Total: ${report.reach_total} usuários únicos.
- Engajamento Médio: ${report.avg_engagement} por post.
- Status da Página: ${report.reach_total > 500 ? "ALTO DESEMPENHO" : "NECESSITA MELHORIA"}
`;
  } catch (e) {
      logger.warn("⚠️ [VISUAL MASTER] Não foi possível obter dados de performance.");
  }

  // 2. Simulação de "Pesquisa de tendências"
  const response = await masterBrainRequest({
    messages: [
      {
        role: "system",
        content: `Você é um Especialista em Psicologia Visual e Design Viral para Redes Sociais. 
Sua função é atuar como o "Professor" de um robô de edição de fotos. Estamos em Abril de 2026.

Você deve analisar a PERFORMANCE REAL da página e as tendências atuais para criar a Lição do Dia.

${performanceSummary}

TENDÊNCIAS GLOBAIS DE 2026:
- **Hyper-Human**: Rejeição ao "AI Slop". Fotos reais, cruas e com imperfeições humanas estão performando melhor.
- **Neon-Noir & Hyper-Bloom**: Contrastes agressivos (preto/neon) ou estéticas oníricas.
- **Design Deconstrutivista**: Quebra de regras de layout para parar o scroll.
- **Tipografia Gigante**: Textos dominantes para leitura rápida no mobile.

Sua tarefa é criar uma "Lição do Dia" que adapte estas tendências à realidade de performance da página.`
      },
      {
        role: "user",
        content: `Crie uma nova lição baseada nos dados acima. 
Retorne SOMENTE JSON no formato:
{
  "versao_logica": "1.x",
  "mudancas_aplicadas": ["descrição da mudança"],
  "novas_diretrizes": {
    "estilo_imagem": "ex: Cinematográfico Raw / Realismo Sujo",
    "foco_composicao": "instrução de como enquadrar a foto",
    "paleta_cores": "diretriz de cores",
    "teoria_do_clique": "por que isso gera engajamento"
  },
  "prompt_padrao_atualizado": "um trecho de prompt para ser adicionado ao gerador de imagens",
  "config_layout": {
    "font_size_mult": 1.0,
    "gradient_intensity": 0.8,
    "stroke_width": 4
  }
}`
      }
    ],
    temperature: 0.7
  });

  const lesson = parseGroqResponse(response);
  
  // 2. Salvar na Base de Conhecimento Visual
  const knowledgePath = path.join(__dirname, "../../data/visual_knowledge.json");
  
  // Garantir que o diretório data existe
  const dataDir = path.dirname(knowledgePath);
  if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
  }

  let currentKnowledge = {};
  if (fs.existsSync(knowledgePath)) {
      currentKnowledge = JSON.parse(fs.readFileSync(knowledgePath, 'utf8'));
  }

  // Atualizar conhecimento com a nova lição
  const updatedKnowledge = {
      ...currentKnowledge,
      ultima_atualizacao: new Date().toISOString(),
      licao_atual: lesson,
      historico_licoes: [
          ...(currentKnowledge.historico_licoes || []),
          { data: new Date().toISOString(), licao: lesson.mudancas_aplicadas }
      ].slice(-10) // Mantém as últimas 10 lições
  };

  fs.writeFileSync(knowledgePath, JSON.stringify(updatedKnowledge, null, 2));
  
  logger.important(`🎓 [VISUAL MASTER] Nova lição ensinada ao editor: ${lesson.mudancas_aplicadas.join(", ")}`);
  
  return lesson;
}

module.exports = { runVisualLearning };
