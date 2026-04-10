/**
 * Agente 2: Redator Viral Elite v12.0
 * Especialista em Storytelling de Alta Retenção e Hipnose por Texto.
 */
async function runWriter({ tema, angulo_chocante, nicho, fatos_coletados, brain_context }) {
  const { groqRequest, getCEOStrategy, parseGroqResponse } = require("./utils");
  const strategy = getCEOStrategy();
  const diretrizesCEO = strategy ? JSON.stringify(strategy) : "Focar em histórias emocionantes e reviravoltas chocantes.";

  const response = await groqRequest({
    model: "llama-3.3-70b-versatile",
    temperature: 0.75,
    messages: [
      {
        role: "system",
        content: `Você é o "Escritor Mestre v12.0". Sua missão é criar narrativas longas que prendem o leitor e forçam o engajamento.

### ARQUITETURA DE RETENÇÃO (MANDATÓRIO MÍNIMO 6 PARÁGRAFOS):
1. O GANCHO: Afirmação chocante ou pergunta "soco no estômago".
2. O CENÁRIO: Construção da ponte emocional e local.
3. O INCIDENTE: O surgimento do fato bizarro/inusitado.
4. O MERGULHO: Riqueza de detalhes, dados e curiosidades.
5. A REVIRAVOLTA: O segredo revelado.
6. A CTA VIVA: Pergunta aberta "venenosa" para os comentários.

### REGRAS DE OURO:
- ESPAÇAMENTO: Use obrigatoriamente \n\n entre cada parágrafo.
- TAMANHO: O texto deve ser longo, detalhado e explicar tudo antes de resumir.
- NUNCA use clichês de IA (ex: "Em um mundo...", "Imagine se...").

FORMATO DE RESPOSTA OBRIGATÓRIO (JSON):
{
  "tema": "Título do caso",
  "gancho": "Frase inicial de impacto",
  "texto_principal": "Texto completo com no mínimo 6 parágrafos e \n\n entre eles",
  "resumo_final": "Um resumo curto de 2 linhas para o final",
  "titulo_imagem": "Frase curta e impactante para colocar NA IMAGEM (Max 5 palavras)"
}

Retorne SOMENTE JSON válido.`
      },
      {
        role: "user",
        content: `CRIE A NARRATIVA DEFINITIVA:
Tema: ${tema}
Ângulo Chocante: ${angulo_chocante}
Histórico: ${brain_context}
Ordens do CEO: ${diretrizesCEO}

REQUISITO: Escreva pelo menos 300 palavras. Conte cada detalhe da notícia citada acima. Não economize nas palavras.`
      }
    ]
  });

  return parseGroqResponse(response);
}

module.exports = { runWriter };
