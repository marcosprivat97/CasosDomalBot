from image_engine import ImageEngine
import time, os

engine = ImageEngine()

# Simular: as buscas web falharam, o fallback da noticia vai salvar
img_urls_que_vao_falhar = [
    "https://url-invalida-simulada.com/imagem-fake.jpg",
    "https://outra-url-invalida.com/foto-fake.jpg"
]

# URL REAL da noticia do G1 (fallback garantido)
fallback = "https://s2-g1.glbimg.com/WDT88bFw_xkzQLjOqyWoPJAyitQ=/1280x0/filters:format(jpeg)/https://i.s3.glbimg.com/v1/AUTH_59edd422c0c84a879bd37670ae4f538a/internal_photos/bs/2017/s/H/VG9gd7T0Kg1IyVMWLJqw/24251090-1692638140806901-584525213-o.jpg"

name = f"post_final_visual_{int(time.time())}.jpg"
print(f"[DEMO] Criando arte com fallback ativo -> {name}")
result = engine.create_collage(img_urls_que_vao_falhar, "Batalha de Rimas invade o Mercado Central de Macapa", fallback_url=fallback)
os.replace(result, name)
print(f"[DEMO] SUCESSO: {name}")
