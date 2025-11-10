export const notImplemented = (feature: string): never => {
  throw new Error(`${feature} not implemented`);
};

export interface TokenCounter {
  countTokens(input: string): number;
}
