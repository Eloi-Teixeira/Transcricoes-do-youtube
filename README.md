# Resumir Vídeos do YouTube

Uma aplicação web que permite resumir, analisar ou transcrever vídeos do YouTube usando inteligência artificial.

## 📋 Funcionalidades

- **Resumo**: Gera um resumo conciso do conteúdo do vídeo
- **Análise**: Fornece uma análise detalhada do vídeo
- **Transcrição**: Extrai e formata a transcrição completa do vídeo
- **Interface intuitiva**: Design responsivo e fácil de usar
- **Controles de texto**: Aumentar/diminuir fonte, copiar e baixar conteúdo
- **Suporte a múltiplos formatos**: YouTube URLs, YouTube Shorts, youtu.be

## 🚀 Tecnologias Utilizadas

### Frontend
- HTML5
- CSS3
- JavaScript (ES6+)
- Markdown rendering

### Backend
- Node.js
- Express.js
- Google Gemini AI (gemini-2.0-flash)
- youtube-transcript
- marked (Markdown parser)

### Dependências Principais
- `@google/genai` - Integração com Google Gemini AI
- `youtube-transcript` - Extração de transcrições do YouTube
- `express-rate-limit` - Limitação de requisições
- `cors` - Configuração de CORS
- `dotenv` - Gerenciamento de variáveis de ambiente

## 📦 Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd Transcricoes-do-youtube
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Adicione sua chave da API do Google Gemini no arquivo `.env`:
```env
GEMINI_API_KEY=sua_chave_api_aqui
PORT=3000
```

## 🔧 Como Usar

1. Inicie o servidor:
```bash
npm start
```

2. Acesse `http://localhost:3000` no seu navegador

3. Cole a URL de um vídeo do YouTube no campo de entrada

4. Selecione o tipo de processamento desejado:
   - **Resumo**: Para um resumo conciso
   - **Análise**: Para análise detalhada
   - **Transcrição**: Para transcrição completa

5. Clique em "Resumir" e aguarde o processamento

## 🎯 Funcionalidades da Interface

### Controles de Texto
- **📋 Copiar**: Copia o conteúdo para a área de transferência
- **📥 Download**: Baixa o conteúdo em formato Markdown (.md)
- **🔤 Aumentar/Diminuir Fonte**: Ajusta o tamanho da fonte (12px - 24px)
- **⬆️ Voltar ao Topo**: Botão para retornar ao início da página

### Recursos de UX
- Loading spinner durante processamento
- Mensagens de erro contextuais
- Validação de URL em tempo real
- Rate limiting para prevenir abuso
- Scroll suave e responsividade

## 🔒 Segurança e Limitações

- **Rate Limiting**: Máximo de 10 requisições por hora por IP
- **Validação de URL**: Apenas URLs válidas do YouTube são aceitas
- **Timeout**: Requisições têm timeout de 30 segundos
- **Retry Logic**: Sistema de retry automático com backoff exponencial
- **Tamanho de transcrição**: Limitado a 1.000.000 caracteres

## 📁 Estrutura do Projeto

```
├── client/
│   ├── index.html          # Interface principal
│   ├── index.js           # Lógica do frontend
│   ├── styles.css         # Estilos CSS
│   └── favicon.svg        # Ícone da aplicação
├── server/
│   ├── routes/
│   │   └── summarizerRoute.js  # Rota principal da API
│   ├── utils/
│   │   └── prompts.js     # Prompts para IA
│   └── server.js          # Servidor Express
├── package.json
└── README.md
```

## 🌐 API Endpoints

### POST `/api/summarizer`

Processa um vídeo do YouTube e retorna o conteúdo processado.

**Body:**
```json
{
  "videoURL": "https://www.youtube.com/watch?v=VIDEO_ID",
  "promptType": "summarize" // "summarize", "analysis", ou "transcript"
}
```

**Resposta de Sucesso:**
```json
{
  "status": true,
  "data": {
    "title": "Título do vídeo",
    "text": "Conteúdo em markdown",
    "html": "Conteúdo em HTML"
  }
}
```

**Resposta de Erro:**
```json
{
  "status": false,
  "error": "Mensagem de erro"
}
```

## 🔧 Scripts Disponíveis

```bash
npm start          # Inicia o servidor
npm run dev        # Modo desenvolvimento (se configurado)
```

## 📝 Formatos de URL Suportados

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtube.com/watch?v=VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- `https://www.youtube.com/v/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`
- `https://youtu.be/VIDEO_ID`

## ⚠️ Tratamento de Erros

A aplicação possui tratamento robusto de erros para:
- URLs inválidas
- Vídeos sem transcrição disponível
- Falhas na API do Gemini
- Timeouts de requisição
- Limites de rate limiting
- Erros de rede

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Se você encontrar algum problema ou tiver dúvidas:

1. Verifique se sua chave da API do Gemini está configurada corretamente
2. Certifique-se de que a URL do YouTube é válida
3. Verifique se o vídeo possui legendas/transcrição disponível
4. Consulte os logs do servidor para mais detalhes sobre erros

## 🔮 Roadmap

- [ ] Suporte a mais plataformas de vídeo
- [ ] Múltiplos idiomas de interface
- [ ] Histórico de resumos
- [ ] Exportação em diferentes formatos
- [ ] Integração com outras IAs
- [ ] Sistema de autenticação
- [ ] Dashboard de analytics