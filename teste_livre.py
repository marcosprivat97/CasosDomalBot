import sys, json, os, time
from scraper import Scraper
from content_agent import ContentAgent
from image_engine import ImageEngine
from main import ai_pick_best_news

print("[TESTE] Buscando noticias...")
scraper = Scraper()
news = scraper.get_latest_news(limit=5)

# Filtra apenas noticias que JA TEM imagem (pra garantir o teste visual)
news_com_foto = [n for n in news if n.get('imagem')]
print(f"[TESTE] {len(news_com_foto)} noticias com foto encontradas")

if not news_com_foto:
    print("Nenhuma noticia com foto!")
    sys.exit()

# Pega a primeira que tem foto
news_item = news_com_foto[0]
print(f"[TESTE] Noticia: {news_item['titulo']}")
print(f"[TESTE] Imagem: {news_item['imagem']}")

agent = ContentAgent()
print("[TESTE] Escrevendo roteiro...")
res_raw = agent.generate_debate_content(news_item['titulo'], news_item.get('fonte', 'RSS'))

if not res_raw:
    print("ERRO: API retornou vazio (rate limit). Tente novamente em 1 minuto.")
    sys.exit()

res = json.loads(res_raw)

print(f"\n=== LEGENDA DA FOTO ===")
print(res['legenda_topo'])
print(f"\n=== LEGENDA COMPLETA DO FACEBOOK ===")
print(res['legenda_completa'])
print(f"\n=== HASHTAGS ===")
print(res['hashtags'])

engine = ImageEngine()
img_urls = []

# Tenta montagem dupla se a IA sugeriu
img1_query = res.get('imagem_1_busca')
img2_query = res.get('imagem_2_busca')

if img1_query and img2_query:
    print(f"\n[TESTE] Montagem Dupla! Buscando: '{img1_query}' e '{img2_query}'")
    img1 = scraper.search_image_on_web(img1_query)
    img2 = scraper.search_image_on_web(img2_query)
    if img1: img_urls.append(img1)
    if img2: img_urls.append(img2)

# Fallback: usa a foto da propria noticia
if not img_urls:
    print("[TESTE] Usando foto original da noticia")
    img_urls = [news_item['imagem']]

unique_name = f"post_avaliacao_{int(time.time())}.jpg"
print(f"\n[TESTE] Gerando arte: {unique_name}")
image_path = engine.create_collage(img_urls, res['legenda_topo'], fallback_url=news_item.get('imagem'))
try:
    os.rename(image_path, unique_name)
except FileExistsError:
    os.replace(image_path, unique_name)
print(f"[TESTE] CONCLUIDO: {unique_name}")
