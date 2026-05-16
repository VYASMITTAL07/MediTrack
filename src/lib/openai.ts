import OpenAI from "openai";

export const openAIModel = process.env.OPENAI_MODEL ?? "gpt-5.2";

export function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function runMedicalAI<T>({
  system,
  payload,
  fallback
}: {
  system: string;
  payload: unknown;
  fallback: T;
}) {
  const client = getOpenAIClient();

  if (!client) {
    return {
      data: fallback,
      model: "local-clinical-simulator",
      usedFallback: true
    };
  }

  try {
    const response = await client.responses.create({
      model: openAIModel,
      input: [
        {
          role: "developer",
          content:
            "You are a careful healthcare assistant. Return concise JSON only. Never provide a diagnosis as certainty. Recommend emergency care for red flags."
        },
        {
          role: "user",
          content: `${system}\n\nInput:\n${JSON.stringify(payload, null, 2)}`
        }
      ]
    });

    const json = JSON.parse(response.output_text) as T;
    return {
      data: json,
      model: openAIModel,
      usedFallback: false
    };
  } catch {
    return {
      data: fallback,
      model: "local-clinical-simulator",
      usedFallback: true
    };
  }
}

export const medicalDisclaimer =
  "AI guidance is informational and not a substitute for a licensed clinician. Seek emergency care immediately for severe symptoms.";
