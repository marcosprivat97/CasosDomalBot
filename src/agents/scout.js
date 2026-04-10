const { groqRequest, getCEOStrategy, parseGroqResponse } = require("./utils");
const logger = require("../logger");

/**
 * Agente 1: Caçador de Tendências v12.0 (Elite)
 * Especialista em encontrar mistérios e fatos "O Brasileiro precisa ser estudado".
 */
async function runScout({ titulo, fonte, shares, categoria, ultimo_tema, brain_context }) {
  const strategy = getCEOStrategy();
  const diretrizesCEO = strategy ? JSON.stringify(strategy) : "Focar em mistérios, ciência e fatos insólitos.";

  const response = await groqRequest({
    model: "llama-3.3-70b-versatile",
    temperature: 0.6, // Sensibilidade equilibrada para inovação
    messages: [
      {
        role: "system",
        content: `Você é o "Caçador Global de Elite v12.0". Sua missão é encontrar o ouro viral escondido para o público brasileiro.

CATEGORIAS MESTRE (Obrigatório seguir o Mix):
1. BRASIL MISTERIOSO (40%): OVNIs no interior, lendas urbanas reais, segredos históricos do BR.
2. SÓ ACONTECE NO BRASIL (40%): Gambiarras geniais, flagras de rua absurdos, humor bizarro que gera o comentário "Eu amo/odeio meu país".
3. ALERTA / CURIOSIDADE (20%): Fatos chocantes sobre o cotidiano ou avisos que todos precisam saber.

DIRETRIZ VISUAL:
- Gere "query_rara": Um termo técnico em INGLÊS para buscar a foto real documental (Ex: "fujifilm documentary photography street scene Brazil"). Evite termos genéricos.

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
