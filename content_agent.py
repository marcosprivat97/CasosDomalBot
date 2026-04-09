import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class ContentAgent:
    def __init__(self):
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"

    def generate_debate_content(self, noticia_texto, fonte="G1"):
        """
        Gera o conteúdo de debate polêmico baseado na notícia.
        """
        prompt = f"""
        Você é o principal roteirista da página "Casos Domal" (um exato clone nerd/curiosidades da "Fatos Desconhecidos").
        Sua missão é transformar a notícia abaixo num post de CURIOSIDADE FASCINANTE e MISTÉRIO.

        NOTÍCIA BASE: {noticia_texto}

        REGRAS DE OURO ("Estilo Fatos Desconhecidos Pura Curiosidade"):
        1. TEXTO DA IMAGEM (legenda_topo): Um resumo de 15 a 25 palavras que descreva o fato como algo incrivelmente raro, misterioso ou fascinante. Seja informativo e intrigante. Ex: "Cientistas conseguiram reverter o envelhecimento de ratos de laboratório usando..."
        2. LEGENDA DO FACEBOOK (legenda_completa):
           - Histórias e Fatos: 3 parágrafos focando em como esse fato é fascinante ou misterioso. Conte como se fosse um mini-documentário descobrindo algo escondido da humanidade.
           - Sem Politização/Debate: Nada de incentivar tretas. Queremos que as pessoas digam "Wow, que incrível!".
           - Encerramento: Finalize com uma frase reflexiva ou uma pergunta cósmica sobre o futuro ou sobre a descoberta.
           - Formatação: Sem emojis. Tom puramente curioso e magistral.

        EXTREMO AVISO: Trate todas as notícias sob a lente do "FATO DESCONHECIDO". Desapegue do lado jornalístico "chato".

        RETORNO: Apenas JSON válido garantindo a estrutura exata abaixo.
        {{
          "legenda_topo": "Texto curto descrevendo o assombro da curiosidade...",
          "legenda_completa": "A história completa e fascinante para a legenda...",
          "hashtags": ["#Curiosidade", "#CasosDomal", "#Descoberta"],
          "imagem_1_busca": "Termo de busca para a internet (ex: Foto de um Jacaré)",
          "imagem_2_busca": "Termo de busca para a internet do 2o elemento (ex: Foto de uma Universidade ou Floresta)"
        }}
        """

        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

        data = {
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "system", "content": prompt}],
            "temperature": 0.7,
            "response_format": {"type": "json_object"}
        }

        import time as _time
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = requests.post(self.api_url, headers=headers, json=data, timeout=30)
                response.raise_for_status()
                return response.json()["choices"][0]["message"]["content"]
            except Exception as e:
                if "429" in str(e) and attempt < max_retries - 1:
                    wait = 30 * (attempt + 1)
                    print(f"[ContentAgent] Rate limit! Esperando {wait}s antes de tentar novamente ({attempt+1}/{max_retries})...")
                    _time.sleep(wait)
                else:
                    print(f"Erro no ContentAgent: {e}")
                    return None

if __name__ == "__main__":
    agent = ContentAgent()
    res = agent.generate_debate_content("Preço do aluguel no Rio de Janeiro sobe 20% em um ano e assusta moradores.")
    print(res)
