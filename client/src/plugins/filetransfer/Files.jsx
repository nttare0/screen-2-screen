// Modified for Screen 2 Screen: a shared-file panel with accessible transfers and selection.
import { useRef, useState } from 'react'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { selectIsAdmin } from '@m1k1o/neko'
import { useTranslation } from 'react-i18next'
import { ask } from '@/state/dialogs'
import { useNeko } from '@/state/provider'
import {
  ArrowClockwiseIcon,
  CheckCircleIcon,
  DownloadSimpleIcon,
  FileArrowUpIcon,
  FileTextIcon,
  FolderIcon,
  TrashIcon,
  WarningCircleIcon,
  XIcon,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { store } from './store'
import { fileUrl, fileDelete, refresh, upload } from './actions'
const size = (bytes) => {
  if (bytes === undefined) return ''
  const u = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = bytes > 0 ? Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), u.length - 1) : 0
  return `${+(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${u[i]}`
}
export function Files() {
  const { t } = useTranslation()
  const neko = useNeko()
  const { client, app } = neko
  const uploadsStore = store(neko)
  const { files: f, uploads } = useStore(
    uploadsStore,
    useShallow((s) => ({ files: s.files, uploads: s.uploads })),
  )
  const admin = useStore(client.store, selectIsAdmin)
  const [drag, setDrag] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState([])
  const input = useRef(null)
  const canDownload = admin || f.user_download
  const canUpload = admin || f.user_upload
  const canDelete = admin || f.user_delete
  const files = f.files ?? []
  const plain = files.filter((x) => x.type !== 'dir')
  const allSelected = plain.length > 0 && plain.every((x) => selected.includes(x.name))
  const toggle = (n) => setSelected((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]))
  const stopSelecting = () => (setSelecting(false), setSelected([]))
  const onItemClick = (item, e) => {
    if (item.type === 'dir') return
    if (e.ctrlKey || e.metaKey) {
      setSelecting(true)
      toggle(item.name)
    } else if (selecting) toggle(item.name)
  }
  const deleteOne = (n) =>
    ask(app, t('files:delete_title', { name: n }), t('files:delete_confirm')).then((ok) => ok && fileDelete(neko, n))
  const deleteSelected = async () => {
    if (
      !(await ask(
        app,
        t('files:delete_selected_title'),
        t('files:delete_selected_confirm', { count: selected.length }),
      ))
    )
      return
    const names = selected
    stopSelecting()
    for (const n of names) await fileDelete(neko, n)
  }
  return (
    <div className="flex min-w-0 max-w-full flex-1 flex-col">
      <div className="flex items-center gap-2 px-4 py-3">
        <FolderIcon className="size-4 shrink-0 text-primary" />
        <p className="truncate text-xs font-medium" title={f.root_dir}>
          {f.root_dir}
        </p>
        <Button
          variant="ghost"
          size="icon-xs"
          className="ml-auto text-muted-foreground"
          aria-label="Refresh"
          title="Refresh"
          onClick={() => refresh(neko)}
        >
          <ArrowClockwiseIcon className="size-3.5" />
        </Button>
      </div>
      {plain.length > 2 && canDelete && (
        <div className="mx-3 mb-2 flex items-center justify-between rounded-lg bg-muted px-2.5 py-1.5 text-[11px]">
          {!selecting ? (
            <Button variant="link" size="xs" className="h-auto p-0 text-[11px]" onClick={() => setSelecting(true)}>
              {t('files:select')}
            </Button>
          ) : (
            <>
              <Button
                variant="link"
                size="xs"
                className="h-auto p-0 text-[11px]"
                onClick={() => setSelected(allSelected ? [] : plain.map((x) => x.name))}
              >
                {t(allSelected ? 'files:unselect_all' : 'files:select_all')}
              </Button>
              <div className="flex items-center gap-3">
                {selected.length > 0 && (
                  <Button
                    variant="link"
                    size="xs"
                    className="h-auto p-0 text-[11px] text-destructive"
                    onClick={deleteSelected}
                  >
                    <TrashIcon className="size-3" /> {t('files:delete')} ({selected.length})
                  </Button>
                )}
                <Button variant="ghost" size="xs" className="h-5 px-1 text-[11px]" onClick={stopSelecting}>
                  {t('files:cancel')}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-1 px-3 pb-3">
          {files.length === 0 && (
            <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-center">
              <FolderIcon className="size-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">No shared files yet</p>
              <p className="max-w-48 text-xs leading-5 text-muted-foreground">
                Upload a file to make it available to the room.
              </p>
            </div>
          )}
          {files.map((item) => {
            const sel = selecting && item.type !== 'dir'
            return (
              <div
                key={item.name}
                className={cn(
                  'group flex items-center gap-2.5 rounded-lg border border-transparent px-2 py-2.5 hover:bg-muted/60',
                  sel && 'cursor-pointer',
                  sel && selected.includes(item.name) && 'border-primary/20 bg-accent/60',
                )}
                data-testid="file"
                onClick={(e) => onItemClick(item, e)}
              >
                {sel && (
                  <Checkbox
                    checked={selected.includes(item.name)}
                    onClick={(e) => e.stopPropagation()}
                    onCheckedChange={() => toggle(item.name)}
                    aria-label={`Select ${item.name}`}
                  />
                )}
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                  {item.type === 'dir' ? <FolderIcon className="size-4" /> : <FileTextIcon className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium" data-testid="file-name" title={item.name}>
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {item.type === 'dir' ? 'Folder' : size(item.size)}
                  </p>
                </div>
                {!selecting && item.type !== 'dir' && canDownload && (
                  <Button
                    asChild
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground"
                    aria-label={`Download ${item.name}`}
                    title={`Download ${item.name}`}
                  >
                    <a href={fileUrl(neko, item.name)} download={item.name}>
                      <DownloadSimpleIcon className="size-3.5" />
                    </a>
                  </Button>
                )}
                {!selecting && item.type !== 'dir' && canDelete && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`${t('files:delete')} ${item.name}`}
                    title={`${t('files:delete')} ${item.name}`}
                    data-testid="file-delete"
                    onClick={() => deleteOne(item.name)}
                  >
                    <TrashIcon className="size-3.5" />
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>
      <div className="shrink-0 border-t p-3">
        {uploads.length > 0 && (
          <div className="mb-3 max-h-44 space-y-3 overflow-y-auto rounded-lg bg-muted/50 p-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold">{t('files:uploads')}</p>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Clear finished uploads"
                onClick={() =>
                  uploadsStore.setState((s) => ({ uploads: s.uploads.filter((u) => u.status === 'inprogress') }))
                }
              >
                <XIcon className="size-3" />
              </Button>
            </div>
            {uploads.map((u) => (
              <div key={u.id} data-testid="transfer" data-status={u.status} className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px]">
                  {u.status === 'completed' ? (
                    <CheckCircleIcon className="size-3.5 shrink-0 text-success" />
                  ) : u.status === 'failed' ? (
                    <WarningCircleIcon className="size-3.5 shrink-0 text-destructive" />
                  ) : (
                    <ArrowClockwiseIcon className="size-3.5 shrink-0 animate-spin text-primary" />
                  )}
                  <span className="truncate" title={u.name}>
                    {u.name}
                  </span>
                  <span className="ml-auto shrink-0 tabular-nums text-muted-foreground">
                    {Math.min(100, Math.round((u.progress / (u.size || 1)) * 100))}%
                  </span>
                </div>
                {u.status === 'failed' ? (
                  <p className="text-[10px] text-destructive">{u.error}</p>
                ) : (
                  <Progress value={u.size ? (u.progress / u.size) * 100 : 0} className="h-1" />
                )}
              </div>
            ))}
          </div>
        )}
        {canUpload && (
          <>
            <button
              type="button"
              className={cn(
                'flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/25 px-4 py-5 text-center transition-colors hover:border-primary/40 hover:bg-accent/40',
                drag && 'border-primary bg-accent/60',
              )}
              data-testid="upload"
              onDragOver={(e) => (e.preventDefault(), setDrag(true))}
              onDragLeave={(e) => (e.preventDefault(), setDrag(false))}
              onDrop={(e) => (e.preventDefault(), setDrag(false), upload(neko, e.dataTransfer.files))}
              onClick={() => input.current.click()}
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-primary">
                <FileArrowUpIcon className="size-4" />
              </span>
              <span className="text-xs font-medium">Share a file with the room</span>
              <span className="text-[10px] text-muted-foreground">{t('files:upload_here')}</span>
            </button>
            <input
              ref={input}
              type="file"
              multiple
              hidden
              data-testid="upload-input"
              aria-label={t('files:upload_here')}
              onChange={(e) => {
                if (e.target.files) upload(neko, e.target.files)
                e.target.value = ''
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}
