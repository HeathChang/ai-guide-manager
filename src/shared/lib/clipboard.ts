export const copyToClipboard = async (text: string): Promise<void> => {
  if (navigator.clipboard === undefined) {
    throw new Error('클립보드를 사용할 수 없습니다');
  }
  await navigator.clipboard.writeText(text);
};
