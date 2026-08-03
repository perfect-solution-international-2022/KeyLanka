"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { X, Upload, Loader2, Pencil } from "lucide-react";

async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(body.error ?? "Upload failed");
  }
  const data = await res.json();
  return data.url as string;
}

export function ImageUploader({
  images,
  onChange,
  multiple = false,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  multiple?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        uploaded.push(await uploadFile(file));
      }
      onChange(multiple ? [...images, ...uploaded] : [uploaded[0]]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const showReplace = !multiple && images.length > 0;

  function removeAt(idx: number) {
    onChange(images.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((src, idx) => (
          <div key={src + idx} className="relative h-24 w-24 rounded-md border border-gray-200 bg-gray-50 overflow-hidden group">
            <Image src={src} alt="" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
            {showReplace && (
              <button
                type="button"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
                aria-label="Replace image"
                title="Replace image"
                className="absolute inset-0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
              >
                {uploading ? <Loader2 size={20} className="animate-spin" /> : <Pencil size={20} />}
              </button>
            )}
            <button
              type="button"
              onClick={() => removeAt(idx)}
              aria-label="Remove image"
              title="Remove image"
              className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {(multiple || images.length === 0) && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="h-24 w-24 rounded-md border border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-brand hover:text-brand transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            <span className="text-[10px]">{uploading ? "Optimizing" : "Add image"}</span>
          </button>
        )}
      </div>
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
