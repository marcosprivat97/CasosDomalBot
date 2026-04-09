const { Groq } = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function runSchedulerAgent({ posts_hoje, ultimo_post_horario }) {
  const agora = new Date().toLocaleTimeString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit' });

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: `Você é o Estrategista de Tráfego da Casos Domal. Sua missão é garantir que a página poste APENAS nos "Horários de Ouro" para maximizar o alcance orgânico.

JANELAS DE POSTAGEM (Horário de Brasília):
1. MANHÃ (Pilar Curiosidade): 08:30 - 09:00
2. ALMOÇO (Pilar Mistério): 12:15 - 13:00
3. TARDE (Pilar Alerta/Bizarro): 18:30 - 19:15
4. NOITE (Pilar História/Interação): 21:30 - 22:15

REGRAS:
- Se a hora atual estiver fora dessas janelas, "pode_postar_agora" deve ser FALSE.
- Nunca postar se o intervalo do último post for menor que 3 horas.
- Máximo de 4 posts por dia.

Retorne EM JSON VALID:
{
  "pode_postar_agora": true ou false,
  "janela_alvo": "Manhã/Almoço/Tarde/Noite",
  "motivo": "por que este horário",
  "minutos_para_aguardar": número,
  "alerta": "algum aviso importante ou null"
}`
      },
      {
        role: "user",
        content: `Analise o momento atual para postagem:
Agora são: ${agora}
Posts realizados hoje: ${posts_hoje}
Horário do último post: ${ultimo_post_horario || 'Nunca postado hoje'}

Decida se devemos postar agora ou aguardar.`
      }
    ]
  });

  const raw = response.choices[0].message.content.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : raw);
}

module.exports = { runSchedulerAgent };
