module.exports = {
  apps: [
    {
      name: 'bot-facebook',
      script: 'src/scheduler.js',
      env_file: '.env', // Carrega chaves do .env
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/bot-error.log',
      out_file: 'logs/bot-out.log',
    },
    {
      name: 'bot-api',
      script: 'src/server.js',
      env_file: '.env', // Carrega chaves do .env
      watch: false,
      env: {
        PORT: 3001,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/api-error.log',
      out_file: 'logs/api-out.log',
    }
  ],
};
