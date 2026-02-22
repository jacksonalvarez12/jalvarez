import { useState, useCallback } from "react";
import {
  ref,
  listAll,
  getDownloadURL,
  getMetadata,
  uploadBytesResumable,
  deleteObject,
} from "firebase/storage";
import { storage } from "../lib/firebase";

async function deleteFolderRecursive(folderPath: string) {
  const folderRef = ref(storage, folderPath);
  const result = await listAll(folderRef);
  await Promise.all([
    ...result.prefixes.map((prefix) => deleteFolderRecursive(prefix.fullPath)),
    ...result.items.map((item) => deleteObject(item)),
  ]);
}

export interface FileItem {
  type: "file";
  name: string;
  fullPath: string;
  downloadURL: string;
  size: number;
  updatedAt: Date;
}

export interface FolderItem {
  type: "folder";
  name: string;
  fullPath: string;
}

export type StorageItem = FileItem | FolderItem;

export interface UploadTask {
  name: string;
  progress: number;
  done: boolean;
  error?: string;
}

export function useStorage() {
  const [items, setItems] = useState<StorageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploads, setUploads] = useState<UploadTask[]>([]);

  const listPath = useCallback(async (path: string) => {
    setLoading(true);
    try {
      const listRef = ref(storage, path || "/");
      const result = await listAll(listRef);

      const folders: FolderItem[] = result.prefixes.map((r) => ({
        type: "folder",
        name: r.name,
        fullPath: r.fullPath,
      }));

      const files: FileItem[] = await Promise.all(
        result.items
          .filter((r) => r.name !== ".keep")
          .map(async (r) => {
            const [url, meta] = await Promise.all([
              getDownloadURL(r),
              getMetadata(r),
            ]);
            return {
              type: "file" as const,
              name: r.name,
              fullPath: r.fullPath,
              downloadURL: url,
              size: meta.size,
              updatedAt: new Date(meta.updated),
            };
          }),
      );

      setItems([...folders, ...files]);
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadFiles = useCallback(
    (files: File[], currentPath: string, onDone: () => void) => {
      const newUploads: UploadTask[] = files.map((f) => ({
        name: f.name,
        progress: 0,
        done: false,
      }));
      setUploads((prev) => [...prev, ...newUploads]);

      let completedCount = 0;

      files.forEach((file, i) => {
        const globalIndex = uploads.length + i;
        const storageRef = ref(
          storage,
          `${currentPath ? currentPath + "/" : ""}${file.name}`,
        );
        const task = uploadBytesResumable(storageRef, file);

        task.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploads((prev) =>
              prev.map((u, idx) =>
                idx === globalIndex ? { ...u, progress } : u,
              ),
            );
          },
          (error) => {
            setUploads((prev) =>
              prev.map((u, idx) =>
                idx === globalIndex
                  ? { ...u, done: true, error: error.message }
                  : u,
              ),
            );
          },
          () => {
            setUploads((prev) =>
              prev.map((u, idx) =>
                idx === globalIndex ? { ...u, progress: 100, done: true } : u,
              ),
            );
            completedCount++;
            if (completedCount === files.length) {
              onDone();
            }
          },
        );
      });
    },
    [uploads.length],
  );

  const createFolder = useCallback(
    async (currentPath: string, folderName: string) => {
      const keepRef = ref(
        storage,
        `${currentPath ? currentPath + "/" : ""}${folderName}/.keep`,
      );
      await uploadBytesResumable(keepRef, new Uint8Array(0)).then();
    },
    [],
  );

  const deleteItem = useCallback(async (fullPath: string) => {
    const itemRef = ref(storage, fullPath);
    await deleteObject(itemRef);
  }, []);

  const deleteFolder = useCallback(async (fullPath: string) => {
    await deleteFolderRecursive(fullPath);
  }, []);

  const clearUploads = useCallback(() => setUploads([]), []);

  return {
    items,
    loading,
    uploads,
    listPath,
    uploadFiles,
    createFolder,
    deleteItem,
    deleteFolder,
    clearUploads,
  };
}
