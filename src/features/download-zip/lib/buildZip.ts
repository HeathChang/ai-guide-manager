import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { BackendFramework, FrontendFramework, Stack } from '@/shared/types';
import { formatDateYYYYMMDD } from '@/shared/lib';

interface ZipEntry {
  readonly fileName: string;
  readonly content: string;
}

interface BuildZipParams {
  readonly stack: Stack;
  readonly framework?: FrontendFramework | BackendFramework;
  readonly entries: readonly ZipEntry[];
  readonly now?: Date;
}

export const buildAndSaveZip = async ({
  stack,
  framework,
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
  const slug = framework !== undefined ? `${stack}-${framework}` : stack;
  const filename = `ai-ruler-${slug}-${formatDateYYYYMMDD(now)}.zip`;
  saveAs(blob, filename);
};
