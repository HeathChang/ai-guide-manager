import type { RulerFile } from '@/entities/ruler-file';

export interface WorkspaceState {
  readonly files: readonly RulerFile[];
  readonly selectedFileNames: ReadonlySet<string>;
  readonly edits: ReadonlyMap<string, string>;
  readonly activeFileName: string | undefined;
}

export interface WorkspacePersisted {
  readonly selected: string[];
  readonly edits: Record<string, string>;
  readonly customFiles: Array<{
    fileName: string;
    title: string;
    description: string;
    content: string;
  }>;
}
