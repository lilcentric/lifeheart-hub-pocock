"use client";

import { useRef, useState, useCallback } from "react";
import { getStaffUploadUrl, recordStaffUpload } from "@/app/actions/multi-upload";

interface Props {
  token: string;
  documentType: string;
  initialCount?: number;
}

interface UploadedFile {
  filename: string;
  error?: string;
}

export default function MultiFileUpload({
  token,
  documentType,
  initialCount = 0,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [totalCount, setTotalCount] = useState(initialCount);
  const [dragOver, setDragOver] = useState(false);

  const uploadFiles = useCallback(
    async (files: FileList) => {
      if (files.length === 0) return;
      setUploading(true);

      const results: UploadedFile[] = [];
      for (const file of Array.from(files)) {
        const urlResult = await getStaffUploadUrl(token, documentType, file.name);
        if ("error" in urlResult) {
          results.push({ filename: file.name, error: urlResult.error });
          continue;
        }

        const { uploadUrl, storagePath } = urlResult;
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type || "application/octet-stream" },
        });

        if (!uploadRes.ok) {
          results.push({ filename: file.name, error: "Upload failed" });
          continue;
        }

        const recordResult = await recordStaffUpload(
          token,
          documentType,
          storagePath,
          file.name
        );

        if ("error" in recordResult) {
          results.push({ filename: file.name, error: recordResult.error });
        } else {
          results.push({ filename: file.name });
          setTotalCount((n) => n + 1);
        }
      }

      setUploadedFiles((prev) => [...prev, ...results]);
      setUploading(false);
    },
    [token, documentType]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) uploadFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) uploadFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleChange}
          disabled={uploading}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-sm text-blue-600 hover:underline disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Choose files or drop here"}
        </button>
        <p className="mt-1 text-xs text-gray-400">
          PDF, JPG, PNG accepted — no file limit
        </p>
      </div>

      {totalCount > 0 && (
        <p className="text-xs text-gray-500">
          {totalCount} file{totalCount !== 1 ? "s" : ""} uploaded
        </p>
      )}

      {uploadedFiles.length > 0 && (
        <ul className="space-y-1">
          {uploadedFiles.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              {f.error ? (
                <>
                  <span className="text-red-500">✕</span>
                  <span className="text-gray-700">{f.filename}</span>
                  <span className="text-red-500 text-xs">({f.error})</span>
                </>
              ) : (
                <>
                  <span className="text-green-600">✓</span>
                  <span className="text-gray-700">{f.filename}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
