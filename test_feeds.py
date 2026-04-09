import feedparser

feeds = {
    "MegaCurioso": "https://megacurioso.com.br/rss",
    "Super Interessante": "https://super.abril.com.br/feed/",
    "HypeScience": "https://hypescience.com/feed/",
    "CanalTech Ciencia": "https://canaltech.com.br/rss/ciencia/",
    "BBC Ciencia PT": "https://www.bbc.com/portuguese/topics/c404v027pd4t/rss.xml",
    "G1 Ciencia": "https://g1.globo.com/rss/g1/ciencia-e-saude/",
    "R7 Hora7": "https://noticias.r7.com/hora-7/feed.xml",
}

for name, url in feeds.items():
    try:
        f = feedparser.parse(url)
        count = len(f.entries)
        title = f.entries[0].title if f.entries else "VAZIO"
        print(f"[{name}] {count} artigos -> Ex: {title}")
    except Exception as e:
        print(f"[{name}] ERRO: {e}")
