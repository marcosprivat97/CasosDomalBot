const { groqRequest, getCEOStrategy, parseGroqResponse } = require("./utils");
const logger = require("../logger");

async function runVisualDirector({ tema, personagem_principal, angulo_chocante, emocao_alvo, titulo_imagem, nicho, gancho, resumo_historia, historico_estilos }) {
  const strategy = getCEOStrategy();
  const ordensVisual = strategy && strategy.ordens_diretor_visual ? strategy.ordens_diretor_visual.join(", ") : "Focar em realismo, mistério e impacto visual.";

  const response = await groqRequest({
    model: "llama-3.3-70b-versatile",
    temperature: 0.6,
    messages: [
      {
        role: "system",
        content: `Você é o Diretor de Arte Sênior da "Casos Domal". Sua missão é gerar imagens que pareçam registros reais e detalhados de uma investigação de elite.
        
IMPORTANTE: Suas buscas (busca_foto_1 e busca_foto_2) devem ser baseadas no MOMENTO DE CHOQUE da história.
Não busque apenas o tema geral, busque os DETALHES que a história descreve.

DIRETRIZES DE RIQUEZA VISUAL (OBRIGATÓRIAS):
1. RIQUEZA DE DETALHES (FORENSE): Foque em texturas, detalhes aproximados (macro), evidências reais.
2. BUSCA DE REALIDADE (SERPAPI): Suas buscas (busca_foto_1 e busca_foto_2) devem focar no NOME DO CASO, LOCALIDADE ou OBJETO REAL citado na história. Ex: Se a história é sobre "O mistério de Dyatlov", uma busca deve ser "Dyatlov Pass incident real photos 1959".
3. IMPACTO VISUAL: A imagem deve ser um "soco no olho". Use iluminação dramática e ângulos de autoridade.
4. REALISMO DOCUMENTAL: Deve parecer National Geographic ou registro policial. 

RETORNE JSON:
{
  "decisao_layout": "single_foto" ou "dual_collage" (sempre prefira dual_collage se houver um local e um objeto específico, ou antes/depois),
  "busca_foto_1": "termos em INGLÊS focados no CASO REAL (Ex: real evidence of Titanic wreck interior)",
  "busca_foto_2": "termos em INGLÊS focados no OBJETO/LOCAL (Ex: deep sea footage titanic boiler)",
  "prompt_flux": "prompt hiper-detalhado em inglês para geração fallback",
  "estilo_escolhido": "string",
  "seed": 123456,
  "aprovado": true,
  "motivo_layout": "por que este layout"
}`
      },
      {
        role: "user",
        content: `Gere a direção visual baseada no resumo real da história:

RESUMO DA HISTÓRIA: ${resumo_historia || tema}
TEMA CENTRAL: ${tema}
ÂNGULO DE IMPACTO: ${angulo_chocante}
TÍTULO DA POSTAGEM: ${titulo_imagem}

HISTÓRICO RECENTE: ${historico_estilos || "Nenhum"}
ORDENS DO CEO: ${ordensVisual}

Sua busca deve capturar o que há de mais VIRAL e CHOCANTE nos detalhes desse resumo.`
      }
    ]
  });

  return parseGroqResponse(response);
}

module.exports = { runVisualDirector };
