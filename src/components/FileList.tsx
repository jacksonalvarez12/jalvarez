import { useState, useEffect } from "react";
import type { StorageItem } from "../hooks/useStorage";
import FileItem from "./FileItem";

interface Props {
  items: StorageItem[];
  loading: boolean;
  onNavigate: (path: string) => void;
  onDelete: (fullPath: string) => void;
  onMove: (item: StorageItem, targetFolderPath: string) => void;
  onRename: (item: StorageItem, newName: string) => void;
}

export default function FileList({
  items,
  loading,
  onNavigate,
  onDelete,
  onMove,
  onRename,
}: Props) {
  const [touchDrag, setTouchDrag] = useState<{
    item: StorageItem;
    x: number;
    y: number;
  } | null>(null);
  const [touchDragOverPath, setTouchDragOverPath] = useState<string | null>(null);

  const handleTouchDragStart = (item: StorageItem, x: number, y: number) => {
    setTouchDrag({ item, x, y });
  };

  useEffect(() => {
    if (!touchDrag) return;

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // prevent scroll while dragging
      const touch = e.touches[0];
      setTouchDrag((prev) =>
        prev ? { ...prev, x: touch.clientX, y: touch.clientY } : null,
      );
      // Find which folder (if any) is under the finger
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const folderEl = el?.closest("[data-folder-path]");
      setTouchDragOverPath(folderEl?.getAttribute("data-folder-path") ?? null);
    };

    const onTouchEnd = () => {
      if (touchDrag && touchDragOverPath) {
        const { item } = touchDrag;
        if (
          item.fullPath !== touchDragOverPath &&
          !touchDragOverPath.startsWith(item.fullPath + "/")
        ) {
          onMove(item, touchDragOverPath);
        }
      }
      setTouchDrag(null);
      setTouchDragOverPath(null);
    };

    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
    return () => {
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [touchDrag, touchDragOverPath, onMove]);

  // Initial load with no items yet
  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2.5 py-20 text-gray-500 text-sm">
        <span className="inline-block w-4 h-4 border-2 border-gray-600 border-t-gray-300 rounded-full animate-spin" />
        Loading...
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-600 gap-2">
        <span className="text-4xl">📭</span>
        <p className="text-sm">This folder is empty</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Touch drag ghost element */}
      {touchDrag && (
        <div
          className="fixed pointer-events-none z-50 bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white shadow-xl opacity-90"
          style={{ left: touchDrag.x + 16, top: touchDrag.y - 24 }}
        >
          {touchDrag.item.name}
        </div>
      )}

      {/* Greyed-out overlay with spinner while reloading */}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900/60 rounded-xl">
          <span className="inline-block w-5 h-5 border-2 border-gray-500 border-t-gray-200 rounded-full animate-spin" />
        </div>
      )}

      <table
        className={`w-full text-left border-collapse transition-opacity ${loading ? "opacity-40 pointer-events-none select-none" : ""}`}
      >
        <thead>
          <tr className="border-b border-gray-800">
            <th className="py-2 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="hidden sm:table-cell py-2 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size
            </th>
            <th className="hidden sm:table-cell py-2 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Modified
            </th>
            <th className="hidden md:table-cell py-2 px-4"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <FileItem
              key={item.fullPath}
              item={item}
              onNavigate={onNavigate}
              onDelete={onDelete}
              onMove={onMove}
              onRename={onRename}
              onTouchDragStart={handleTouchDragStart}
              isTouchDragging={touchDrag?.item.fullPath === item.fullPath}
              isTouchDragOver={
                touchDragOverPath === item.fullPath && item.type === "folder"
              }
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
