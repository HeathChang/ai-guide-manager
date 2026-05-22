// 한국어 + 마크다운 혼합 텍스트 휴리스틱: 약 3 bytes / token (Claude tokenizer 기준 근사).
// Claude의 실제 tokenizer는 BPE이므로 절대 정확하진 않지만, UI 가시화 목적에는 충분.
const TOKEN_PER_BYTE = 1 / 3;

export const RECOMMENDED_TOKEN_LIMIT = 10_000;

export const estimateTokens = (text: string): number =>
  Math.ceil(text.length * TOKEN_PER_BYTE);

export const estimateTokensFromBytes = (bytes: number): number =>
  Math.ceil(bytes * TOKEN_PER_BYTE);

export const formatTokenCount = (tokens: number): string => {
  if (tokens >= 1000) {
    const k = tokens / 1000;
    return `${k.toFixed(k >= 10 ? 0 : 1)}K`;
  }
  return tokens.toString();
};
