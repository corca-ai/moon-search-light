/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

/**
 * Calculate average embedding from multiple embeddings
 */
export function averageEmbedding(embeddings: number[][]): number[] {
  if (embeddings.length === 0) return [];

  const dim = embeddings[0].length;
  const avg = new Array(dim).fill(0);

  for (const emb of embeddings) {
    for (let i = 0; i < dim; i++) {
      avg[i] += emb[i];
    }
  }

  for (let i = 0; i < dim; i++) {
    avg[i] /= embeddings.length;
  }

  return avg;
}

/**
 * Calculate similarity score between a candidate and selected papers
 * Returns a value between 0 and 1 (higher = more similar)
 */
export function calculateRelevanceScore(
  candidateEmbedding: number[],
  selectedEmbeddings: number[][]
): number {
  if (selectedEmbeddings.length === 0 || candidateEmbedding.length === 0) {
    return 0;
  }

  // Calculate average embedding of selected papers
  const avgSelected = averageEmbedding(selectedEmbeddings);

  // Calculate cosine similarity
  const similarity = cosineSimilarity(candidateEmbedding, avgSelected);

  // Convert from [-1, 1] to [0, 1]
  return (similarity + 1) / 2;
}

/**
 * Prepare text for embedding: combine title and abstract
 */
export function prepareTextForEmbedding(title: string, abstract: string | null): string {
  const text = abstract ? `${title}\n\n${abstract}` : title;
  // Truncate to ~8000 chars to stay within token limits
  return text.slice(0, 8000);
}
