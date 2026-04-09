# Antigravity Bot

Bot automatizado local para gerao e postagem de contedo viral no Facebook baseado em tendncias dirias do Brasil.

## Pr-requisitos
- **Node.js LTS** (Recomendado v18+)
- **PM2** (Gerenciador de processos para rodar 24h)
  ```powershell
  npm install -g pm2
  ```

## Configurao (.env)
Abra o arquivo \`.env\` e preencha com suas credenciais:
- **GROQ_API_KEY**: Pegue sua chave gratuita em [console.groq.com](https://console.groq.com/keys) (use um modelo Llama 3).
- **FB_PAGE_ID**: O ID numrico da sua pgina no Facebook.
- **FB_ACCESS_TOKEN**: Gere um Token de Acesso de Pgina com permisses \`pages_manage_posts\` no [Facebook Developers Portal](https://developers.facebook.com/).

## Instalao
1. Abra o terminal na pasta do projeto.
2. Instale as bibliotecas:
   ```powershell
   npm install
   ```

## Testar Manualmente
Para verificar se a IA e a postagem esto funcionando agora mesmo, dispare o ciclo manualmente:
```powershell
node -e "require('\''./src/scheduler'\'').runPost()"
```

## Rodar 24h com PM2
Para deixar o bot rodando em segundo plano e garantir que ele reinicie se o PC ligar ou o processo falhar:
1. Inicie o bot:
   ```powershell
   pm2 start ecosystem.config.js
   ```
2. Salve a lista para reinicializao automtica:
   ```powershell
   pm2 save
   pm2 startup
   ```

## Comandos PM2 teis
- **Ver Status**: \`pm2 status\`
- **Ver o bot trabalhando**: \`pm2 logs antigravity-bot\`
- **Monitoramento Visual**: \`pm2 monit\`
- **Reiniciar (ps alterar .env)**: \`pm2 restart antigravity-bot\`
- **Parar o rob**: \`pm2 stop antigravity-bot\`
