import { useMemo, useState } from 'react';
import type { RulerFile } from '@/entities/ruler-file';
import { Button, Checkbox } from '@/shared/ui';
import { cn, formatTokenCount } from '@/shared/lib';

interface FileListPanelProps {
  readonly files: readonly RulerFile[];
  readonly selected: ReadonlySet<string>;
  readonly activeFileName: string | undefined;
  readonly editedFileNames: ReadonlySet<string>;
  readonly tokensByFile: ReadonlyMap<string, number>;
  readonly onToggle: (fileName: string) => void;
  readonly onActivate: (fileName: string) => void;
  readonly onRemoveCustom: (fileName: string) => void;
  readonly onOpenAddCustom: () => void;
}

// 룰 본문/제목에 deprecated·마이그레이션 신호가 있으면 'legacy'로 표기(예: Vuex, Recoil).
const LEGACY_SIGNALS = ['legacy', '레거시', '마이그레이션', 'archive', 'deprecated', 'maintenance'];
const isLegacyRule = (file: RulerFile): boolean => {
  const haystack = `${file.title} ${file.description}`.toLowerCase();
  return LEGACY_SIGNALS.some((signal) => haystack.includes(signal));
};

const groupByCategory = (files: readonly RulerFile[]) => {
  const groups = new Map<string, RulerFile[]>();
  files.forEach((file) => {
    const existing = groups.get(file.category) ?? [];
    existing.push(file);
    groups.set(file.category, existing);
  });
  return groups;
};

export const FileListPanel = ({
  files,
  selected,
  activeFileName,
  editedFileNames,
  tokensByFile,
  onToggle,
  onActivate,
  onRemoveCustom,
  onOpenAddCustom,
}: FileListPanelProps) => {
  const [filter, setFilter] = useState('');
  const groups = useMemo(() => {
    const matched = filter.trim().length === 0
      ? files
      : files.filter((file) =>
          `${file.fileName} ${file.title}`.toLowerCase().includes(filter.toLowerCase()),
        );
    return groupByCategory(matched);
  }, [files, filter]);

  return (
    <aside
      aria-label="룰셋 파일 목록"
      className="w-full md:w-80 lg:w-96 border-r border-border-base bg-bg-card flex flex-col min-h-0"
    >
      <div className="p-4 border-b border-border-base space-y-3">
        <div>
          <label htmlFor="file-filter" className="sr-only">
            파일 검색
          </label>
          <input
            id="file-filter"
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="파일 검색…"
            className="w-full h-9 px-3 rounded-btn border border-border-base bg-bg-base text-sm"
          />
        </div>
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>선택됨: {selected.size}개</span>
          <Button size="sm" variant="ghost" onClick={onOpenAddCustom}>
            + 사용자 파일
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {Array.from(groups.entries()).map(([category, categoryFiles]) => (
          <section key={category} aria-labelledby={`category-${category}`} className="py-1">
            <h3
              id={`category-${category}`}
              className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted"
            >
              {category}
            </h3>
            <ul className="space-y-0.5">
              {categoryFiles.map((file) => {
                const isActive = file.fileName === activeFileName;
                const isSelected = selected.has(file.fileName);
                const isEdited = editedFileNames.has(file.fileName);
                return (
                  <li
                    key={file.fileName}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2 transition-colors',
                      isActive ? 'bg-bg-muted' : 'hover:bg-bg-muted',
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => onToggle(file.fileName)}
                      aria-label={`${file.fileName} 선택`}
                    />
                    <button
                      type="button"
                      onClick={() => onActivate(file.fileName)}
                      aria-current={isActive ? 'true' : undefined}
                      title={file.description}
                      className="min-w-0 flex-1 text-left bg-transparent border-0 p-0 cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm truncate">{file.fileName}</span>
                        {file.defaultSelected && (
                          <span
                            className="shrink-0 rounded bg-bg-muted px-1 py-0.5 text-[10px] font-medium text-brand"
                            title="권장 — 기본 선택 룰"
                          >
                            권장
                          </span>
                        )}
                        {isLegacyRule(file) && (
                          <span
                            className="shrink-0 rounded bg-bg-muted px-1 py-0.5 text-[10px] font-medium text-text-muted"
                            title="레거시 / 마이그레이션 권고"
                          >
                            legacy
                          </span>
                        )}
                        {isEdited && (
                          <span
                            className="text-brand text-xs"
                            title="편집됨"
                            aria-label="편집됨"
                          >
                            ●
                          </span>
                        )}
                        {tokensByFile.has(file.fileName) && (
                          <span
                            className="ml-auto shrink-0 text-[10px] font-mono text-text-muted"
                            aria-label={`약 ${tokensByFile.get(file.fileName)} 토큰`}
                            title={`≈ ${tokensByFile.get(file.fileName)?.toLocaleString()} tok`}
                          >
                            ≈ {formatTokenCount(tokensByFile.get(file.fileName) ?? 0)} tok
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted truncate">{file.title}</p>
                    </button>
                    {file.isCustom === true && (
                      <button
                        type="button"
                        className="text-xs text-text-muted hover:text-danger"
                        onClick={() => onRemoveCustom(file.fileName)}
                        aria-label={`${file.fileName} 제거`}
                      >
                        ✕
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </aside>
  );
};
