const { groqRequest, getCEOStrategy, parseGroqResponse } = require("./utils");
const logger = require("../logger");

/**
 * Agente 3: Diretor de Arte v12.0 (Smart Layout Engine)
 * Especialista em "Visual Viral" e fusão de conceitos bizarros.
 */
async function runVisualDirector({ tema, angulo_chocante, titulo_imagem, prompt_web, prompt_ia, resumo_historia, historico_estilos }) {
  const strategy = getCEOStrategy();
  const ordensVisual = strategy && strategy.ordens_diretor_visual ? strategy.ordens_diretor_visual.join(", ") : "Focar em realismo, mistério e impacto visual.";

  const response = await groqRequest({
    model: "llama-3.3-70b-versatile",
    temperature: 0.6,
    messages: [
      {
        role: "system",
        content: `Você é o Diretor de Arte Sênior v12.0. Sua missão é criar a imagem mais "clicável" e chocante possível.

### ESTRATÉGIA HÍBRIDA (WEB + IA):
O Caçador (Scout) sugeriu estes conceitos:
- REAL (PROMPT_WEB): ${prompt_web}
- ARTÍSTICO (PROMPT_IA): ${prompt_ia}

### MOTOR DE LAYOUT:
- DUAL_COLLAGE: USE SEMPRE que puder mostrar um contraste. Coloque a foto REAL (Web) de um lado e a geração IA (Dramática) do outro.

FORMATO DE RESPOSTA OBRIGATÓRIO (JSON):
{
  "decisao_layout": "dual_collage",
  "busca_foto_1": "REFINAMENTO do prompt_web (em inglês)",
  "busca_foto_2": "REFINAMENTO do prompt_ia (em inglês)",
  "prompt_flux": "Prompt de FUSÃO para IA caso o layout mude para single",
  "motivo_estrategico": "Explicação"
}`

Retorne SOMENTE JSON válido.`
      },
      {
        role: "user",
        content: `GERE A DIREÇÃO VISUAL MAESTRO:
Tema: ${tema}
Ângulo de Impacto: ${angulo_chocante}
Título da Imagem: ${titulo_imagem}
Resumo da História: ${resumo_historia}

Ordens do CEO: ${ordensVisual}

IDENTIFIQUE OS CONCEITOS: Quais são os 2 elementos que mais chocam quando colocados juntos?`
      }
    ]
  });

  return parseGroqResponse(response);
}

module.exports = { runVisualDirector };
