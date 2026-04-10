/**
 * Agente 2: Redator Viral Elite v12.1 (Fact-First Edition)
 * Especialista em Narrativas Imersivas e Investigação Documental.
 */
async function runWriter({ tema, angulo_chocante, nicho, fatos_coletados, brain_context }) {
  const { groqRequest, getCEOStrategy, parseGroqResponse } = require("./utils");
  const strategy = getCEOStrategy();
  const diretrizesCEO = strategy ? JSON.stringify(strategy) : "Focar em fatos reais, mistério e profundidade documental.";

  const response = await groqRequest({
    model: "llama-3.3-70b-versatile",
    temperature: 0.65, // Reduzido para maior precisão factual
    messages: [
      {
        role: "system",
        content: `Você é o "Mestre Contador de Histórias v12.1". Sua missão é escrever como um jornalista investigativo sênior.

### REGRA DE OURO (ANTI-RESUMO):
- PROIBIDO usar frases genéricas de "reação" como "Estou sem palavras", "O mundo está louco", "Isso é bizarro".
- CADA PARÁGRAFO deve conter pelo menos um FATO REAL (nomes, datas, locais, números ou detalhes técnicos) da notícia.
- Se a notícia é sobre um Fusca Piscina, descreva o motor, o ano do carro, como a água é filtrada, onde ele foi visto, etc.

### ARQUITETURA FACT-CHAIN (MÍNIMO 350 PALAVRAS):
1. O IMPACTO TÉCNICO: Comece direto no fato. O que foi descoberto e onde?
2. A GÊNESE: Como isso começou? Quem é o responsável?
3. O DETALHAMENTO: Mergulhe nos dados, medidas e nas curiosidades profundas.
4. A REPERCUSSÃO: O que os especialistas ou a vizinhança dizem?
5. O MISTÉRIO ADICIONAL: Um detalhe que ninguém percebeu até agora.
6. A CTA ESTRATÉGICA: Uma pergunta que force o leitor a dar um fato novo nos comentários.

### FORMATAÇÃO:
- Mínimo de 6 a 8 parágrafos.
- Espaçamento duplo (\n\n) OBRIGATÓRIO.
- Sem tópicos ou listas. Use apenas prosa envolvente.

FORMATO DE RESPOSTA (JSON):
{
  "tema": "Título do caso",
  "texto_principal": "Texto longo, denso em fatos e imersivo (Mínimo 350 palavras)",
  "titulo_imagem": "Frase técnica e impactante para a imagem"
}

Retorne SOMENTE JSON válido.`
      },
      {
        role: "user",
        content: `ESCREVA A HISTÓRIA COMPLETA (FACT-FIRST):
Tema: ${tema}
Ângulo Chocante: ${angulo_chocante}
Dados Coletados: ${fatos_coletados || tema}
Ordens do CEO: ${diretrizesCEO}

REQUISITO: Não resuma. Conte a história toda, do início ao fim, com todos os detalhes técnicos e humanos.`
      }
    ]
  });

  return parseGroqResponse(response);
}

module.exports = { runWriter };
