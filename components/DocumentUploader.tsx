"use client";

import { useRef, useState } from "react";
import { X, Upload, Loader2, FileText } from "lucide-react";

interface UploadedDoc {
  url: string;
  name: string;
}

async function uploadFile(file: File): Promise<UploadedDoc> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/locksmith/upload", { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(body.error ?? "Upload failed");
  }
  return res.json();
}

export function DocumentUploader({
  urls,
  onChange,
  multiple = false,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");
    setUploading(true);
    try {
      const uploaded: UploadedDoc[] = [];
      for (const file of Array.from(files)) {
        uploaded.push(await uploadFile(file));
      }
      setNames((prev) => {
        const next = { ...prev };
        uploaded.forEach((u) => (next[u.url] = u.name));
        return next;
      });
      onChange(multiple ? [...urls, ...uploaded.map((u) => u.url)] : [uploaded[0].url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(idx: number) {
    onChange(urls.filter((_, i) => i !== idx));
  }

  return (
    <div>
      {urls.length > 0 && (
        <ul className="space-y-1.5 mb-2">
          {urls.map((url, idx) => (
            <li
              key={url + idx}
              className="flex items-center gap-2 text-xs bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5"
            >
              <FileText size={14} className="text-gray-400 shrink-0" />
              <span className="truncate flex-1 text-gray-700">{names[url] ?? url.split("/").pop()}</span>
              <button type="button" onClick={() => removeAt(idx)} className="text-gray-400 hover:text-destructive shrink-0">
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {(multiple || urls.length === 0) && (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 rounded-md py-2.5 text-xs text-gray-500 hover:border-brand hover:text-brand transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? "Uploading..." : "Upload file (JPG, PNG or PDF)"}
        </button>
      )}
      {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
