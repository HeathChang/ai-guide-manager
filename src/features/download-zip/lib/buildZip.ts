import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { Stack } from '@/shared/types';
import { formatDateYYYYMMDD } from '@/shared/lib';

interface ZipEntry {
  readonly fileName: string;
  readonly content: string;
}

interface BuildZipParams {
  readonly stack: Stack;
  readonly entries: readonly ZipEntry[];
  readonly now?: Date;
}

export const buildAndSaveZip = async ({
  stack,
  entries,
  now = new Date(),
}: BuildZipParams): Promise<void> => {
  if (entries.length === 0) {
    throw new Error('다운로드할 파일이 없습니다');
  }
  const zip = new JSZip();
  entries.forEach((entry) => {
    zip.file(entry.fileName, entry.content);
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  const filename = `ai-ruler-${stack}-${formatDateYYYYMMDD(now)}.zip`;
  saveAs(blob, filename);
};
