import os
import time
import json
import pandas as pd
import argparse
import requests
from scraper import Scraper
from content_agent import ContentAgent
from image_engine import ImageEngine
from facebook_api import FacebookAPI
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Configurações de Memória (Evitar Repetição)
HISTORY_FILE = "history_python.json"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def load_history():
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
                return data if isinstance(data, list) else []
            except:
                return []
    return []

def save_history(link, title=""):
    history = load_history()
    history.append({"link": link, "title": title})
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history[-300:], f, ensure_ascii=False, indent=2)

def ai_pick_best_news(available_news, recent_history_titles):
    """
    USA A IA PARA ESCOLHER A NOTÍCIA MAIS POLÊMICA DO MOMENTO.
    ISSO GARANTE AUTONOMIA TOTAL E ALTA VIRALIDADE.
    """
    if not available_news:
        return None
        
    titles = [f"[{i}] {n['titulo']} ({n['fonte']})" for i, n in enumerate(available_news)]
    list_str = "\n".join(titles)
    
    past_topics = ", ".join(recent_history_titles[-15:]) if recent_history_titles else "Nenhum ainda."
    
    prompt = f"""
    Você é o editor-chefe da página "Casos Domal" — um clone perfeito da "Fatos Desconhecidos".
    
    SEU INSTINTO: Escolher a notícia que faria uma pessoa parar de rolar o feed e pensar "QUE LOUCURA, não sabia disso!"
    
    TEMAS QUE VIRALIZAM (priorize nesta ordem):
    1. ESPAÇO E UNIVERSO: missões espaciais, planetas, vida alienígena, buracos negros
    2. MISTÉRIOS E BIZARRICES: fenômenos inexplicáveis, descobertas estranhas, coincidências insanas  
    3. CIÊNCIA CHOCANTE: avanços médicos absurdos, tecnologia do futuro, experimentos malucos
    4. NATUREZA EXTREMA: animais bizarros, recordes naturais, catástrofes surreais
    5. HISTÓRIA OCULTA: segredos históricos, civilizações perdidas, fatos que ninguém conta
    
    DESCARTE IMEDIATAMENTE:
    - Eventos locais sem graça (feira, show, reunião)
    - Política partidária, economia, PIB, inflação
    - Saúde rotineira (vacinação, campanha, prevenção genérica)
    - Esportes comuns
    
    MEMÓRIA (já postamos isso, NÃO repita): {past_topics}

    NOTÍCIAS DISPONÍVEIS:
    {list_str}
    
    Responda APENAS com o número da notícia mais FASCINANTE. Ex: 5
    """
    
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
    data = {
        "model": "llama-3.1-8b-instant", # Modelo rápido para escolha
        "messages": [{"role": "system", "content": prompt}],
        "temperature": 0.3
    }
    
    try:
        response = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=data, timeout=15)
        choice_idx = int(response.json()["choices"][0]["message"]["content"].strip())
        return available_news[choice_idx]
    except:
        return available_news[0] # Fallback para a primeira

def orchestrate_post(news_item, mode="AI"):
    print(f"[CASOS DOMAL] Processando: {news_item['titulo']}")
    
    agent = ContentAgent()
    if mode == "AI":
        res_raw = agent.generate_debate_content(news_item['titulo'], news_item.get('fonte', 'RSS'))
        res = json.loads(res_raw)
    else:
        res = {
            "legenda_topo": news_item['LegendaTopoFoto'],
            "legenda_completa": news_item['LegendaCompleta'],
            "hashtags": news_item['Hashtags'].split(',')
        }

    engine = ImageEngine()
    scraper = Scraper()
    img_urls = []

    # O Novo Cérebro de Montagem Dupla do Bot
    img1_query = res.get('imagem_1_busca')
    img2_query = res.get('imagem_2_busca')

    if img1_query and img2_query:
        print(f"[CASOS DOMAL] Montagem Dupla Ativada. Buscando: '{img1_query}' e '{img2_query}'")
        img1 = scraper.search_image_on_web(img1_query)
        img2 = scraper.search_image_on_web(img2_query)
        if img1: img_urls.append(img1)
        if img2: img_urls.append(img2)

    # Fallback caso a montagem falhe:
    if not img_urls:
        base_image = news_item.get('imagem')
        if not base_image:
            print("[CASOS DOMAL] Notícia original sem foto. Acionando a caça na internet pesada...")
            base_image = scraper.search_image_on_web(news_item['titulo'])
        
        if base_image:
            img_urls = [base_image]
        else:
            img_urls = ["https://via.placeholder.com/1080x1080/220000/FFFFFF?text=CASOS+DOMAL"]

    image_path = engine.create_collage(img_urls, res['legenda_topo'], fallback_url=news_item.get('imagem'))

    fb = FacebookAPI()
    caption_final = f"{res['legenda_completa']}\n\n{' '.join(res['hashtags'])}"
    
    post_id = fb.post_image(image_path, caption_final)
    
    if post_id and news_item.get('link'):
        save_history(news_item['link'], news_item.get('titulo', ''))
    
    return post_id

def main():
    parser = argparse.ArgumentParser(description="Casos Domal - Bot de Debates Políticos")
    parser.add_argument("--test-csv", action="store_true", help="Testa usando o arquivo noticias.csv")
    parser.add_argument("--once", action="store_true", help="Executa apenas um ciclo de RSS e para")
    args = parser.parse_args()

    if args.test_csv:
        df = pd.read_csv("noticias.csv")
        for _, row in df.iterrows():
            orchestrate_post(row.to_dict(), mode="CSV")
            time.sleep(5)
        return

    scraper = Scraper()
    print("[CASOS DOMAL] BOT LIGADO. OPERACAO 100% AUTONOMA INICIADA.")
    print("O robo vai escolher, criar e postar sozinho a cada 1 hora.")

    while True:
        try:
            history = load_history()
            history_links = [item.get('link', item) if isinstance(item, dict) else item for item in history]
            recent_news = scraper.get_latest_news(limit=15) # Pega mais para a IA escolher
            
            available_news = [n for n in recent_news if n['link'] not in history_links]

            if available_news:
                # Extrai os titulos do historico para passar pra IA nao repetir assunto
                recent_history_titles = [item.get('title', item.get('link', '')) for item in history if isinstance(item, dict)]
                
                # A IA AGORA ESCOLHE O MELHOR TEMA SOZINHA COM BASE NISSO
                next_news = ai_pick_best_news(available_news, recent_history_titles)
                orchestrate_post(next_news, mode="AI")
                
                print(f"Postagem realizada em {datetime.now().strftime('%H:%M:%S')}")
                print("Dormindo por 1 hora. Nao precisa fazer nada...")
                time.sleep(3600) 
            else:
                print("Nenhuma novidade no G1/UOL agora. Tentando de novo em 15 min...")
                time.sleep(900)

        except Exception as e:
            print(f"[ERRO] {e}. Reiniciando em 5 min...")
            time.sleep(300)

if __name__ == "__main__":
    main()
