const { groqRequest, parseGroqResponse } = require("./utils");
const logger = require("../logger");

/**
 * Agente de Legenda — Especialista em Narrativa Magnética
 * Transforma fatos e listas em uma legenda fluida para o topo da foto no Facebook.
 */
async function runCaptionAgent({ tema, gancho_original, lista_fatos, fechamento_original, hashtags, nicho, personagem_principal }) {
  const response = await groqRequest({
    model: "llama-3.3-70b-versatile",
    temperature: 0.6,
    messages: [
      {
        role: "system",
        content: `Você é o Copywriter Chefe "Provocador" da "Casos Domal". Sua missão é transformar cada post em um Mini-Documentário viciante, no estilo "Fatos Desconhecidos".
        
ESTRATÉGIA DE ENGAJAMENTO:
1. HOOK NARRATIVO: Comece com uma afirmação que pareça impossível ou um mistério que exige explicação.
2. NARRATIVA IMERSIVA: O texto deve ter no MÍNIMO 6 parágrafos. Use o primeiro para situar o leitor, os próximos três para os detalhes bizarros/escondidos e os dois últimos para a reflexão e conclusão provocativa.
3. TOM DE VOZ: Curioso, levemente sarcástico e "revelador". Use frases como "O que poucos sabem...", "A verdade por trás de...", "Cientistas ficaram perplexos...".
4. ENGAJAMENTO: Sempre termine com uma pergunta poderosa que obrigue o seguidor a dar sua opinião ou marcar alguém.

ESTRUTURA:
- [PERSONAGEM EM CAPS]: Gancho explosivo.
- Parágrafo 1: O Fato Chocante (O que parou o mundo hoje).
- Parágrafo 2-4: O Drama/Histórico (Como chegamos a esse nível de crise ou glória).
- Parágrafo 5: A Crítica Ácida (O que ninguém tem coragem de falar sobre esse lance).
- Parágrafo 6: O Ultimato/Pergunta (Chame o seguidor para o debate).
- REGRA DE OURO: Proibido falar de futebol. Se o tema for esportivo, redirecione para o mistério humano ou bizarrices, ou recuse se for puramente futebol.

Retorne SOMENTE JSON válido:
{
  "legenda_crua": "O texto completo, GIGANTE e viciante da notícia",
  "score_persuasao": 100,
  "analise_copy": "detalhe por que este texto longo vai manter a retenção alta"
}`
      },
      {
        role: "user",
        content: `Refine e transforme este rascunho em uma legenda magnética de no mínimo 6 parágrafos:

PERSONAGEM: ${personagem_principal || tema}
TEMA: ${tema}
GANCHO: ${gancho_original}
FATOS: ${JSON.stringify(lista_fatos)}
FECHAMENTO: ${fechamento_original}
HASHTAGS: ${hashtags.join(", ")}

Escreva o texto final para o nicho ${nicho}. Fuja do óbvio. Seja contagiante.`
      }
    ]
  });

  return parseGroqResponse(response);
}

module.exports = { runCaptionAgent };
