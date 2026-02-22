import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { User } from "firebase/auth";
import { useStorage } from "../hooks/useStorage";
import type { StorageItem } from "../hooks/useStorage";
import BreadcrumbNav from "./BreadcrumbNav";
import FileList from "./FileList";
import UploadZone from "./UploadZone";
import ConflictModal from "./ConflictModal";

interface Props {
  user: User;
  onSignOut: () => void;
}

type PendingConflict =
  | { type: "upload"; files: File[]; targetPath: string; conflicts: string[] }
  | { type: "move"; item: StorageItem; targetFolderPath: string; conflicts: string[] }
  | { type: "rename"; item: StorageItem; newName: string; conflicts: string[] };

function makeUniqueName(name: string, existingNames: Set<string>): string {
  const dotIdx = name.lastIndexOf(".");
  const ext = dotIdx > 0 ? name.slice(dotIdx) : "";
  const base = dotIdx > 0 ? name.slice(0, dotIdx) : name;
  let counter = 1;
  let candidate = `${base} (${counter})${ext}`;
  while (existingNames.has(candidate)) {
    counter++;
    candidate = `${base} (${counter})${ext}`;
  }
  return candidate;
}

export default function FileExplorer({ user, onSignOut }: Props) {
  const { "*": splat } = useParams();
  const currentPath = splat ?? "";
  const navigate = useNavigate();

  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [pendingConflict, setPendingConflict] = useState<PendingConflict | null>(null);

  const {
    items,
    loading,
    uploads,
    listPath,
    uploadFiles,
    createFolder,
    deleteItem,
    deleteFolder,
    moveItem,
    renameItem,
    getExistingNames,
    clearUploads,
  } = useStorage();

  const refresh = useCallback(() => {
    listPath(currentPath);
  }, [currentPath, listPath]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleNavigate = (path: string) => {
    setShowNewFolder(false);
    setNewFolderName("");
    navigate(path ? `/${path}` : "/");
  };

  const handleUpload = async (files: File[]) => {
    const existing = await getExistingNames(currentPath);
    const conflicts = files.map((f) => f.name).filter((n) => existing.has(n));
    if (conflicts.length > 0) {
      setPendingConflict({ type: "upload", files, targetPath: currentPath, conflicts });
    } else {
      uploadFiles(files, currentPath, refresh);
    }
  };

  const handleMove = async (item: StorageItem, targetFolderPath: string) => {
    const existing = await getExistingNames(targetFolderPath);
    if (existing.has(item.name)) {
      setPendingConflict({ type: "move", item, targetFolderPath, conflicts: [item.name] });
    } else {
      await moveItem(item, targetFolderPath);
      navigate(targetFolderPath ? `/${targetFolderPath}` : "/");
    }
  };

  const handleRename = async (item: StorageItem, newName: string) => {
    const conflict = items.find((i) => i.name === newName && i.fullPath !== item.fullPath);
    if (conflict) {
      setPendingConflict({ type: "rename", item, newName, conflicts: [newName] });
    } else {
      await renameItem(item, newName);
      refresh();
    }
  };

  const handleDelete = async (fullPath: string) => {
    const item = items.find((i) => i.fullPath === fullPath);
    if (item?.type === "folder") {
      await deleteFolder(fullPath);
    } else {
      await deleteItem(fullPath);
    }
    refresh();
  };

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    await createFolder(currentPath, name);
    setNewFolderName("");
    setShowNewFolder(false);
    refresh();
  };

  const resolveConflict = async (resolution: "replace" | "keepBoth") => {
    if (!pendingConflict) return;
    const op = pendingConflict;
    setPendingConflict(null);

    if (op.type === "upload") {
      let nameMap: Record<string, string> | undefined;
      if (resolution === "keepBoth") {
        const existing = await getExistingNames(op.targetPath);
        const takenNames = new Set(existing);
        nameMap = {};
        for (const file of op.files) {
          if (op.conflicts.includes(file.name)) {
            const uniqueName = makeUniqueName(file.name, takenNames);
            nameMap[file.name] = uniqueName;
            takenNames.add(uniqueName);
          }
        }
      }
      uploadFiles(op.files, op.targetPath, refresh, nameMap);
    } else if (op.type === "move") {
      if (resolution === "keepBoth") {
        const existing = await getExistingNames(op.targetFolderPath);
        const destName = makeUniqueName(op.item.name, existing);
        await moveItem(op.item, op.targetFolderPath, destName);
      } else {
        await moveItem(op.item, op.targetFolderPath);
      }
      navigate(op.targetFolderPath ? `/${op.targetFolderPath}` : "/");
    } else {
      // rename
      if (resolution === "keepBoth") {
        const existingNames = new Set(items.map((i) => i.name));
        const uniqueName = makeUniqueName(op.newName, existingNames);
        await renameItem(op.item, uniqueName);
      } else {
        await renameItem(op.item, op.newName);
      }
      refresh();
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {pendingConflict && (
        <ConflictModal
          conflicts={pendingConflict.conflicts}
          onReplace={() => resolveConflict("replace")}
          onKeepBoth={() => resolveConflict("keepBoth")}
          onCancel={() => setPendingConflict(null)}
        />
      )}

      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🗄️</span>
          <span className="font-semibold text-gray-100">Jackson Alvarez</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{user.email}</span>
          <button
            onClick={onSignOut}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <BreadcrumbNav path={currentPath} onNavigate={handleNavigate} />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewFolder(!showNewFolder)}
              className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              + New folder
            </button>
            <button
              onClick={refresh}
              className="text-sm text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              title="Refresh"
            >
              ↻
            </button>
          </div>
        </div>

        {/* New folder input */}
        {showNewFolder && (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFolder();
                if (e.key === "Escape") {
                  setShowNewFolder(false);
                  setNewFolderName("");
                }
              }}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 w-56"
            />
            <button
              onClick={handleCreateFolder}
              className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowNewFolder(false);
                setNewFolderName("");
              }}
              className="text-sm text-gray-500 hover:text-gray-300 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Upload zone */}
        <UploadZone
          uploads={uploads}
          onUpload={handleUpload}
          onClear={clearUploads}
        />

        {/* File list */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <FileList
            items={items}
            loading={loading}
            parentPath={currentPath === "" ? null : currentPath.split("/").slice(0, -1).join("/")}
            onNavigate={handleNavigate}
            onDelete={handleDelete}
            onMove={handleMove}
            onRename={handleRename}
          />
        </div>
      </div>
    </div>
  );
}
