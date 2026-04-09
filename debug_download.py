import requests
from PIL import Image
from io import BytesIO

# Testar com URLs que sabemos que funcionam (imagens diretas publicas)
test_urls = [
    "https://cdn.pixabay.com/photo/2017/01/06/17/56/caiman-1959519_640.jpg",
    "https://cdn.pixabay.com/photo/2016/11/29/05/45/astronomy-1867616_640.jpg",
    "https://cdn.pixabay.com/photo/2016/03/09/09/22/campus-1245480_640.jpg",
]

headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0"}

for url in test_urls:
    try:
        r = requests.get(url, headers=headers, timeout=15)
        print(f"URL: {url}")
        print(f"  Status: {r.status_code} | Content-Type: {r.headers.get('Content-Type','?')} | Size: {len(r.content)}")
        img = Image.open(BytesIO(r.content))
        print(f"  SUCESSO! Dimensoes: {img.size}")
    except Exception as e:
        print(f"  FALHA: {e}")
    print()
