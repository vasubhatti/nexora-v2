import { GoogleGenAI } from "@google/genai";
import AppError from "../utils/AppError.js";
import { searchWeb } from "./webSearchService.js";

// Lazy init — called inside functions so env is already loaded
const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new AppError("Gemini API key not configured.", 500);
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

const MODEL = "gemini-3.5-flash-lite";
const THINKING_MODEL = "gemini-3.6-flash";

// ── Format history for new SDK ────────────────────────────
const formatHistory = (messages = []) =>
  messages
    .filter((m) => m.content && m.content.trim())
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

// ── Text Chat ─────────────────────────────────────────────
export const chatText = async (message, history = [], thinking = false) => {
  try {
    const ai = getClient();

    const chat = ai.chats.create({
      model: thinking ? THINKING_MODEL : MODEL,
      history: formatHistory(history),
      config: {
        maxOutputTokens: 4000,
        ...(thinking && { thinkingConfig: { includeThoughts: true } }),
      },
    });

    const response = await chat.sendMessage({ message });

    if (thinking) {
      let thinkingText = "";
      let answerText = "";

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.thought) {
          thinkingText += part.text || "";
        } else {
          answerText += part.text || "";
        }
      }

      return {
        thinking: thinkingText,
        answer: answerText || response.text,
      };
    }

    return { answer: response.text };
  } catch (error) {
    throw new AppError(`Gemini chat error: ${error.message}`, 500);
  }
};

// ── Web Search Chat ───────────────────────────────────────
export const chatWithWebSearch = async (message, history = []) => {
  try {
    const { results, formatted } = await searchWeb(message);

    const contextPrompt = `You are a helpful AI assistant with access to real-time web search results.

The user asked: "${message}"

Here are the latest web search results:
${formatted}

Based on these search results, provide a comprehensive and accurate answer.
Always mention your sources by referencing the result numbers like [1], [2], etc.
If the search results don't contain relevant information, say so and answer from your knowledge.`;

    const ai = getClient();
    const chat = ai.chats.create({
      model: MODEL,
      history: formatHistory(history),
      config: { maxOutputTokens: 4000 },
    });

    const response = await chat.sendMessage({ message: contextPrompt });

    return {
      answer: response.text,
      sources: results,
    };
  } catch (error) {
    throw new AppError(`Web search chat error: ${error.message}`, 500);
  }
};

// ── Chat with Image ───────────────────────────────────────
export const chatWithImage = async (
  message,
  imageBuffer,
  mimeType,
  history = []
) => {
  try {
    const ai = getClient();

    const contents = [
      ...formatHistory(history),
      {
        role: "user",
        parts: [
          {
            inlineData: {
              data: imageBuffer.toString("base64"),
              mimeType,
            },
          },
          { text: message || "Describe this image in detail." },
        ],
      },
    ];

    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: { maxOutputTokens: 4000 },
    });

    return { answer: response.text };
  } catch (error) {
    throw new AppError(`Gemini vision error: ${error.message}`, 500);
  }
};

// ── Chat with Document ────────────────────────────────────
export const chatWithDocument = async (
  message,
  documentBuffer,
  mimeType,
  history = []
) => {
  try {
    const ai = getClient();

    const contents = [
      ...formatHistory(history),
      {
        role: "user",
        parts: [
          {
            inlineData: {
              data: documentBuffer.toString("base64"),
              mimeType,
            },
          },
          { text: message || "Summarize this document." },
        ],
      },
    ];

    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: { maxOutputTokens: 4000 },
    });

    return { answer: response.text };
  } catch (error) {
    throw new AppError(`Gemini document error: ${error.message}`, 500);
  }
};

// ── Generate Image ────────────────────────────────────────
export const generateImage = async (prompt, width = 1024, height = 1024) => {
  try {
    const enhancedPrompt = `${prompt}, ultra high quality, highly detailed, sharp, professional, 4k`;
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      enhancedPrompt
    )}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux&enhance=true`;
    return imageUrl;
  } catch (error) {
    throw new AppError(`Image generation error: ${error.message}`, 500);
  }
};
// ── Code Workspace Chat ───────────────────────────────────
export const codeChat = async (message, history = [], files = []) => {
  try {
    const ai = getClient();

    const systemContext = `You are an expert coding assistant in a code workspace.
You can see all project files with their folder structure.
When providing code, ALWAYS mention which file it belongs to before the code block.
Format: "For \`filepath\`:" followed by the code block.
Use proper markdown code blocks with language specified.
Be concise, accurate, and provide complete working examples.`;

    let fullMessage = message;
    if (files && files.length > 0) {
      const fileContext = files
        .map(f => `File: ${f.path || f.name}\n\`\`\`${f.language || ""}\n${f.content || "(empty)"}\n\`\`\``)
        .join("\n\n");
      fullMessage = `Project structure and files:\n${fileContext}\n\nUser request: ${message}`;
    }

    const chat = ai.chats.create({
      model: MODEL,
      history: [
        { role: "user", parts: [{ text: systemContext }] },
        { role: "model", parts: [{ text: "Ready to help with your code. I can see all your project files." }] },
        ...formatHistory(history),
      ],
      config: { maxOutputTokens: 8000 },
    });

    const response = await chat.sendMessage({ message: fullMessage });
    return { answer: response.text };
  } catch (error) {
    throw new AppError(`Code chat error: ${error.message}`, 500);
  }
};