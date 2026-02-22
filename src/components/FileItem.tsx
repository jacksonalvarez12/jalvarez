import { useState, useRef } from "react";
import { ref, getBlob } from "firebase/storage";
import { storage } from "../lib/firebase";
import type { StorageItem } from "../hooks/useStorage";

interface Props {
  item: StorageItem;
  onNavigate: (path: string) => void;
  onDelete: (fullPath: string) => void;
  onMove: (item: StorageItem, targetFolderPath: string) => void;
  onRename: (item: StorageItem, newName: string) => void;
  onTouchDragStart: (item: StorageItem, x: number, y: number) => void;
  isTouchDragging: boolean;
  isTouchDragOver: boolean;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"].includes(ext ?? ""))
    return "🖼️";
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext ?? "")) return "🎬";
  if (["mp3", "wav", "flac", "aac", "m4a"].includes(ext ?? "")) return "🎵";
  if (["pdf"].includes(ext ?? "")) return "📄";
  if (["zip", "tar", "gz", "rar", "7z"].includes(ext ?? "")) return "🗜️";
  if (
    ["js", "ts", "jsx", "tsx", "py", "go", "rs", "java", "c", "cpp"].includes(
      ext ?? "",
    )
  )
    return "💻";
  return "📁";
}

const VIEWABLE_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "gif", "webp", "svg", "avif", "bmp", "ico",
  "mp4", "webm", "ogv",
  "mp3", "wav", "ogg",
  "pdf",
  "txt", "md", "html", "htm", "css", "js", "ts", "jsx", "tsx",
  "json", "xml", "yaml", "yml", "csv", "py", "go", "rs", "java",
  "c", "cpp", "h", "cs", "rb", "php", "sh", "sql",
]);

function isViewable(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return VIEWABLE_EXTENSIONS.has(ext);
}

async function forceDownload(fullPath: string, filename: string) {
  const blob = await getBlob(ref(storage, fullPath));
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}

export default function FileItem({
  item,
  onNavigate,
  onDelete,
  onMove,
  onRename,
  onTouchDragStart,
  isTouchDragging,
  isTouchDragOver,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const startRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDelete(false);
    setRenameValue(item.name);
    setIsRenaming(true);
  };

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== item.name) {
      onRename(item, trimmed);
    }
    setIsRenaming(false);
  };

  const handleRenameCancel = () => {
    setIsRenaming(false);
    setRenameValue("");
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isRenaming) return;
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    longPressTimer.current = setTimeout(() => {
      onTouchDragStart(item, touch.clientX, touch.clientY);
    }, 500);
  };

  const handleTouchMoveOnRow = (e: React.TouchEvent) => {
    if (!longPressTimer.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - (touchStartPos.current?.x ?? 0));
    const dy = Math.abs(touch.clientY - (touchStartPos.current?.y ?? 0));
    if (dx > 8 || dy > 8) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchEndOnRow = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    touchStartPos.current = null;
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/json", JSON.stringify(item));
    e.dataTransfer.effectAllowed = "move";
    setIsDragging(true);
  };

  const handleDragEnd = () => setIsDragging(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (item.type !== "folder") return;
    try {
      const dragged: StorageItem = JSON.parse(
        e.dataTransfer.getData("application/json"),
      );
      if (
        dragged.fullPath === item.fullPath ||
        item.fullPath.startsWith(dragged.fullPath + "/")
      )
        return;
      onMove(dragged, item.fullPath);
    } catch (e) {
      console.error("Drop parse error", e);
    }
  };

  const touchRowProps = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMoveOnRow,
    onTouchEnd: handleTouchEndOnRow,
  };

  // Inline rename input shown in the name cell
  const RenameInput = (
    <input
      autoFocus
      value={renameValue}
      onChange={(e) => setRenameValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleRenameSubmit();
        if (e.key === "Escape") handleRenameCancel();
      }}
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      className="bg-gray-800 border border-blue-500 rounded px-2 py-0.5 text-sm text-white focus:outline-none w-full min-w-0"
    />
  );

  // Save/Cancel shown in actions areas while renaming
  const RenameActions = (
    <>
      <button
        onClick={handleRenameSubmit}
        className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
      >
        Save
      </button>
      <button
        onClick={handleRenameCancel}
        className="text-xs text-gray-500 hover:text-gray-300 cursor-pointer"
      >
        Cancel
      </button>
    </>
  );

  // Delete confirm/button shown in actions areas
  const DeleteControls = confirmDelete ? (
    <>
      <button
        onClick={() => {
          onDelete(item.fullPath);
          setConfirmDelete(false);
        }}
        className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
      >
        Delete
      </button>
      <button
        onClick={() => setConfirmDelete(false)}
        className="text-xs text-gray-500 hover:text-gray-300 cursor-pointer"
      >
        Cancel
      </button>
    </>
  ) : (
    <button
      onClick={() => { setIsRenaming(false); setConfirmDelete(true); }}
      className="text-gray-600 hover:text-red-400 transition-colors text-sm cursor-pointer"
      title="Delete"
    >
      🗑️
    </button>
  );

  if (item.type === "folder") {
    const isActive = isTouchDragging || isDragging;
    const isOver = isTouchDragOver || isDragOver;

    return (
      <tr
        draggable={!isRenaming}
        data-folder-path={item.fullPath}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        {...touchRowProps}
        className={`border-b border-gray-800 transition-colors group ${
          isActive
            ? "opacity-40"
            : isOver
              ? "bg-blue-500/20 border-blue-500/50"
              : "hover:bg-gray-800/50"
        }`}
      >
        {/* Name cell — also carries mobile actions */}
        <td className="py-2.5 px-4 w-full max-w-0 overflow-hidden">
          {isRenaming ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="shrink-0">📂</span>
              {RenameInput}
            </div>
          ) : (
            <button
              onClick={() => onNavigate(item.fullPath)}
              className="flex items-center gap-2.5 w-full min-w-0 text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
            >
              <span className="shrink-0">📂</span>
              <span className="font-medium truncate">{item.name}</span>
            </button>
          )}
          {/* Mobile-only actions beneath the name */}
          <div className="flex items-center gap-3 mt-1.5 md:hidden">
            {isRenaming ? (
              RenameActions
            ) : (
              <>
                {confirmDelete && (
                  <span className="text-red-400 text-xs">Delete folder?</span>
                )}
                <button
                  onClick={startRename}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                >
                  Rename
                </button>
                {DeleteControls}
              </>
            )}
          </div>
        </td>

        <td className="hidden sm:table-cell py-2.5 px-4 text-gray-600 text-sm">—</td>
        <td className="hidden sm:table-cell py-2.5 px-4 text-gray-600 text-sm">—</td>

        {/* Desktop-only actions cell */}
        <td className="hidden md:table-cell py-2.5 px-4">
          <div
            className={`flex items-center gap-2 justify-end transition-opacity ${
              isRenaming ? "" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            {isRenaming ? (
              RenameActions
            ) : (
              <>
                {confirmDelete && (
                  <span className="text-red-400 text-xs">Delete folder?</span>
                )}
                <button
                  onClick={startRename}
                  className="text-gray-600 hover:text-gray-300 transition-colors text-sm cursor-pointer"
                  title="Rename"
                >
                  ✏️
                </button>
                {DeleteControls}
              </>
            )}
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr
      draggable={!isRenaming}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      {...touchRowProps}
      className={`border-b border-gray-800 hover:bg-gray-800/50 transition-colors group ${
        isDragging || isTouchDragging ? "opacity-40" : ""
      }`}
    >
      {/* Name cell — also carries mobile actions */}
      <td className="py-2.5 px-4 w-full max-w-0 overflow-hidden">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="shrink-0">{fileIcon(item.name)}</span>
          {isRenaming ? (
            RenameInput
          ) : (
            <span className="text-gray-200 truncate">{item.name}</span>
          )}
        </div>
        {/* Mobile-only actions beneath the name */}
        <div className="flex items-center gap-3 mt-1.5 md:hidden">
          {isRenaming ? (
            RenameActions
          ) : (
            <>
              {isViewable(item.name) && (
                <a
                  href={item.downloadURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-500 hover:text-blue-400 transition-colors cursor-pointer"
                >
                  View
                </a>
              )}
              <button
                onClick={() => forceDownload(item.fullPath, item.name)}
                className="text-xs text-gray-500 hover:text-blue-400 transition-colors cursor-pointer"
              >
                Download
              </button>
              <button
                onClick={startRename}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
              >
                Rename
              </button>
              {confirmDelete && (
                <span className="text-red-400 text-xs">Delete?</span>
              )}
              {DeleteControls}
            </>
          )}
        </div>
      </td>

      <td className="hidden sm:table-cell py-2.5 px-4 text-gray-400 text-sm whitespace-nowrap">
        {formatBytes(item.size)}
      </td>
      <td className="hidden sm:table-cell py-2.5 px-4 text-gray-400 text-sm whitespace-nowrap">
        {formatDate(item.updatedAt)}
      </td>

      {/* Desktop-only actions cell */}
      <td className="hidden md:table-cell py-2.5 px-4">
        <div
          className={`flex items-center gap-3 justify-end transition-opacity ${
            isRenaming ? "" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          {isRenaming ? (
            RenameActions
          ) : (
            <>
              {isViewable(item.name) && (
                <a
                  href={item.downloadURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-500 hover:text-blue-400 transition-colors cursor-pointer"
                  title="View"
                >
                  View
                </a>
              )}
              <button
                onClick={() => forceDownload(item.fullPath, item.name)}
                className="text-xs text-gray-500 hover:text-blue-400 transition-colors cursor-pointer"
                title="Download"
              >
                Download
              </button>
              {confirmDelete && (
                <span className="text-red-400 text-xs">Delete?</span>
              )}
              <button
                onClick={startRename}
                className="text-gray-600 hover:text-gray-300 transition-colors text-sm cursor-pointer"
                title="Rename"
              >
                ✏️
              </button>
              {DeleteControls}
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
