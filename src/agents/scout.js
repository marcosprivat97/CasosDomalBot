const { groqRequest, getCEOStrategy, parseGroqResponse } = require("./utils");
const logger = require("../logger");

/**
 * Agente 1: Caçador de Tendências v12.0 (Elite)
 * Especialista em encontrar mistérios e fatos "O Brasileiro precisa ser estudado".
 */
async function runScout({ titulo, fonte, shares, categoria, ultimo_tema, recent_topics = [], brain_context }) {
  const strategy = getCEOStrategy();
  const diretrizesCEO = strategy ? JSON.stringify(strategy) : "Focar em mistérios, ciência e fatos insólitos.";

  const response = await groqRequest({
    model: "llama-3.3-70b-versatile",
    temperature: 0.6, 
    messages: [
      {
        role: "system",
        content: `Você é o "Caçador Global de Elite v12.0". Sua missão é encontrar o ouro viral escondido para o público brasileiro.

### REGRA SUPREMA DE INOVAÇÃO (VETO):
- PROIBIDO REPETIR: Não escolha nenhum tema que já foi abordado recentemente.
- BLACKLIST DE TEMAS RECENTES: ${recent_topics.length > 0 ? recent_topics.join(", ") : "Nenhum tema recente."}

CATEGORIAS MESTRE:
1. BRASIL MISTERIOSO (40%): OVNIs no interior, lendas urbanas reais, segredos históricos do BR.
2. SÓ ACONTECE NO BRASIL (40%): Gambiarras geniais, flagras de rua absurdos.
3. ALERTA / CURIOSIDADE (20%): Fatos chocantes cotidiano.

DIRETRIZ VISUAL:
- Gere "query_rara": Um termo técnico em INGLÊS para buscar a foto real documental (Ex: "fujifilm documentary photography street scene Brazil"). Evite termos genéricos.

FORMATO DE RESPOSTA OBRIGATÓRIO (JSON):
{
  "tema": "Título do caso",
  "nicho": "Categoria (Brasil Misterioso / Só acontece no Brasil / Alerta)",
  "angulo_chocante": "O ponto de curiosidade extrema",
  "query_rara": "Termo de busca em inglês",
  "emocao_alvo": "Emoção principal"
}

Retorne SOMENTE JSON válido.`
      },
      {
        role: "user",
        content: `ANALISE E VALIDE ESTA PAUTA:
Título: ${titulo}
Nicho Sugerido: ${categoria}
Diretriz CEO: ${diretrizesCEO}
Último Tema: ${ultimo_tema}

REQUISITO:
- Se o tema for internacional, traga para o contexto brasileiro ("Imagine isso acontecendo aqui").
- A manchete sugerida para a foto deve ser uma frase completa e chocante.

Responda APENAS o JSON.`
      }
    ]
  });

  return parseGroqResponse(response);
}

module.exports = { runScout };
