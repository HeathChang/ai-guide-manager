export const AI_TOOL_LIST = ['claude-code', 'cursor', 'copilot', 'manual'] as const;
export type AiTool = (typeof AI_TOOL_LIST)[number];

export const isAiTool = (value: string): value is AiTool =>
  (AI_TOOL_LIST as readonly string[]).includes(value);

export const AI_TOOL_LABELS: Readonly<Record<AiTool, string>> = {
  'claude-code': 'Claude Code',
  cursor: 'Cursor',
  copilot: 'GitHub Copilot',
  manual: '직접 설정 / 기타',
};
