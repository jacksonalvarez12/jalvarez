import { useState } from "react";
import type { StorageItem } from "../hooks/useStorage";

interface Props {
  path: string;
  onNavigate: (path: string) => void;
  onMove: (item: StorageItem, targetFolderPath: string) => void;
}

export default function BreadcrumbNav({ path, onNavigate, onMove }: Props) {
  const segments = path ? path.split("/").filter(Boolean) : [];
  const [dragOverPath, setDragOverPath] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent, targetPath: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverPath(targetPath);
  };

  const handleDragLeave = () => setDragOverPath(null);

  const handleDrop = (e: React.DragEvent, targetPath: string) => {
    e.preventDefault();
    setDragOverPath(null);
    try {
      const dragged: StorageItem = JSON.parse(
        e.dataTransfer.getData("application/json")
      );
      // Don't drop into the folder the item is already in
      const currentParent = dragged.fullPath.split("/").slice(0, -1).join("/");
      if (currentParent === targetPath) return;
      onMove(dragged, targetPath);
    } catch (e) {
      console.error("Breadcrumb drop error", e);
    }
  };

  const dropClass = (targetPath: string) =>
    dragOverPath === targetPath
      ? "text-blue-400 underline"
      : "hover:text-white transition-colors";

  return (
    <nav className="flex items-center gap-1 text-sm text-gray-400 overflow-x-auto">
      <button
        onClick={() => onNavigate("")}
        onDragOver={(e) => handleDragOver(e, "")}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, "")}
        className={`shrink-0 cursor-pointer ${dropClass("")}`}
      >
        Home
      </button>
      {segments.map((seg, i) => {
        const segPath = segments.slice(0, i + 1).join("/");
        const isLast = i === segments.length - 1;
        return (
          <span key={segPath} className="flex items-center gap-1 shrink-0">
            <span className="text-gray-600">/</span>
            {isLast ? (
              <span className="text-white">{seg}</span>
            ) : (
              <button
                onClick={() => onNavigate(segPath)}
                onDragOver={(e) => handleDragOver(e, segPath)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, segPath)}
                className={`cursor-pointer ${dropClass(segPath)}`}
              >
                {seg}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
