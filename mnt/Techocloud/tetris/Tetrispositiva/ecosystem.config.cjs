module.exports = {
  apps: [
    {
      name: "tetris-diagnostico",
      script: "./node_modules/.bin/tsx",
      args: "server.ts",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      // Reiniciar se a memória passar de 500MB
      max_memory_restart: "500M",
      // Tentar reiniciar automaticamente se o app cair
      autorestart: true,
      watch: false,
      // Log de erros e saída
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss"
    }
  ]
};
