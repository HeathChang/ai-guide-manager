import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RulerFile } from '@/entities/ruler-file';
import { getDefaultFiles } from '@/entities/ruler-file';
import type { Stack } from '@/shared/types';
import { createLocalStorage } from '@/shared/lib';
import type { WorkspacePersisted } from './types';

interface UseRulerWorkspaceParams {
  readonly stack: Stack;
  readonly initialSelection?: readonly string[] | undefined;
}

interface UseRulerWorkspaceResult {
  readonly files: readonly RulerFile[];
  readonly selectedFileNames: ReadonlySet<string>;
  readonly activeFileName: string | undefined;
  readonly setActiveFileName: (name: string) => void;
  readonly toggleSelection: (fileName: string) => void;
  readonly applySelection: (fileNames: readonly string[]) => void;
  readonly clearSelection: () => void;
  readonly updateContent: (fileName: string, content: string) => void;
  readonly resetContent: (fileName: string) => void;
  readonly getContent: (fileName: string) => string;
  readonly isEdited: (fileName: string) => boolean;
  readonly addCustomFile: (input: CustomFileInput) => void;
  readonly removeCustomFile: (fileName: string) => void;
}

export interface CustomFileInput {
  readonly fileName: string;
  readonly title: string;
  readonly description: string;
}

const STORAGE_PREFIX = 'ai-ruler:v1:';

export const useRulerWorkspace = ({
  stack,
  initialSelection,
}: UseRulerWorkspaceParams): UseRulerWorkspaceResult => {
  const storage = useMemo(
    () => createLocalStorage<WorkspacePersisted>(`${STORAGE_PREFIX}${stack}`),
    [stack],
  );
  const defaultFiles = useMemo(() => getDefaultFiles(stack), [stack]);
  const persistedRef = useRef<WorkspacePersisted | undefined>(undefined);
  if (persistedRef.current === undefined) {
    persistedRef.current = storage.read();
  }
  const persisted = persistedRef.current;

  const [customFiles, setCustomFiles] = useState<readonly RulerFile[]>(() =>
    (persisted?.customFiles ?? []).map(
      (file): RulerFile => ({
        fileName: file.fileName,
        title: file.title,
        description: file.description,
        category: '사용자 정의',
        stack,
        defaultSelected: false,
        content: file.content,
        isCustom: true,
      }),
    ),
  );

  const files = useMemo<readonly RulerFile[]>(
    () => [...defaultFiles, ...customFiles],
    [defaultFiles, customFiles],
  );

  const [selected, setSelected] = useState<ReadonlySet<string>>(() => {
    if (initialSelection !== undefined && initialSelection.length > 0) {
      const valid = new Set(files.map((file) => file.fileName));
      return new Set(initialSelection.filter((name) => valid.has(name)));
    }
    if (persisted?.selected !== undefined) {
      return new Set(persisted.selected);
    }
    return new Set(defaultFiles.filter((file) => file.defaultSelected).map((file) => file.fileName));
  });

  const [edits, setEdits] = useState<ReadonlyMap<string, string>>(
    () => new Map(Object.entries(persisted?.edits ?? {})),
  );

  const [activeFileName, setActiveFileName] = useState<string | undefined>(() => {
    const firstSelected = defaultFiles.find((file) => file.defaultSelected);
    return firstSelected?.fileName ?? defaultFiles[0]?.fileName;
  });

  useEffect(() => {
    const snapshot: WorkspacePersisted = {
      selected: Array.from(selected),
      edits: Object.fromEntries(edits),
      customFiles: customFiles.map((file) => ({
        fileName: file.fileName,
        title: file.title,
        description: file.description,
        content: edits.get(file.fileName) ?? file.content,
      })),
    };
    storage.write(snapshot);
  }, [storage, selected, edits, customFiles]);

  const findArchitectureKindOf = useCallback(
    (fileName: string) => files.find((file) => file.fileName === fileName)?.architectureKind,
    [files],
  );

  const toggleSelection = useCallback(
    (fileName: string) => {
      setSelected((previous) => {
        const next = new Set(previous);
        if (next.has(fileName)) {
          next.delete(fileName);
          return next;
        }
        next.add(fileName);
        const kind = findArchitectureKindOf(fileName);
        if (kind !== undefined) {
          files.forEach((file) => {
            if (file.architectureKind !== undefined && file.architectureKind !== kind) {
              next.delete(file.fileName);
            }
          });
        }
        return next;
      });
    },
    [files, findArchitectureKindOf],
  );

  const applySelection = useCallback(
    (fileNames: readonly string[]) => {
      const valid = new Set(files.map((file) => file.fileName));
      setSelected(new Set(fileNames.filter((name) => valid.has(name))));
    },
    [files],
  );

  const clearSelection = useCallback(() => {
    setSelected(new Set());
  }, []);

  const updateContent = useCallback((fileName: string, content: string) => {
    setEdits((previous) => {
      const next = new Map(previous);
      next.set(fileName, content);
      return next;
    });
  }, []);

  const resetContent = useCallback((fileName: string) => {
    setEdits((previous) => {
      if (!previous.has(fileName)) return previous;
      const next = new Map(previous);
      next.delete(fileName);
      return next;
    });
  }, []);

  const getContent = useCallback(
    (fileName: string): string => {
      const edited = edits.get(fileName);
      if (edited !== undefined) return edited;
      return files.find((file) => file.fileName === fileName)?.content ?? '';
    },
    [edits, files],
  );

  const isEdited = useCallback((fileName: string) => edits.has(fileName), [edits]);

  const addCustomFile = useCallback(
    (input: CustomFileInput) => {
      setCustomFiles((previous) => {
        const exists = files.some((file) => file.fileName === input.fileName);
        if (exists) return previous;
        const newFile: RulerFile = {
          fileName: input.fileName,
          title: input.title,
          description: input.description,
          category: '사용자 정의',
          stack,
          defaultSelected: false,
          content: `# ${input.title}\n\n> ${input.description}\n`,
          isCustom: true,
        };
        return [...previous, newFile];
      });
      setSelected((previous) => {
        const next = new Set(previous);
        next.add(input.fileName);
        return next;
      });
      setActiveFileName(input.fileName);
    },
    [files, stack],
  );

  const removeCustomFile = useCallback((fileName: string) => {
    setCustomFiles((previous) => previous.filter((file) => file.fileName !== fileName));
    setSelected((previous) => {
      if (!previous.has(fileName)) return previous;
      const next = new Set(previous);
      next.delete(fileName);
      return next;
    });
    setEdits((previous) => {
      if (!previous.has(fileName)) return previous;
      const next = new Map(previous);
      next.delete(fileName);
      return next;
    });
  }, []);

  return {
    files,
    selectedFileNames: selected,
    activeFileName,
    setActiveFileName,
    toggleSelection,
    applySelection,
    clearSelection,
    updateContent,
    resetContent,
    getContent,
    isEdited,
    addCustomFile,
    removeCustomFile,
  };
};
