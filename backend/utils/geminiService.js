import dotenv from 'dotenv';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

if (!process.env.GEMINI_API_KEY) {
  console.error('FATAL ERROR: GEMINI_API_KEY is not set in the environment variables.');
  process.exit(1);
}

const MODEL = "gemini-3.5-flash-lite";

const PLAIN_TEXT_RULE =
  "Write in plain text only. Do NOT use markdown symbols such as #, ##, ###, **, *, or backticks.";

/**
 * Generate flashcards from text
 */
export const generateFlashcards = async (text, count = 10) => {
  const prompt = `Generate exactly ${count} educational flashcards from the following text.
Format each flashcard as:
Q: [Clear, specific question]
A: [Concise, accurate answer]
D: [Difficulty level: easy, medium, or hard]

Separate each flashcard with "---"
${PLAIN_TEXT_RULE}

Text:
${text.substring(0, 15000)}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });

    const generatedText = response.text;

    const flashcards = [];
    const cards = generatedText.split('---').filter(c => c.trim());

    for (const card of cards) {
      const lines = card.trim().split('\n');
      let question = '', answer = '', difficulty = 'medium';

      for (const line of lines) {
        if (line.startsWith('Q:')) {
          question = line.substring(2).trim();
        } else if (line.startsWith('A:')) {
          answer = line.substring(2).trim();
        } else if (line.startsWith('D:')) {
          const diff = line.substring(2).trim().toLowerCase();
          if (['easy', 'medium', 'hard'].includes(diff)) {
            difficulty = diff;
          }
        }
      }

      if (question && answer) {
        flashcards.push({ question, answer, difficulty });
      }
    }

    return flashcards.slice(0, count);
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to generate flashcards');
  }
};

/**
 * Generate quiz questions
 */
export const generateQuiz = async (text, numQuestions = 5) => {
  const prompt = `Generate exactly ${numQuestions} multiple choice questions from the following text.
Format each question as:
Q: [Question]
01: [Option 1]
02: [Option 2]
03: [Option 3]
04: [Option 4]
C: [Correct option - exactly as written above]
E: [Brief explanation]
D: [Difficulty: easy, medium, or hard]

Separate questions with "---"
${PLAIN_TEXT_RULE}

Text:
${text.substring(0, 15000)}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });

    const generatedText = response.text;

    const questions = [];
    const questionBlocks = generatedText.split('---').filter(q => q.trim());

    for (const block of questionBlocks) {
      const lines = block.trim().split('\n');
      let question = '', options = [], correctAnswer = '', explanation = '', difficulty = 'medium';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('Q:')) {
          question = trimmed.substring(2).trim();
        } else if (trimmed.match(/^0\d:/)) {
          options.push(trimmed.substring(3).trim());
        } else if (trimmed.startsWith('C:')) {
          // Remove a leading "01: " style number so it matches the option text
          correctAnswer = trimmed.substring(2).trim().replace(/^0\d:\s*/, '');
        } else if (trimmed.startsWith('E:')) {
          explanation = trimmed.substring(2).trim();
        } else if (trimmed.startsWith('D:')) {
          const diff = trimmed.substring(2).trim().toLowerCase();
          if (['easy', 'medium', 'hard'].includes(diff)) {
            difficulty = diff;
          }
        }
      }

      // If Gemini gave only a number like "02", use that option's text
      if (/^0?[1-4]$/.test(correctAnswer) && options.length === 4) {
        correctAnswer = options[parseInt(correctAnswer, 10) - 1];
      }

      if (question && options.length === 4 && correctAnswer) {
        questions.push({ question, options, correctAnswer, explanation, difficulty });
      }
    }

    return questions.slice(0, numQuestions);
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to generate quiz');
  }
};

/**
 * Generate document summary
 */
export const generateSummary = async (text) => {
  const prompt = `Provide a concise summary of the following text, highlighting the key concepts, main ideas, and important points.

Rules:
- ${PLAIN_TEXT_RULE}
- Use short paragraphs. If you list points, put each on its own line starting with a dash and a space.
- For section titles, write the title on its own line followed by a colon.

Text:
${text.substring(0, 20000)}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to generate summary');
  }
};

/**
 * Chat with document context
 */
export const chatWithContext = async (question, chunks) => {
  const context = chunks.map((c, i) => `[Chunk ${i + 1}]\n${c.content}`).join('\n\n');

  const prompt = `Based on the following context from a document, analyse the context and answer the user's question. If the answer is not in the context, say so.
${PLAIN_TEXT_RULE}

Context:
${context}

Question: ${question}

Answer:`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to process chat request');
  }
};

/**
 * Explain a specific concept
 */
export const explainConcept = async (concept, context) => {
  const prompt = `Explain the concept of "${concept}" based on the following context. Provide a clear, educational explanation that's easy to understand. Include examples if relevant.
${PLAIN_TEXT_RULE}

Context:
${context.substring(0, 10000)}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to explain concept');
  }
};