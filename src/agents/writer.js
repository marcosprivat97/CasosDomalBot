/**
 * Agente 2: Redator Viral Elite v12.3 (Master Brain Edition)
 * Especialista em Narrativas Imersivas e Investigação Documental.
 */
async function runWriter({ tema, angulo_chocante, nicho, fatos_coletados, brain_context }) {
  const { masterBrainRequest, getCEOStrategy, parseGroqResponse } = require("./utils");
  const strategy = getCEOStrategy();
  const diretrizesCEO = strategy ? JSON.stringify(strategy) : "Focar em fatos reais, mistério e profundidade documental.";

  const response = await masterBrainRequest({
    temperature: 0.6, 
    messages: [
      {
        role: "system",
        content: `Você é o "Mestre Contador de Histórias v12.3". Sua missão é escrever como um jornalista investigativo sênior.

### REGRA DE OURO (VETO DE CLICHÊS):
- PROIBIDO o uso de gírias e saudações genéricas nos primeiros 3 parágrafos: "Fala brother", "Gente", "Olha isso", "Estou sem palavras", "O mundo está louco".
- O TEXTO DEVE COMEÇAR COM UM FATO FRIO: (Ex: "Na tarde de ontem...", "Um documento secreto revelou...", "Engenheiros alemães construíram...").

### ARQUITETURA FACT-CHAIN (MÍNIMO 350 PALAVRAS):
1. O IMPACTO TÉCNICO: Comece direto no fato. O que foi descoberto e onde?
2. A GÊNESE: Como isso começou? Quem é o responsável?
3. O DETALHAMENTO: Mergulhe nos dados, medidas e nas curiosidades profundas.
4. A REPERCUSSÃO: O que os especialistas ou a vizinhança dizem?
5. O MISTÉRIO ADICIONAL: Um detalhe que ninguém percebeu até agora.
6. A CTA ESTRATÉGICA: Uma pergunta que force o leitor a dar um fato novo nos comentários.

### FORMATAÇÃO:
- Mínimo de 6 a 8 parágrafos.
- Espaçamento duplo (\n\n) OBRIGATÓRIO entre parágrafos.
- NUNCA use listas ou tópicos. Apenas prosa densa e envolvente.

FORMATO DE RESPOSTA (JSON):
{
  "tema": "Título do caso",
  "texto_principal": "História completa, longa e técnica (Mínimo 350 palavras)",
  "titulo_imagem": "Frase documental para a imagem"
}

Retorne SOMENTE JSON válido.`
      },
      {
        role: "user",
        content: `CRIE A INVESTIGAÇÃO DEFINITIVA:
Tema: ${tema}
Ângulo Chocante: ${angulo_chocante}
Dados Coletados: ${fatos_coletados || tema}

REQUISITO: Seja técnico, detalhista e diga o "Por que" de tudo antes de concluir.`
      }
    ]
  });

  return parseGroqResponse(response);
}

module.exports = { runWriter };
