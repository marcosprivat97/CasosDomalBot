/**
 * Agente 2: Redator Viral Elite v12.0
 * Especialista em Storytelling de Alta Retenção e Hipnose por Texto.
 */
async function runWriter({ tema, angulo_chocante, nicho, fatos_coletados, criticas_redator, brain_context }) {
  const strategy = getCEOStrategy();
  const diretrizesCEO = strategy ? JSON.stringify(strategy) : "Focar em histórias emocionantes e reviravoltas chocantes.";

  const response = await groqRequest({
    model: "llama-3.3-70b-versatile",
    temperature: 0.75, // Ideal para criatividade narrativa
    messages: [
      {
        role: "system",
        content: `Você é o "Escritor Mestre v12.0" da Casos Domal. Sua missão é criar textos que "hipnotizam" o leitor e forçam o compartilhamento.

### ARQUITETURA DE RETENÇÃO (MÍNIMO 6 PARÁGRAFOS):
1. O GANCHO (Parágrafo 1): Uma afirmação impossível ou pergunta que "golpeia" a mente do leitor.
2. O CENÁRIO (Parágrafo 2): Construa a ponte emocional. Onde isso aconteceu? Como era a vida antes do fato?
3. O INCIDENTE (Parágrafo 3): O início do mistério ou evento bizarro.
4. A EXPLICAÇÃO/DETALHE (Parágrafo 4): Mergulhe na riqueza de detalhes. Não economize na curiosidade.
5. A REVIRAVOLTA/MORAL (Parágrafo 5): O momento "Uau". O que ninguém esperava que aconteceu.
6. A CTA VIVA (Parágrafo 6): Uma pergunta aberta que obrigue o leitor a dar a opinião nos comentários.

### REGRAS DE OURO:
- JAMAIS comece com "Gente...", "Você sabia?" ou clichês de IA.
- TEMA: Fatos reais, humor bizarro brasileiro ou mistérios mundiais.
- FORMATO: Duas quebras de linha (\n\n) entre parágrafos.

Retorne SOMENTE JSON válido.`
      },
      {
        role: "user",
        content: `CRIE A NARRATIVA DEFINITIVA:
Tema: ${tema}
Ângulo Chocante: ${angulo_chocante}
Histórico (Anti-Repetição): ${brain_context}
Ordens do CEO: ${diretrizesCEO}

REQUISITO ESPECIAL:
- O texto final deve ter no mínimo 6 parágrafos distintos.
- A voz deve ser a de um contador de histórias sênior que está revelando um segredo incrível.

Responda APENAS o JSON.`
      }
    ]
  });

  return parseGroqResponse(response);
}

module.exports = { runWriter };{criticas_redator || "Nenhuma"}`
      }
    ]
  });
  return parseGroqResponse(response);
}

module.exports = { runWriter };
