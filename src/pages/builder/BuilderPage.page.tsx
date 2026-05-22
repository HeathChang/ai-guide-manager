import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  DEFAULT_FRAMEWORK,
  isAiTool,
  isBackendFramework,
  isFrontendFramework,
  isStack,
} from '@/shared/types';
import type {
  AiTool,
  BackendFramework,
  FrontendFramework,
  Stack,
} from '@/shared/types';
import { BuilderHeader } from '@/widgets/builder-header';
import type { BuilderNotice } from '@/widgets/builder-header';
import { FileListPanel } from '@/widgets/file-list';
import { EditorPanel } from '@/widgets/file-editor';
import { useRulerWorkspace } from '@/features/ruler-workspace';
import { buildAndSaveZip } from '@/features/download-zip';
import {
  buildShareUrl,
  copyToClipboard,
  parseFrameworkFromQuery,
  parseSelectedFromQuery,
} from '@/features/share-url';
import { getPresetList, getPresetFiles } from '@/features/presets';
import type { Preset } from '@/features/presets';
import { AddCustomFileDialog } from '@/features/custom-file';
import { LintDialog, lintRules } from '@/features/rule-lint';
import type { LintResult } from '@/features/rule-lint';
import { VerifyPromptsDialog } from '@/widgets/verify-prompts';
import { RECOMMENDED_TOKEN_LIMIT, estimateTokens } from '@/shared/lib';

const isHarnessState = (state: unknown): boolean => {
  if (state === null || typeof state !== 'object') return false;
  const record = state as Record<string, unknown>;
  return record.includeHarness === true;
};

const readAiToolFromState = (state: unknown): AiTool | undefined => {
  if (state === null || typeof state !== 'object') return undefined;
  const record = state as Record<string, unknown>;
  const value = record.aiTool;
  if (typeof value !== 'string') return undefined;
  return isAiTool(value) ? value : undefined;
};

const readFrameworkFromState = (
  state: unknown,
  stack: Stack,
): FrontendFramework | BackendFramework => {
  if (state !== null && typeof state === 'object') {
    const record = state as Record<string, unknown>;
    const value = record.framework;
    if (typeof value === 'string') {
      if (stack === 'frontend' && isFrontendFramework(value)) return value;
      if (stack === 'backend' && isBackendFramework(value)) return value;
    }
  }
  return stack === 'frontend' ? DEFAULT_FRAMEWORK.frontend : DEFAULT_FRAMEWORK.backend;
};

const BuilderPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ stack: string }>();
  const stackParam = params.stack ?? '';
  const stack: Stack = isStack(stackParam) ? stackParam : 'frontend';

  const initialSelection = useMemo(
    () => parseSelectedFromQuery(location.search),
    [location.search],
  );

  const includeHarness = isHarnessState(location.state);
  const aiTool = readAiToolFromState(location.state);
  const queryFramework = useMemo(() => {
    const candidate = parseFrameworkFromQuery(location.search);
    if (candidate === undefined) return undefined;
    if (stack === 'frontend' && isFrontendFramework(candidate)) return candidate;
    if (stack === 'backend' && isBackendFramework(candidate)) return candidate;
    return undefined;
  }, [location.search, stack]);
  const framework = queryFramework ?? readFrameworkFromState(location.state, stack);

  const workspace = useRulerWorkspace({ stack, framework, initialSelection, includeHarness, aiTool });
  const presets = useMemo(() => getPresetList(), []);

  const [isCustomDialogOpen, setCustomDialogOpen] = useState(false);
  const [notice, setNotice] = useState<BuilderNotice | undefined>();
  const [isDownloading, setIsDownloading] = useState(false);
  const [lintResult, setLintResult] = useState<LintResult | undefined>();
  const [isVerifyPromptsOpen, setVerifyPromptsOpen] = useState(false);

  const showNotice = useCallback(
    (next: BuilderNotice) => {
      setNotice(next);
      window.setTimeout(() => setNotice(undefined), 2500);
    },
    [],
  );

  const activeFile = useMemo(
    () => workspace.files.find((file) => file.fileName === workspace.activeFileName),
    [workspace.files, workspace.activeFileName],
  );

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleApplyPreset = useCallback(
    (preset: Preset) => {
      workspace.applySelection(getPresetFiles(preset, stack, framework));
      showNotice({ variant: 'info', message: `${preset.label} 프리셋을 적용했습니다` });
    },
    [workspace, stack, framework, showNotice],
  );

  const handleShare = useCallback(async () => {
    const url = buildShareUrl({
      origin: window.location.origin,
      pathname: location.pathname,
      selected: Array.from(workspace.selectedFileNames),
      framework,
    });
    try {
      await copyToClipboard(url);
      showNotice({ variant: 'success', message: '공유 링크를 클립보드에 복사했습니다' });
    } catch {
      window.prompt('링크를 수동으로 복사하세요', url);
    }
  }, [location.pathname, workspace.selectedFileNames, framework, showNotice]);

  const handleLint = useCallback(() => {
    const result = lintRules({
      files: workspace.files,
      selected: workspace.selectedFileNames,
      getContent: workspace.getContent,
    });
    setLintResult(result);
  }, [workspace]);

  const handleDownload = useCallback(async () => {
    const entries = Array.from(workspace.selectedFileNames).map((fileName) => ({
      fileName,
      content: workspace.getContent(fileName),
    }));
    setIsDownloading(true);
    try {
      await buildAndSaveZip({ stack, framework, entries });
      showNotice({
        variant: 'success',
        message: `${entries.length}개 파일을 다운로드했습니다 — 다음 단계: 검증 프롬프트`,
      });
      // 다운로드 성공 직후 검증 프롬프트를 자동 노출 — "ZIP만 풀면 끝"이 아니라
      // "받고 → 검증 → 사용" 흐름을 기본 동선으로 강제한다.
      setVerifyPromptsOpen(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : '다운로드 중 오류가 발생했습니다';
      showNotice({ variant: 'danger', message });
    } finally {
      setIsDownloading(false);
    }
  }, [stack, framework, workspace, showNotice]);

  const editedFileNames = useMemo(() => {
    const set = new Set<string>();
    workspace.files.forEach((file) => {
      if (workspace.isEdited(file.fileName)) set.add(file.fileName);
    });
    return set;
  }, [workspace]);

  const existingFileNames = useMemo(
    () => new Set(workspace.files.map((file) => file.fileName)),
    [workspace.files],
  );

  const tokensByFile = useMemo(() => {
    const map = new Map<string, number>();
    workspace.files.forEach((file) => {
      map.set(file.fileName, estimateTokens(workspace.getContent(file.fileName)));
    });
    return map;
  }, [workspace]);

  const totalTokens = useMemo(() => {
    let sum = 0;
    workspace.selectedFileNames.forEach((name) => {
      sum += tokensByFile.get(name) ?? 0;
    });
    return sum;
  }, [tokensByFile, workspace.selectedFileNames]);

  return (
    <div className="min-h-full flex flex-col">
      <BuilderHeader
        stack={stack}
        framework={framework}
        selectedCount={workspace.selectedFileNames.size}
        totalTokens={totalTokens}
        recommendedTokenLimit={RECOMMENDED_TOKEN_LIMIT}
        presets={presets}
        isDownloading={isDownloading}
        onBack={handleBack}
        onApplyPreset={handleApplyPreset}
        onShare={handleShare}
        onDownload={handleDownload}
        onLint={handleLint}
        onOpenVerifyPrompts={() => setVerifyPromptsOpen(true)}
        notice={notice}
      />

      <main className="flex-1 flex flex-col md:flex-row min-h-0">
        <FileListPanel
          files={workspace.files}
          selected={workspace.selectedFileNames}
          activeFileName={workspace.activeFileName}
          editedFileNames={editedFileNames}
          tokensByFile={tokensByFile}
          onToggle={workspace.toggleSelection}
          onActivate={workspace.setActiveFileName}
          onRemoveCustom={workspace.removeCustomFile}
          onOpenAddCustom={() => setCustomDialogOpen(true)}
        />
        <EditorPanel
          file={activeFile}
          content={
            workspace.activeFileName !== undefined
              ? workspace.getContent(workspace.activeFileName)
              : ''
          }
          isEdited={
            workspace.activeFileName !== undefined
              ? workspace.isEdited(workspace.activeFileName)
              : false
          }
          onChange={(next) => {
            if (workspace.activeFileName !== undefined) {
              workspace.updateContent(workspace.activeFileName, next);
            }
          }}
          onReset={() => {
            if (workspace.activeFileName !== undefined) {
              workspace.resetContent(workspace.activeFileName);
            }
          }}
        />
      </main>

      <AddCustomFileDialog
        open={isCustomDialogOpen}
        existingFileNames={existingFileNames}
        onClose={() => setCustomDialogOpen(false)}
        onSubmit={workspace.addCustomFile}
      />

      <LintDialog
        open={lintResult !== undefined}
        result={lintResult}
        onClose={() => setLintResult(undefined)}
      />

      <VerifyPromptsDialog
        open={isVerifyPromptsOpen}
        onClose={() => setVerifyPromptsOpen(false)}
      />
    </div>
  );
};

export default BuilderPage;
