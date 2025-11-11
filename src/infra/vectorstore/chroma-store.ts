import { ChromaClient, Collection } from 'chromadb';
import type {
  VectorStore,
  VectorDocument,
  SimilaritySearchOptions,
} from './index';

export interface ChromaConfig {
  url: string;
  collectionName?: string;
}

export class ChromaVectorStore implements VectorStore {
  private client: ChromaClient;
  private collection: Collection | null = null;
  private config: ChromaConfig;

  constructor(config: ChromaConfig) {
    this.config = config;
    this.client = new ChromaClient({ path: config.url });
  }

  async initialize(): Promise<void> {
    const collectionName = this.config.collectionName || 'autogpt_memories';

    this.collection = await this.client.getOrCreateCollection({
      name: collectionName,
      metadata: { 'hnsw:space': 'cosine' },
    });
  }

  async addDocuments(documents: VectorDocument[]): Promise<void> {
    if (!this.collection) {
      throw new Error('ChromaVectorStore not initialized');
    }

    const ids = documents.map((d) => d.id);
    const embeddings = documents
      .map((d) => d.embedding)
      .filter((e): e is number[] => e !== undefined);
    const metadatas = documents.map((d) => d.metadata || {});
    const documents_text = documents.map((d) => d.content);

    await this.collection.add({
      ids,
      embeddings,
      metadatas,
      documents: documents_text,
    });
  }

  async similaritySearch(
    query: string,
    options?: SimilaritySearchOptions
  ): Promise<VectorDocument[]> {
    if (!this.collection) {
      throw new Error('ChromaVectorStore not initialized');
    }

    // Note: In full implementation, we'd need to embed the query first
    // For now, this is a placeholder that would need the embedding
    throw new Error('similaritySearch requires query embedding - implement in Phase 3');
  }

  async delete(ids: string[]): Promise<void> {
    if (!this.collection) {
      throw new Error('ChromaVectorStore not initialized');
    }

    await this.collection.delete({ ids });
  }
}

