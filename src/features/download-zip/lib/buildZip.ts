import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { BackendFramework, FrontendFramework, Stack } from '@/shared/types';
import { formatDateYYYYMMDD } from '@/shared/lib';

export interface ZipEntry {
  readonly fileName: string;
  readonly content: string;
  /**
   * true면 zip 루트(각 AI 툴 규약상 강제되는 위치)에 그대로 배치한다.
   * 예: `CLAUDE.md`, `.cursor/rules/ruler.mdc`, `START-HERE.md`.
   * 지정하지 않으면 모든 룰 파일을 `ruler/` 하위에 배치한다 — 압축을 풀어
   * 프로젝트 루트에 그대로 복사하면 즉시 동작하는 단일 정합 레이아웃.
   */
  readonly atRoot?: boolean;
}

interface BuildZipParams {
  readonly stack: Stack;
  readonly framework?: FrontendFramework | BackendFramework;
  readonly entries: readonly ZipEntry[];
  readonly now?: Date;
}

const RULER_DIR = 'ruler';

/**
 * 단일 정합 레이아웃: 룰 파일은 `ruler/` 하위, atRoot 엔트리(툴 부트스트랩 등)는
 * zip 루트에 그대로. 압축을 풀어 프로젝트 루트에 복사하면 즉시 동작한다.
 */
export const resolveZipPath = (entry: ZipEntry): string =>
  entry.atRoot === true ? entry.fileName : `${RULER_DIR}/${entry.fileName}`;

/** 엔트리들을 단일 정합 레이아웃으로 JSZip 인스턴스에 조립한다(저장은 하지 않음 — 테스트 가능). */
export const assembleZip = (entries: readonly ZipEntry[]): JSZip => {
  if (entries.length === 0) {
    throw new Error('다운로드할 파일이 없습니다');
  }
  const zip = new JSZip();
  entries.forEach((entry) => {
    zip.file(resolveZipPath(entry), entry.content);
  });
  return zip;
};

export const buildAndSaveZip = async ({
  stack,
  framework,
  entries,
  now = new Date(),
}: BuildZipParams): Promise<void> => {
  const zip = assembleZip(entries);
  const blob = await zip.generateAsync({ type: 'blob' });
  const slug = framework !== undefined ? `${stack}-${framework}` : stack;
  const filename = `ai-ruler-${slug}-${formatDateYYYYMMDD(now)}.zip`;
  saveAs(blob, filename);
};
