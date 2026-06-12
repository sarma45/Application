export interface EmbeddingResult {
  id: string;
  embedding: number[];
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return [];
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/text-embedding-3-small",
        input: text.slice(0, 8000),
      }),
    });

    if (!res.ok) return [];

    const data = (await res.json()) as any;
    return data?.data?.[0]?.embedding ?? [];
  } catch {
    return [];
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

export async function searchByEmbedding(
  query: string,
  agents: { id: string; name: string; description?: string | null; systemPrompt?: string | null }[],
  topK = 10
): Promise<string[]> {
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter(Boolean);

  if (queryTerms.length === 0) return agents.slice(0, topK).map((a) => a.id);

  const scored = agents
    .map((agent) => {
      const text = [agent.name, agent.description, agent.systemPrompt]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      let score = 0;
      for (const term of queryTerms) {
        if (text.includes(term)) score += term.length;
      }
      return { id: agent.id, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, topK).map((s) => s.id);
}
