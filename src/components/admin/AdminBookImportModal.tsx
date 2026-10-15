"use client";

import { useState, useRef } from "react";
import {
  X,
  Upload,
  FileText,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FolderPlus,
  Trash2,
  Layers,
} from "lucide-react";

interface AdminBookImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminBookImportModal({
  isOpen,
  onClose,
  onSuccess,
}: AdminBookImportModalProps) {
  const [importMode, setImportMode] = useState<"separate_books" | "single_book_chapters">("separate_books");
  const [singleTitle, setSingleTitle] = useState("");
  const [singleAuthor, setSingleAuthor] = useState("Tác giả Tuyển Chọn");
  const [singleDescription, setSingleDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<{ filename: string; content: string; size: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMsg("");
    setSuccessMsg("");

    const newFiles: { filename: string; content: string; size: number }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await file.text();
        newFiles.push({
          filename: file.name,
          content: text,
          size: file.size,
        });
      } catch (err) {
        console.error("Error reading file:", file.name, err);
      }
    }

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleImport = async () => {
    if (selectedFiles.length === 0) {
      setErrorMsg("Vui lòng chọn ít nhất một tệp để tải lên.");
      return;
    }

    if (importMode === "single_book_chapters" && !singleTitle.trim()) {
      setErrorMsg("Vui lòng nhập Tên cuốn sách khi chọn chế độ tạo 1 cuốn.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload: any = {
        importMode,
        files: selectedFiles.map((f) => ({
          filename: f.filename,
          content: f.content,
        })),
      };

      if (importMode === "single_book_chapters") {
        payload.singleBookTitle = singleTitle.trim();
        payload.singleBookAuthor = singleAuthor.trim();
        payload.singleBookDescription = singleDescription.trim();
      }

      const res = await fetch("/api/admin/books/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message || "Đã nhập sách thành công!");
        setSelectedFiles([]);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setErrorMsg(data.error || "Có lỗi xảy ra khi nhập sách.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi mạng hoặc máy chủ không phản hồi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border/50 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-foreground">
                Nhập Sách Hàng Loạt Từ Tệp
              </h2>
              <p className="text-xs text-muted-foreground">
                Hỗ trợ tải lên 1 hoặc nhiều tệp TXT, MD, JSON cùng lúc
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex flex-col gap-5 text-xs">
          {/* Mode Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-foreground">Chế Độ Xử Lý Tệp</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setImportMode("separate_books")}
                className={`p-3.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  importMode === "separate_books"
                    ? "border-emerald-500 bg-emerald-500/10 text-foreground"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:border-border"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Bookmark className="w-4 h-4 text-emerald-500" />
                  Mỗi tệp là 1 cuốn Sách riêng
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Tên tệp làm Tên sách. Hệ thống tự động quét và phân chia các chương (Chương 1, Chương 2...).
                </span>
              </button>

              <button
                type="button"
                onClick={() => setImportMode("single_book_chapters")}
                className={`p-3.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  importMode === "single_book_chapters"
                    ? "border-emerald-500 bg-emerald-500/10 text-foreground"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:border-border"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Layers className="w-4 h-4 text-teal-500" />
                  Tất cả tệp là Chương của 1 Sách
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Ghép toàn bộ các tệp đã chọn thành các chương liên tiếp của cùng 1 cuốn sách.
                </span>
              </button>
            </div>
          </div>

          {/* Single Book Fields if in single mode */}
          {importMode === "single_book_chapters" && (
            <div className="p-4 rounded-xl bg-muted/40 border border-border/60 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-foreground">Tên Cuốn Sách *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đắc Nhân Tâm (Bản Chuẩn Trọn Bộ)"
                  value={singleTitle}
                  onChange={(e) => setSingleTitle(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-card border border-border text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="font-bold text-foreground">Tác Giả</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Dale Carnegie"
                    value={singleAuthor}
                    onChange={(e) => setSingleAuthor(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-card border border-border text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <label className="font-bold text-foreground">Giới Thiệu Tóm Tắt</label>
                  <input
                    type="text"
                    placeholder="Tóm tắt ngắn nội dung sách..."
                    value={singleDescription}
                    onChange={(e) => setSingleDescription(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-card border border-border text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Upload Drop Zone */}
          <div className="flex flex-col gap-2">
            <label className="font-bold text-foreground">Chọn Tệp Sách Cần Tải Lên</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border/70 hover:border-emerald-500 rounded-2xl p-6 text-center bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer flex flex-col items-center gap-2"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-foreground">Nhấp để chọn tệp hoặc kéo thả vào đây</span>
                <span className="text-[11px] text-muted-foreground">
                  Hỗ trợ định dạng .txt, .md, .json (Chọn nhiều tệp cùng lúc thoải mái)
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.md,.json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">
                  Danh sách tệp đã chọn ({selectedFiles.length} tệp)
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedFiles([])}
                  className="text-rose-500 hover:underline font-bold text-[11px]"
                >
                  Xóa tất cả
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto border border-border/50 rounded-xl divide-y divide-border/40 bg-card">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 flex items-center justify-between gap-2 hover:bg-muted/30 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="font-medium text-foreground truncate">{file.filename}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="p-1 rounded text-muted-foreground hover:text-rose-500 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alert Messages */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-border/50 bg-muted/20 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground font-bold text-xs transition-colors cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={loading || selectedFiles.length === 0}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Đang xử lý & phân chương...
              </>
            ) : (
              <>
                <FolderPlus className="w-4 h-4" />
                Tiến Hành Nhập ({selectedFiles.length} tệp)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
