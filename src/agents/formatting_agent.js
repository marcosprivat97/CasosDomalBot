const { groqRequest, parseGroqResponse } = require("./utils");
const logger = require("../logger");

/**
 * Agente de Formatação — Especialista em Layout e Legibilidade (Facebook UX)
 * Garante que o texto tenha respiro visual, quebras de linha e emojis estratégicos.
 */
async function runFormattingAgent({ texto_bruto, nicho }) {
  const response = await groqRequest({
    model: "llama-3.3-70b-versatile",
    temperature: 0.5,
    messages: [
      {
        role: "system",
        content: `Você é um Especialista em Edição e Layout de Conteúdo Viral para o Facebook.
Sua missão é pegar o texto longo da legenda e deixá-lo com um visual profissional de "Redação de Portal", garantindo máxima leitura no celular.

REGRAS DE OURO (MANDATÓRIAS):
1. PROIBIDO PAREDE DE TEXTO: Cada bloco deve ter no máximo 2 ou 3 frases curtas.
2. ESPAÇAMENTO DUPLO (\n\n): Use obrigatoriamente duas quebras de linha entre cada bloco para criar um respiro visual.
3. EMOJIS DE IMPACTO: Inicie quase todos os blocos com um emoji que combine com o assunto (😱, 🕵️‍♂️, 🛸, 🏺, 💀, 🚨).
4. DESTAQUES: Use CAIXA ALTA apenas para nomes de LUGARES, PESSOAS ou DESCOBERTAS importantes.
5. PRESERVAÇÃO: Não resuma o texto. Apenas organize-o melhor com espaços e emojis.

O RESULTADO deve ser "arejado" e dinâmico.

Retorne SOMENTE JSON válido:
{
  "legenda_formatada": "O texto final formatado com \n\n e emojis de mistério/curiosidade",
  "score_leiturabilidade": 100
}`
      },
      {
        role: "user",
        content: `Formate este texto longo para o Facebook, mantendo toda a riqueza de detalhes e deixando-o "arejado":

TEXTO:
${texto_bruto}

Nicho: ${nicho}`
      }
    ]
  });

  return parseGroqResponse(response);
}

module.exports = { runFormattingAgent };
