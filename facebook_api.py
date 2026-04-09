import os
import requests
from dotenv import load_dotenv

load_dotenv()

PAGE_ID = os.getenv("FB_PAGE_ID")
ACCESS_TOKEN = os.getenv("FB_ACCESS_TOKEN")

class FacebookAPI:
    def __init__(self):
        self.base_url = f"https://graph.facebook.com/v18.0"

    def post_image(self, image_path, caption):
        """
        Publica uma foto com legenda na página do Facebook.
        """
        url = f"{self.base_url}/{PAGE_ID}/photos"
        
        files = {
            'source': open(image_path, 'rb')
        }
        
        data = {
            'message': caption,
            'access_token': ACCESS_TOKEN
        }
        
        try:
            response = requests.post(url, files=files, data=data)
            res_json = response.json()
            if "id" in res_json:
                print(f"[OK] Postagem realizada com sucesso! ID: {res_json['id']}")
                return res_json["id"]
            else:
                print(f"[ERRO] Erro na postagem: {res_json}")
                return None
        except Exception as e:
            print(f"[ERRO] Erro de conexão com Facebook API: {e}")
            return None

if __name__ == "__main__":
    # Teste de conexão (não posta nada, apenas valida o token se necessário)
    fb = FacebookAPI()
    print(f"API configurada para Page ID: {PAGE_ID}")
