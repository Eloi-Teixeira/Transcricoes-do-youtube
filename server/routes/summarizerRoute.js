import { YoutubeTranscript } from 'youtube-transcript';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';
import express from 'express';
import { marked } from 'marked';
const router = express.Router();

const prompt = `Resuma o seguinte texto das legendas de um vídeo e formate o resumo em Markdown, utilizando cabeçalhos para os tópicos principais, se aplicável, e listas de pontos-chave.  \n- O título principal (representado pelo '# ' ou '## ') deve ser apenas o tema principal do vídeo, sem incluir termos como "Resumo de" ou "Resumo do vídeo".  \n- Na introdução, mencione o tom e a linguagem usados no vídeo (por exemplo, formal, informal).  \n- Utilize uma estrutura adequada ao conteúdo: \n- Para vídeos com múltiplos tópicos, utilize divisões por cabeçalhos.  \n  - Para vídeos lineares, utilize uma lista de pontos.  \n  - Para vídeos extensos, utilize subtópicos.\n- Ao final, inclua uma conclusão que destaque:  \n  - As mensagens passadas no vídeo.  \n  - A mensagem principal do vídeo.  \n  - A conclusão que o próprio vídeo apresenta, se houver.  \n  - Estruture essa conclusão em tópicos como uma lista.  \n\nLegendas:`;
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function getTranscript(videoId, res) {
  try {
    if (videoId.includes('youtube.com') || videoId.includes('youtu.be')) {
      const urlObj = new URL(videoId);
      if (videoId.includes('youtube.com')) {
        videoId = urlObj.searchParams.get('v');
      } else if (videoId.includes('youtu.be')) {
        videoId = urlObj.pathname.substring(1);
      }
    }

    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    if (transcript.length === 0) {
      throw new Error('Transcrição não encontrada');
    }
    return transcript.map(({ text }) => text).join(' ');
  } catch (error) {
    console.error('Erro ao obter a transcrição:', error);
    errorHandler(error, res, 404);
  }
}

async function obterResumoGemini(texto, res) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt + texto,
    });
    if (
      !response.candidates ||
      !response.candidates[0] ||
      !response.candidates[0].content ||
      !response.candidates[0].content.parts ||
      !response.candidates[0].content.parts[0] ||
      !response.candidates[0].content.parts[0].text
    ) {
      throw new Error('Erro ao processar a resposta da API Gemini');
    }

    const resumo = response.candidates[0].content.parts[0].text;

    if (resumo.includes('forneça o texto das legendas')) {
      errorHandler(
        new Error('Texto das legendas não encontrado no resumo'),
        res,
        404,
      );
      return null;
    }
    return resumo;
  } catch (error) {
    errorHandler(error, res, 500);
    console.error('Erro ao fazer a requisição:', error);
    return null;
  }
}

async function main(req, res) {
  const videoURL = req.body.videoURL.trim();

  try {
    console.log(`Obtendo transcrição para o vídeo: ${videoURL}`);
    const transcript = await getTranscript(videoURL, res);
    if (!transcript) {
      return errorHandler(new Error('Transcrição não encontrada'), res, 404);
    }
    console.log('Transcrição completa');
    console.log(`Transcrição obtida: ${transcript.length} caracteres`);

    console.log('Gerando resumos...');
    const resumo = await obterResumoGemini(transcript, res);
    if (!resumo) {
      return errorHandler(new Error('Não foi possivel criar o resumo'), res, 404);
    }

    let title = resumo
      .split('\n')[0]
      .replace(/[^0-9a-zA-ZÀ-ÖØ-öø-ÿ\s]+/g, '')
      .trim();

    const html = await marked(resumo);
    console.log('Resumo gerado com sucesso.');
    return res.status(200).json({
      status: true,
      data: { title, text: resumo, html },
    });
  } catch (error) {
    errorHandler(error, res, 500);
    console.error('Erro ao obter transcrição:', error);
  }
}

function errorHandler(err, res, statusCode) {
  console.error(err.stack);
  res.status(statusCode).json({ status: false, error: err.message });
}

router.post('/', main);

export default router;
