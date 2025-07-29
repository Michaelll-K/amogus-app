const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    proxy: {
      '/api': {
        target: 'https://localhost:7144',
        changeOrigin: true,
        secure: false, // Pozwala na self-signed certificates
        logLevel: 'debug'
      },
      '/amogus-status-hub': {
        target: 'https://localhost:7144',  // Używaj HTTPS jak w /api
        changeOrigin: true,
        secure: false,
        ws: true,  // WAŻNE dla WebSocket!
        logLevel: 'debug'
      }
    }
  }
})
