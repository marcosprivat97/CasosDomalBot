import feedparser
import requests
from bs4 import BeautifulSoup
import os

class Scraper:
    def __init__(self):
        self.sources = {
            "SUPER INTERESSANTE": "https://super.abril.com.br/feed/",
            "CANALTECH CIENCIA": "https://canaltech.com.br/rss/ciencia/",
            "G1 CIENCIA": "https://g1.globo.com/rss/g1/ciencia-e-saude/",
            "CANALTECH CURIOSIDADES": "https://canaltech.com.br/rss/curiosidades/",
        }

    def get_latest_news(self, limit=10):
        """
        Coleta as últimas notícias dos feeds RSS.
        """
        all_news = []
        for source_name, url in self.sources.items():
            print(f"[RSS] Varrendo {source_name}...")
            feed = feedparser.parse(url)
            for entry in feed.entries[:limit]:
                news_item = {
                    "titulo": entry.title,
                    "link": entry.link,
                    "resumo": getattr(entry, "summary", ""),
                    "fonte": source_name,
                    "imagem": self._extract_og_image(entry.link)
                }
                all_news.append(news_item)
        return all_news

    def _extract_og_image(self, url):
        """
        Tenta extrair a imagem principal da notícia via Open Graph.
        """
        try:
            headers = {'User-Agent': 'Mozilla/5.0'}
            response = requests.get(url, headers=headers, timeout=10)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Procura og:image
            og_image = soup.find("meta", property="og:image")
            if og_image:
                return og_image["content"]
            
            # Fallback para twitter:image
            tw_image = soup.find("meta", name="twitter:image")
            if tw_image:
                return tw_image["content"]
                
            return None
        except:
            return None

    def search_image_on_web(self, query):
        """
        Caso a notícia venha sem imagem (apenas vídeo), o robô atua buscando
        uma foto de alta qualidade na internet para ilustrar o debate!
        """
        try:
            from duckduckgo_search import DDGS
            print(f"[SCRAPER] Caçando imagem na internet para: {query}")
            with DDGS() as ddgs:
                results = list(ddgs.images(query, max_results=5))
                # Tenta cada resultado até achar um que baixe de verdade
                for r in results:
                    img_url = r.get('image', '')
                    try:
                        resp = requests.get(img_url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
                        if resp.status_code == 200 and len(resp.content) > 1000:
                            print(f"[SCRAPER] Imagem validada: {img_url[:80]}")
                            return img_url
                    except:
                        continue
                print("[SCRAPER] Nenhuma imagem válida encontrada no DuckDuckGo.")
        except Exception as e:
            print(f"[SCRAPER] DuckDuckGo falhou ({e}). Tentando Wikimedia Commons...")
            try:
                import urllib.parse
                clean_q = urllib.parse.quote(query)
                w_url = f"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch={clean_q}&gsrnamespace=6&gsrlimit=3&prop=imageinfo&iiprop=url&format=json"
                headers = {'User-Agent': 'Mozilla/5.0'}
                resp = requests.get(w_url, headers=headers, timeout=10).json()
                pages = resp.get('query', {}).get('pages', {})
                for page_id in pages:
                    try:
                        wiki_url = pages[page_id]['imageinfo'][0]['url']
                        # Valida se é uma imagem real
                        check = requests.get(wiki_url, headers=headers, timeout=10)
                        if check.status_code == 200 and len(check.content) > 1000:
                            print(f"[SCRAPER] Imagem Wiki validada: {wiki_url[:80]}")
                            return wiki_url
                    except:
                        continue
            except Exception as e2:
                print(f"[SCRAPER] Falha total ao buscar imagem: {e2}")
        return None

if __name__ == "__main__":
    s = Scraper()
    news = s.get_latest_news(limit=1)
    print(news)
