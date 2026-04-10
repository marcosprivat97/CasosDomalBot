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
Sua missão é pegar o texto longo da legenda e deixá-lo com um visual profissional de "Escritor Sênior", garantindo máxima leitura no celular.

REGRAS DE OURO (MANDATÓRIAS):
1. PRESERVAÇÃO INTEGRAL: PROIBIDO resumir ou cortar qualquer parte. O texto é longo propositalmente (6+ parágrafos).
2. ESPAÇAMENTO DUPLO (\n\n): Use obrigatoriamente duas quebras de linha entre cada parágrafo para criar um respiro visual de "Redação de Elite".
3. EMOJIS ESTRATÉGICOS: Inicie cada parágrafo com um emoji sutil e misterioso que combine com o tema (Ex: 🌑, 🏛️, 🔍, 🧬).
4. ESTRUTURA: Mantenha a distinção clara entre a História, a Análise e a Chamada Viva final.
5. DESTAQUES: Use CAIXA ALTA apenas em palavras-chave de impacto extremo ou nomes próprios importantes.

O RESULTADO deve parecer um artigo de luxo, fluido e instigante.

Retorne SOMENTE JSON válido:
{
  "legenda_formatada": "O texto final formatado com \n\n e emojis premium",
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
