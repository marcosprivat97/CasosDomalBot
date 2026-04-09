from PIL import Image, ImageDraw, ImageFont, ImageFilter
import requests
from io import BytesIO
import os

class ImageEngine:
    def __init__(self, width=1080, height=1080): # 1:1 Ratio
        self.width = width
        self.height = height
        self.font_path = "C:/Windows/Fonts/arialbd.ttf"
        try:
            self.font_main = ImageFont.truetype(self.font_path, 50) # MAIOR visibilidade para o publico
            self.font_logo_bold = ImageFont.truetype(self.font_path, 35)
            self.font_logo_small = ImageFont.truetype(self.font_path, 18)
            self.font_icon = ImageFont.truetype(self.font_path, 25)
        except:
            self.font_main = ImageFont.load_default()
            self.font_logo_bold = ImageFont.load_default()
            self.font_logo_small = ImageFont.load_default()
            self.font_icon = ImageFont.load_default()

    def create_collage(self, img_urls, text_topo, fallback_url=None):
        """
        Cria a imagem final com layout Premium 'CASOS DOMAL'.
        fallback_url: URL garantida (og:image da noticia) caso as buscas falhem.
        """
        canvas = Image.new("RGB", (self.width, self.height), color=(0, 0, 0))
        
        # 1. DOWNLOAD E POSICIONAMENTO DAS IMAGENS
        imgs = []
        for url in img_urls[:2]:
            try:
                headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
                response = requests.get(url, headers=headers, timeout=15, allow_redirects=True)
                
                # Validação: só aceita se o servidor respondeu 200 e o conteúdo é grande o suficiente para ser uma imagem real
                if response.status_code != 200:
                    print(f"[IMAGEM] Servidor bloqueou (HTTP {response.status_code}): {url[:80]}")
                    continue
                if len(response.content) < 1000:
                    print(f"[IMAGEM] Conteúdo muito pequeno ({len(response.content)} bytes), não é imagem: {url[:80]}")
                    continue
                    
                img = Image.open(BytesIO(response.content)).convert("RGB")
                print(f"[IMAGEM OK] {img.size[0]}x{img.size[1]} baixada com sucesso")
                imgs.append(img)
            except Exception as e:
                print(f"[IMAGEM ERRO] Falha ao baixar {url[:80]}: {e}")
                continue

        # FALLBACK SUPREMO: Se nenhuma imagem baixou, usa a foto original da noticia
        if not imgs and fallback_url:
            print(f"[IMAGEM] Todas as buscas falharam! Usando foto original da noticia...")
            try:
                headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
                response = requests.get(fallback_url, headers=headers, timeout=15, allow_redirects=True)
                if response.status_code == 200 and len(response.content) > 1000:
                    img = Image.open(BytesIO(response.content)).convert("RGB")
                    print(f"[IMAGEM OK] Fallback funcional! {img.size[0]}x{img.size[1]}")
                    imgs.append(img)
            except Exception as e:
                print(f"[IMAGEM ERRO] Fallback tb falhou: {e}")

        if len(imgs) == 2:
            w_part = self.width // 2
            canvas.paste(self._resize_and_crop(imgs[0], w_part, self.height), (0, 0))
            canvas.paste(self._resize_and_crop(imgs[1], w_part, self.height), (w_part, 0))
        elif len(imgs) == 1:
            canvas.paste(self._resize_and_crop(imgs[0], self.width, self.height), (0, 0))
        else:
            # Fallback
            draw_grad = ImageDraw.Draw(canvas)
            draw_grad.rectangle([0, 0, self.width, self.height], fill=(20, 20, 20))

        # GRADIENTE PRETO NA PARTE INFERIOR (Estilo Fatos)
        # Cria uma camada com transparência para o gradiente
        overlay = Image.new('RGBA', (self.width, self.height), (0, 0, 0, 0))
        draw_ov = ImageDraw.Draw(overlay)
        
        grad_start_y = int(self.height * 0.4) # Começa o gradiente em 40% da imagem
        for y in range(grad_start_y, self.height):
            # Transição suave quadrática (cinematográfica), nunca totalmente chapado
            base_alpha = (y - grad_start_y) / (self.height - grad_start_y)
            alpha = int(240 * (base_alpha ** 1.5))
            draw_ov.line([(0, y), (self.width, y)], fill=(0, 0, 0, alpha))
            
        canvas = Image.alpha_composite(canvas.convert('RGBA'), overlay).convert('RGB')

        # 2. DESIGN OVERLAYS
        draw = ImageDraw.Draw(canvas)

        # B) TEXTO DE IMPACTO (INFERIOR - LIMPO)
        # O Fatos Desconhecidos NÃO usa UpperCase, usa sentence format
        text_height, padding_bottom = self._draw_rich_text(draw, text_topo)
        
        # A) LOGO PREMIUM (Acima do texto)
        self._draw_premium_logo(draw, text_height, padding_bottom)

        # Salvar
        output_path = "final_post.jpg"
        canvas.save(output_path, quality=95)
        return output_path

    def _draw_premium_logo(self, draw, text_height, padding_bottom):
        """Desenha a logo Casos Domal exatamente no estilo Fatos Desconhecidos, mas vermelha."""
        # A logo fica centralizada, log acima do bloco de texto
        logo_y = self.height - text_height - padding_bottom - 60
        
        # Ícone Vermelho
        icon_size = 35
        icon_x = self.width // 2 - 110
        # Fundo do icone
        draw.rectangle([icon_x, logo_y, icon_x + icon_size, logo_y + icon_size], fill=(220, 0, 0))
        # Letra do icone
        draw.text((icon_x + 10, logo_y + 2), "?", font=self.font_icon, fill=(255, 255, 255))
        
        # Texto CASOS
        draw.text((icon_x + 45, logo_y - 5), "CASOS", font=self.font_logo_bold, fill=(255, 255, 255))
        # Texto DOMAL (Menorzinho logo abaixo)
        draw.text((icon_x + 45, logo_y + 35), "D O M A L", font=self.font_logo_small, fill=(220, 0, 0))

    def _draw_rich_text(self, draw, text):
        """Desenha o texto branco, limpo e centralizado no estilo Fatos."""
        max_w = self.width - 180 # 900px wrap like the prototype
        lines = self._wrap_text(text, self.font_main, max_w)
        
        line_height = 55
        padding_bottom = 60
        total_text_height = len(lines) * line_height
        start_y = self.height - padding_bottom - total_text_height

        for line in lines:
            current_x = (self.width - draw.textlength(line, font=self.font_main)) // 2
            
            # Contorno (Stroke) Muito mais espesso
            offsets = [(-3,-3), (3,-3), (-3,3), (3,3), (0,4), (0,-4), (4,0), (-4,0), (-1,-4), (1,4), (-4,1), (4,-1)]
            for off in offsets:
                draw.text((current_x + off[0], start_y + off[1]), line, font=self.font_main, fill=(0,0,0))
            
            # Texto Branco limpo Principal
            draw.text((current_x, start_y), line, font=self.font_main, fill=(255, 255, 255))
            start_y += line_height
            
        return total_text_height, padding_bottom

    def _resize_and_crop(self, img, target_w, target_h):
        aspect = img.width / img.height
        target_aspect = target_w / target_h
        if aspect > target_aspect:
            img = img.resize((int(target_h * aspect), target_h), Image.LANCZOS)
            img = img.crop(((img.width - target_w) // 2, 0, (img.width + target_w) // 2, target_h))
        else:
            img = img.resize((target_w, int(target_w / aspect)), Image.LANCZOS)
            img = img.crop((0, (img.height - target_h) // 2, target_w, (img.height + target_h) // 2))
        return img

    def _wrap_text(self, text, font, max_width):
        words = text.split()
        lines, current_line = [], []
        draw = ImageDraw.Draw(Image.new("RGB", (1, 1)))
        for word in words:
            if draw.textlength(" ".join(current_line + [word]), font=font) <= max_width:
                current_line.append(word)
            else:
                lines.append(" ".join(current_line))
                current_line = [word]
        if current_line: lines.append(" ".join(current_line))
        return lines

if __name__ == "__main__":
    engine = ImageEngine()
    engine.create_collage(
        ["https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Lula_em_7_de_setembro_de_2023.jpg/800px-Lula_em_7_de_setembro_de_2023.jpg"],
        "LULA SURPREENDE O BRASIL E MOSTRA QUE É O FUTURO"
    )
