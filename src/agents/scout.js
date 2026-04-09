const { groqRequest, getCEOStrategy, parseGroqResponse } = require("./utils");
const logger = require("../logger");

/**
 * Agente 1 — Caçador de Curiosidades e Fatos Desconhecidos.
 * Especialista em encontrar e pontuar temas reais com alto potencial de engajamento.
 */
async function runScout({ titulo, fonte, shares, categoria, ultimo_tema, brain_context }) {
  const strategy = getCEOStrategy();
  const diretrizesCEO = strategy ? JSON.stringify(strategy) : "Focar em mistérios, ciência, história e futilidades polêmicas.";

  const response = await groqRequest({
    model: "llama-3.3-70b-versatile",
    temperature: 0.5,
    messages: [
      {
        role: "system",
        content: `Sua missão é identificar temas que vão EXPLODIR em compartilhamentos no Facebook Brasil. O seu público são brasileiros de 25-55 anos que adoram mistérios locais, lendas urbanas e HUMOR BIZARRO (coisas que só brasileiro faz).

CATEGORIAS MESTRE (DNA Brasil):
1. BRASIL MISTERIOSO (40%): Casos de OVNIs, cidades perdidas na Amazônia, arquivos militares secretos do Brasil.
2. HUMOR BIZARRO / SÓ NO BRASIL (40%): "O brasileiro precisa ser estudado pela NASA". Gambiarras surreais, flagras absurdos, situações cômicas que parecem mentira.
3. ALERTA / CURIOSIDADE NACIONAL (20%): Fatos chocantes sobre o nosso dia a dia, animais estranhos e descobertas arqueológicas no BR.

TOM DE VOZ:
- Misture o Mistério com o Humor Brasileiro.
- Use frases como "Não é possível que isso é real", "O dono do Brasil é o brasileiro".
- O tema deve ser regionalizado e gerar aquele riso de "Onde a gente vive?".
- Gere curiosidade extrema com uma pitada de deboche.
`
      },
      {
        role: "user",
        content: `Avalie este tema capturado dos portais de notícias:

TÍTULO DA NOTÍCIA: ${titulo}
PORTAL DE ORIGEM: ${fonte}
COMPARTILHAMENTOS ESTIMADOS: ${shares}
CATEGORIA: ${categoria}

CONTEXTO ADICIONAL:
- Público da página: brasileiros de 25 a 45 anos
- Nicho da página: curiosidades virais, ciência, mistérios, história
- Seguidores atuais: 21.000
- Último tema postado: ${ultimo_tema}

DIRETRIZES ATUAIS DO CEO: ${diretrizesCEO}

Avalie o potencial viral deste tema para esta página específica.
Responda SOMENTE com o JSON especificado no system prompt.`
      }
    ]
  });

  return parseGroqResponse(response);
}

module.exports = { runScout };
