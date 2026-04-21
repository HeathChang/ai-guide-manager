import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { isStack } from '@/shared/types';
import type { Stack } from '@/shared/types';
import { BuilderHeader } from '@/widgets/builder-header';
import type { BuilderNotice } from '@/widgets/builder-header';
import { FileListPanel } from '@/widgets/file-list';
import { EditorPanel } from '@/widgets/file-editor';
import { useRulerWorkspace } from '@/features/ruler-workspace';
import { buildAndSaveZip } from '@/features/download-zip';
import {
  buildShareUrl,
  copyToClipboard,
  parseSelectedFromQuery,
} from '@/features/share-url';
import { getPresetList, getPresetFiles } from '@/features/presets';
import type { Preset } from '@/features/presets';
import { AddCustomFileDialog } from '@/features/custom-file';
import { isAiTool } from '@/shared/types';
import type { AiTool } from '@/shared/types';

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

  const workspace = useRulerWorkspace({ stack, initialSelection, includeHarness, aiTool });
  const presets = useMemo(() => getPresetList(), []);

  const [isCustomDialogOpen, setCustomDialogOpen] = useState(false);
  const [notice, setNotice] = useState<BuilderNotice | undefined>();
  const [isDownloading, setIsDownloading] = useState(false);

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
      workspace.applySelection(getPresetFiles(preset, stack));
      showNotice({ variant: 'info', message: `${preset.label} 프리셋을 적용했습니다` });
    },
    [workspace, stack, showNotice],
  );

  const handleShare = useCallback(async () => {
    const url = buildShareUrl({
      origin: window.location.origin,
      pathname: location.pathname,
      selected: Array.from(workspace.selectedFileNames),
    });
    try {
      await copyToClipboard(url);
      showNotice({ variant: 'success', message: '공유 링크를 클립보드에 복사했습니다' });
    } catch {
      window.prompt('링크를 수동으로 복사하세요', url);
    }
  }, [location.pathname, workspace.selectedFileNames, showNotice]);

  const handleDownload = useCallback(async () => {
    const entries = Array.from(workspace.selectedFileNames).map((fileName) => ({
      fileName,
      content: workspace.getContent(fileName),
    }));
    setIsDownloading(true);
    try {
      await buildAndSaveZip({ stack, entries });
      showNotice({
        variant: 'success',
        message: `${entries.length}개 파일을 다운로드했습니다`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '다운로드 중 오류가 발생했습니다';
      showNotice({ variant: 'danger', message });
    } finally {
      setIsDownloading(false);
    }
  }, [stack, workspace, showNotice]);

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

  return (
    <div className="min-h-full flex flex-col">
      <BuilderHeader
        stack={stack}
        selectedCount={workspace.selectedFileNames.size}
        presets={presets}
        isDownloading={isDownloading}
        onBack={handleBack}
        onApplyPreset={handleApplyPreset}
        onShare={handleShare}
        onDownload={handleDownload}
        notice={notice}
      />

      <main className="flex-1 flex flex-col md:flex-row min-h-0">
        <FileListPanel
          files={workspace.files}
          selected={workspace.selectedFileNames}
          activeFileName={workspace.activeFileName}
          editedFileNames={editedFileNames}
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
    </div>
  );
};

export default BuilderPage;
