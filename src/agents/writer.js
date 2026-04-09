const { groqRequest, getCEOStrategy, parseGroqResponse } = require("./utils");
const logger = require("../logger");

/**
 * Agente 1 — Caçador de Tendências (Scout)
 * Especialista em encontrar mistérios internacionais e fatos virais inéditos.
 */
async function runScout({ titulo, fonte, shares, categoria, ultimo_tema, brain_context }) {
  const strategy = getCEOStrategy();
  const diretrizesCEO = strategy ? JSON.stringify(strategy) : "Focar em mistérios mundiais, ciência proibida e fatos gringos inéditos.";

  const response = await groqRequest({
    model: "llama-3.3-70b-versatile",
    temperature: 0.5,
    messages: [
      {
        role: "system",
        content: `Você é o "Caçador Global" da Casos Domal. CATEGORIAS MESTRE (DNA Brasil):
1. BRASIL MISTERIOSO (40%): Casos reais de OVNIs, cidades perdidas na Amazônia, arquivos secretos militares BR.
2. SÓ ACONTECE NO BRASIL / HUMOR (40%): "O Brasileiro precisa ser estudado pela NASA". Gambiarras surreais, flagras absurdos de rua, situações de humor bizarro que parecem mentira mas são reais.
3. ALERTA / CURIOSIDADE HUMANA (20%): Fatos chocantes sobre o cotidiano, avisos bizarros e descobertas arqueológicas nacionais.

TOM DE VOZ:
- Misture o Mistério com o Humor Brasileiro.
- Use frases como "Não é possível que isso é real", "O dono do Brasil é o brasileiro".
- O tema deve ser regionalizado e gerar aquele riso de "Onde a gente vive?".
- Gere curiosidade extrema com uma pitada de deboche.
2. MANCHETE LONGA E POLÊMICA (CRÍTICO): Diferente de outros portais, sua manchete na foto deve ser uma frase completa, descritiva e altamente instigante. 
   - Ruim: "ESTUDANTES CRIARAM ROBÔ"
   - Bom (Fatos Style): "ESTUDANTES BRASILEIROS CRIAM ROBÔ ANTIDRONE PARA A GUERRA E O MUNDO ESTÁ EM ALERTA"
3. INVESTIGAÇÃO DRAMÁTICA: O texto deve parecer uma revelação de um segredo guardado a sete chaves.`
      },
      {
        role: "user",
        content: `Analise o cenário atual e sugira um novo tema viral baseado em fontes internacionais.
        
        Último tema abordado: ${ultimo_tema}
        Diretrizes do CEO: ${diretrizesCEO}
        
        - Gere curiosidade extrema sem ser clickbait barato.

RESPOSTA OBRIGATÓRIA:
Retorne APENAS um objeto JSON válido no formato abaixo, sem nenhum texto antes ou depois:
{
  "tema": "nome do caso/tema",
  "pilar": "Mistério / Alerta / Interação",
  "score_viral": 0-100,
  "nicho": "string",
  "angulo_chocante": "o ponto central polêmico",
  "titulo_sugerido_foto": "MANCHETE EM CAIXA ALTA",
  "query_rara": "termo em inglês para busca de imagem real"
}`
      }
    ]
  });
  return parseGroqResponse(response);
}

/**
 * Agente 2 — Redator Viral Sênior
 * Especialista em transformar fatos brutos em narrativas magnéticas e humanas.
 */
async function runWriter({ tema, angulo_chocante, tipo_lista, nicho, emocao_alvo, fatos_coletados, criticas_redator, brain_context, modo_curto = false }) {
  const strategy = getCEOStrategy();
  
  const response = await groqRequest({
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content: `Você é o "Investigador das Sombras" da Casos Domal. Sua missão é transformar fatos brutos em narrativas viciantes que o brasileiro médio sinta vontade de compartilhar IMEDIATAMENTE no grupo da família.

PERSONA:
Você é aquele narrador de mistérios que não perde a piada. Seu tom é conspiratório, mas com o humor ácido do brasileiro. Trata o leitor como um "brother" que está vendo um absurdo junto com você.

ESTILO DE ESCRITA (Padrão WhatsApp Viral + Humor):
1. QUEBRA DE TEXTO: Parágrafos curtos (2-3 frases).
2. ESPAÇAMENTO: Use sempre DUAS QUEBRAS DE LINHA (\n\n) entre parágrafos.
3. EMOJIS ESTRATÉGICOS: Misture mistério (😱, 🕵️‍♂️) com humor (😂, 🤡, 🚩) dependendo da pauta.
4. TONE DE VOZ: Use o PT-BR de internet. "Gente, eu tô sem palavras...", "O brasileiro realmente não tem limites", "É cada uma que me aparece...".
5. GANCHO: A primeira frase deve ser um choque de humor ou bizarria.

REGRAS DE OURO:
- A ÚLTIMA FRASE deve ser uma pergunta que force o debate ou a risada.
- Foco em Humor Bizarro Brasileiro e Mistérios Inexplicáveis.
- Use CAIXA ALTA para ênfase cômica (ex: RIREI, SURREAL, ABSURDO).

RESPOSTA OBRIGATÓRIA:
Retorne APENAS um objeto JSON válido, sem texto explicativo. Use \n para quebras de linha.
{
  "gancho": "...",
  "texto_principal": "...",
  "lista": ["...", "...", "...", "...", "..."],
  "fechamento": "...",
  "hashtags": ["...", "..."],
  "titulo_imagem": "...",
  "subtitulo_imagem": "...",
  "score_texto": 98,
  "post_completo": "..."
}`
      },
      {
        role: "user",
        content: `Crie o post viral completo sobre este tema aprovado.
TEMA: ${tema}

CRÍTICAS DO ÚLTIMO POST (aplique as correções):
${criticas_redator || "Nenhuma"}

Lembre-se: TEM QUE SER UM JSON VÁLIDO. Use \\n para pular linha. Nenhuma quebra física de linha nos textos!

FATOS E DADOS:
${fatos_coletados}`
      }
    ]
  });
  return parseGroqResponse(response);
}

module.exports = { runWriter };
