import OpenAI from "openai";

export const openAIModel =
  process.env.OPENAI_MODEL ?? "llama-3.3-70b-versatile";

export const geminiModel =
  process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

export const medicalDisclaimer =
  "AI guidance is informational and not a substitute for a licensed clinician. Seek emergency care immediately for severe symptoms.";

export class MedicalAIUnavailableError extends Error {
  status = 503;

  constructor(message = "No medical AI provider is configured.") {
    super(message);
    this.name = "MedicalAIUnavailableError";
  }
}

export class MedicalAIResponseError extends Error {
  status = 502;

  constructor(message = "The medical AI provider returned an unusable response.") {
    super(message);
    this.name = "MedicalAIResponseError";
  }
}

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

export function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) return null;

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL
  });
}

function parseMedicalJson<T>(raw: string) {
  const trimmed = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  return JSON.parse(trimmed) as T;
}

async function runOpenAI<T>(system: string, payload: unknown) {
  const client = getOpenAIClient();
  if (!client) return null;

  const response = await client.chat.completions.create({
    model: openAIModel,
    messages: [
      {
        role: "system",
        content:
          "You are a careful healthcare assistant. You MUST return ONLY valid raw JSON with no markdown, no explanations, no intro text, and no code fences. Never provide a diagnosis as certainty. Recommend emergency care for red flags."
      },
      {
        role: "user",
        content: `${system}\n\nInput:\n${JSON.stringify(payload, null, 2)}`
      }
    ],
    temperature: 0.3
  });

  const text = response.choices?.[0]?.message?.content ?? "";

  console.log("AI RESPONSE:", text);

  return {
    data: parseMedicalJson<T>(text),
    model: openAIModel,
    provider: "openai" as const
  };
}

async function runGemini<T>(system: string, payload: unknown) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: [
                  "You are a careful healthcare assistant. You MUST return ONLY valid raw JSON with no markdown, no explanations, no intro text, and no code fences. Never provide a diagnosis as certainty. Recommend emergency care for red flags.",
                  system,
                  `Input:\n${JSON.stringify(payload, null, 2)}`
                ].join("\n\n")
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    }
  );

  const body = (await response.json().catch(() => ({}))) as GeminiResponse;

  if (!response.ok) {
    throw new MedicalAIResponseError(
      body.error?.message ?? "Gemini request failed."
    );
  }

  const text =
    body.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("") ?? "";

  return {
    data: parseMedicalJson<T>(text),
    model: geminiModel,
    provider: "gemini" as const
  };
}

export async function runMedicalAI<T>({
  system,
  payload
}: {
  system: string;
  payload: unknown;
}) {
  if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
    throw new MedicalAIUnavailableError(
      "Configure OPENAI_API_KEY or GEMINI_API_KEY to enable AI consultations."
    );
  }

  const errors: Error[] = [];

  try {
    const result = await runOpenAI<T>(system, payload);
    if (result) return result;
  } catch (error) {
    errors.push(
      error instanceof Error
        ? error
        : new Error("OpenAI request failed.")
    );
  }

  try {
    const result = await runGemini<T>(system, payload);
    if (result) return result;
  } catch (error) {
    errors.push(
      error instanceof Error
        ? error
        : new Error("Gemini request failed.")
    );
  }

  throw new MedicalAIResponseError(errors.at(-1)?.message);
}