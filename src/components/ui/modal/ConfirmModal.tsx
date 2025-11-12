import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export default function ConfirmModal ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isDestructive = false,
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#F0F0F3] rounded-3xl shadow-[-6px_-6px_12px_rgba(255,255,255,0.9),6px_6px_12px_rgba(174,174,192,0.2)] p-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {isDestructive &&
              <div className="w-10 h-10 rounded-full bg-[#ffd9d9] flex items-center justify-center">
                <AlertTriangle size={20} className="text-[#c92a2a]" />
              </div>
            }
            <h2 className={`text-xl font-bold ${isDestructive ? "text-[#c92a2a]" : "text-[#4A90E2]"}`}>
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-8 h-8 rounded-full bg-[#F0F0F3] shadow-[-3px_-3px_6px_rgba(255,255,255,0.9),3px_3px_6px_rgba(174,174,192,0.2)] hover:shadow-[inset_2px_2px_4px_rgba(174,174,192,0.2)] flex items-center justify-center transition-all disabled:opacity-60"
          >
            <X size={16} className="text-[#6a6a6a]" />
          </button>
        </div>

        {/* Message */}
        <p className="text-[#4a4a4a] mb-6 text-sm leading-relaxed">{message}</p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#F0F0F3] text-[#6a6a6a] font-semibold shadow-[-4px_-4px_8px_rgba(255,255,255,0.8),4px_4px_8px_rgba(174,174,192,0.25)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.9),2px_2px_4px_rgba(174,174,192,0.3)] disabled:opacity-60 transition-all text-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white font-bold shadow-[-4px_-4px_8px_rgba(255,255,255,0.6),4px_4px_8px_rgba(174,174,192,0.4)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.7),2px_2px_4px_rgba(174,174,192,0.5)] disabled:opacity-60 transition-all text-sm ${
              isDestructive ? "bg-[#c92a2a]" : "bg-[#4A90E2]"
            }`}
          >
            {isLoading ? "Processando..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
