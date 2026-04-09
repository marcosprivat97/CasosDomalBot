const { groqRequest, parseGroqResponse } = require("./utils");
const logger = require("../logger");
const fs = require("fs");
const path = require("path");

async function runGateKeeper({ texto, descricao_imagem, tema, link }) {
  // Verificar histórico — nunca repetir
  const historyPath = path.join(__dirname, "../../data/history.json");
  
  // Garantir que a pasta data existe
  if (!fs.existsSync(path.dirname(historyPath))) {
      fs.mkdirSync(path.dirname(historyPath), { recursive: true });
  }

  const history = fs.existsSync(historyPath)
    ? JSON.parse(fs.readFileSync(historyPath, "utf-8"))
    : [];

  // Se o link já foi postado, descartamos imediatamente
  if (link && history.includes(link)) {
    return { aprovado: false, decisao: "DESCARTAR", justificativa: "Conteúdo já postado anteriormente." };
  }

  const response = await groqRequest({
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: `Você é o Editor-Chefe do portal "Casos Domal" — o maior portal de curiosidades, mistérios e fatos desconhecidos. Sua missão é ser o clone perfeito do editor da "Fatos Desconhecidos".

Sua função é a etapa final de aprovação. Você analisa o post COMPLETO (texto de legenda + descrição da imagem) e decide: POSTAR ou REESCREVER.

CRITÉRIOS DE APROVAÇÃO:

CONTEÚDO (VIRAL/MISTÉRIO/CIÊNCIA):
[ ] A história é 100% REAL? (Não aprove fakes óbvios).
[ ] O post tem um "gancho de curiosidade" impossível de ignorar?
[ ] O texto é longo, profundo e envolvente (estilo mini-documentário)?
[ ] A conclusão estimula o debate e os comentários? (Calls-to-action poderosos).

VISUAL (CASOS DOMAL CARD):
[ ] A imagem descrita é impactante, misteriosa ou cinematográfica?
[ ] A manchete na imagem é longa, polêmica e instigante?
[ ] O visual está alinhado com o nicho (Mistério, Descoberta, Alerta)?

SEGURANÇA E MARCA:
[ ] Respeita o tom de voz "Casos Domal" (sarcástico, revelador e provocador)?
[ ] Não repete temas postados recentemente?

SCORE FINAL (0-100):
- 75-100: POSTAR (Viral imediato)
- 55-74: REESCREVER (Ajustar ângulo viral ou profundidade)
- Abaixo de 55: DESCARTAR (Tema monótono ou visual sem sentido)

Retorne SOMENTE JSON válido:
{
  "aprovado": true ou false,
  "score_final": número,
  "problemas_encontrados": ["problema 1"],
  "sugestoes_melhoria": ["melhoria 1"],
  "decisao": "POSTAR / REESCREVER / DESCARTAR",
  "justificativa": "motivo em 1 frase"
}`
      },
      {
        role: "user",
        content: `Avalie este post completo:

TEMA: ${tema}

TEXTO DO POST:
${texto}

DESCRIÇÃO DA IMAGEM:
${descricao_imagem}

Responda SOMENTE com o JSON.`
      }
    ]
  });

  const json = parseGroqResponse(response);

  // Se aprovado, salvar no histórico
  if (json.aprovado && link) {
    if (!history.includes(link)) {
        history.push(link);
        fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    }
  }

  return json;
}

module.exports = { runGateKeeper };
