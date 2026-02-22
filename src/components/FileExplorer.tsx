import { useState, useEffect, useCallback } from "react";
import type { User } from "firebase/auth";
import { useStorage } from "../hooks/useStorage";
import type { StorageItem } from "../hooks/useStorage";
import BreadcrumbNav from "./BreadcrumbNav";
import FileList from "./FileList";
import UploadZone from "./UploadZone";

interface Props {
  user: User;
  onSignOut: () => void;
}

export default function FileExplorer({ user, onSignOut }: Props) {
  const [currentPath, setCurrentPath] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
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
    clearUploads,
  } = useStorage();

  const refresh = useCallback(() => {
    listPath(currentPath);
  }, [currentPath, listPath]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleUpload = (files: File[]) => {
    uploadFiles(files, currentPath, refresh);
  };

  const handleMove = async (item: StorageItem, targetFolderPath: string) => {
    await moveItem(item, targetFolderPath);
    refresh();
  };

  const handleRename = async (item: StorageItem, newName: string) => {
    await renameItem(item, newName);
    refresh();
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

  return (
    <div className="min-h-screen bg-gray-950 text-white">
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
          <BreadcrumbNav path={currentPath} onNavigate={setCurrentPath} onMove={handleMove} />
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
            onNavigate={setCurrentPath}
            onDelete={handleDelete}
            onMove={handleMove}
            onRename={handleRename}
          />
        </div>
      </div>
    </div>
  );
}
