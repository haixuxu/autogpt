export interface VectorStore {
  initialize(): Promise<void>;
  addDocuments(documents: VectorDocument[]): Promise<void>;
  similaritySearch(query: string, options?: SimilaritySearchOptions): Promise<VectorDocument[]>;
  delete(ids: string[]): Promise<void>;
}

export interface VectorDocument {
  id: string;
  content: string;
  metadata?: Record<string, unknown>;
  embedding?: number[];
  namespace?: string;
}

export interface SimilaritySearchOptions {
  readonly k?: number;
  readonly namespace?: string;
  readonly filter?: Record<string, unknown>;
}
