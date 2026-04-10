const { groqRequest, getCEOStrategy, parseGroqResponse } = require("./utils");
const logger = require("../logger");

/**
 * Agente 3: Diretor de Arte v12.0 (Smart Layout Engine)
 * Especialista em "Visual Viral" e fusão de conceitos bizarros.
 */
async function runVisualDirector({ tema, angulo_chocante, titulo_imagem, resumo_historia, historico_estilos }) {
  const strategy = getCEOStrategy();
  const ordensVisual = strategy && strategy.ordens_diretor_visual ? strategy.ordens_diretor_visual.join(", ") : "Focar em realismo, mistério e impacto visual.";

  const response = await groqRequest({
    model: "llama-3.3-70b-versatile",
    temperature: 0.6,
    messages: [
      {
        role: "system",
        content: `Você é o Diretor de Arte Sênior v12.0. Sua missão é criar a imagem mais "clicável" e chocante possível.

### MOTOR DE LAYOUT INTELIGENTE:
- SINGLE_FOTO: Use apenas se houver um ÚNICO objeto central de impacto extremo.
- DUAL_COLLAGE: Use sempre que houver CONTRASTE (ex: Antes/Depois, Objeto A + Objeto B, Local + Personagem). 
  *Exemplo: Se a história é sobre um carro que virou piscina, você PRECISA de uma collage ou uma fusão.*

### DIRETRIZ DE FUSÃO (AI PROMPT):
- Se o caso envolve uma modificação bizarra (ex: Fusca Piscina), o "prompt_flux" deve descrever a FUSÃO dos dois elementos em um único objeto realista.

FORMATO DE RESPOSTA OBRIGATÓRIO (JSON):
{
  "decisao_layout": "single_foto" ou "dual_collage",
  "busca_foto_1": "termos em INGLÊS focados no ELEMENTO 1",
  "busca_foto_2": "termos em INGLÊS focados no ELEMENTO 2",
  "prompt_flux": "prompt em INGLÊS fundindo os conceitos principais com ultra-realismo",
  "motivo_estrategico": "Explicação curta de por que este layout é mais viral"
}

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
