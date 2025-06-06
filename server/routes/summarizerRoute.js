import { YoutubeTranscript } from 'youtube-transcript';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';
import express from 'express';
import { marked } from 'marked';
import prompts from '../utils/prompts.js';

const router = express.Router();
const geminiAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function getTranscript(videoId) {
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
    if (transcript.length >= 1_000_000) {
      throw new Error('Transcrição muito grande para processar');
    }
    return transcript.map(({ text }) => text).join(' ');
  } catch (error) {
    console.error('Erro ao obter a transcrição:', error.message);
    return null;
  }
}

async function obterResumoGemini(texto, promptType) {
  let prompt
  if (promptType === 'summarize') {
    prompt = prompts.promptSummary;
  } else if (promptType === 'analysis') {
    prompt = prompts.promptAnalysis;
  } else if (promptType === 'transcript') {
    prompt = prompts.promptTranscript;
  } else {
    throw new Error('Tipo de prompt inválido');
  }
  try {
    const response = await geminiAI.models.generateContent({
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
      throw new Error(
        'Erro: O texto das legendas não foi fornecido corretamente.',
      );
    }
    return resumo;
  } catch (error) {
    console.error('Erro ao fazer a requisição:', error.message);
    return null;
  }
}

async function main(req, res) {
  const videoURL = req.body.videoURL.trim();
  let promptType = req.body.promptType ? req.body.promptType : 'summarize';

  try {
    console.log(`Obtendo transcrição para o vídeo: ${videoURL}`);
    const transcript = await getTranscript(videoURL);
    if (!transcript) {
      return errorHandler(new Error('Transcrição não encontrada'), res, 404);
    }
    console.log('Transcrição completa');
    console.log(`Transcrição obtida: ${transcript.length} caracteres`);

    console.log('Gerando resumo...');
    let resumo = await obterResumoGemini(transcript, promptType);
    if (!resumo) {
      return errorHandler(
        new Error('Não foi possivel criar o resumo'),
        res,
        500,
      );
    }

    resumo += `\n\n\n Link do vídeo: ${videoURL}`;

    let title = resumo
      .split('\n')[0]
      .replace(/[^0-9a-zA-ZÀ-ÖØ-öø-ÿ\s]+/g, '')
      .trim();

    const html = await marked(resumo);
    console.log('Resumo gerado com sucesso.');
    res.status(200).json({
      status: true,
      data: { title, text: resumo, html },
    });
  } catch (error) {
    errorHandler(error, res, 500);
    console.error('Erro ao obter transcrição:', error.message);
  }
}

function errorHandler(err, res, statusCode) {
  console.error(err.message);
  res.status(statusCode).json({ status: false, error: err.message });
}

router.post('/', main);

export default router;
