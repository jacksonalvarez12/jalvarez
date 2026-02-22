import { useState } from "react";
import { ref, getBlob } from "firebase/storage";
import { storage } from "../lib/firebase";
import type { StorageItem } from "../hooks/useStorage";

interface Props {
  item: StorageItem;
  onNavigate: (path: string) => void;
  onDelete: (fullPath: string) => void;
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

export default function FileItem({ item, onNavigate, onDelete }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (item.type === "folder") {
    return (
      <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors group">
        <td className="py-2.5 px-4">
          <button
            onClick={() => onNavigate(item.fullPath)}
            className="flex items-center gap-2.5 text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
          >
            <span>📂</span>
            <span className="font-medium">{item.name}</span>
          </button>
        </td>
        <td className="py-2.5 px-4 text-gray-600 text-sm">—</td>
        <td className="py-2.5 px-4 text-gray-600 text-sm">—</td>
        <td className="py-2.5 px-4">
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
            {confirmDelete ? (
              <>
                <span className="text-red-400 text-xs">Delete folder?</span>
                <button
                  onClick={() => {
                    onDelete(item.fullPath);
                    setConfirmDelete(false);
                  }}
                  className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-gray-500 hover:text-gray-300 cursor-pointer"
                >
                  No
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-gray-600 hover:text-red-400 transition-colors text-sm cursor-pointer"
                title="Delete"
              >
                🗑️
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors group">
      <td className="py-2.5 px-4">
        <div className="flex items-center gap-2.5">
          <span>{fileIcon(item.name)}</span>
          <span className="text-gray-200 truncate max-w-xs">{item.name}</span>
        </div>
      </td>
      <td className="py-2.5 px-4 text-gray-400 text-sm">
        {formatBytes(item.size)}
      </td>
      <td className="py-2.5 px-4 text-gray-400 text-sm">
        {formatDate(item.updatedAt)}
      </td>
      <td className="py-2.5 px-4">
        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
          <a
            href={item.downloadURL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-blue-400 transition-colors cursor-pointer"
            title="View"
          >
            View
          </a>
          <button
            onClick={() => forceDownload(item.fullPath, item.name)}
            className="text-xs text-gray-500 hover:text-blue-400 transition-colors cursor-pointer"
            title="Download"
          >
            Download
          </button>
          {confirmDelete ? (
            <>
              <span className="text-red-400 text-xs">Delete?</span>
              <button
                onClick={() => {
                  onDelete(item.fullPath);
                  setConfirmDelete(false);
                }}
                className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-gray-500 hover:text-gray-300 cursor-pointer"
              >
                No
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-gray-600 hover:text-red-400 transition-colors text-sm cursor-pointer"
              title="Delete"
            >
              🗑️
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
