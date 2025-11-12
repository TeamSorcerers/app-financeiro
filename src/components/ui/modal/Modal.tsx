import { X } from "lucide-react";
import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal ({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [ isOpen, onClose ]);

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
        className="w-full max-w-lg bg-[#F0F0F3] rounded-3xl shadow-[-6px_-6px_12px_rgba(255,255,255,0.9),6px_6px_12px_rgba(174,174,192,0.2)] p-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#4A90E2]">{title}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#F0F0F3] shadow-[-4px_-4px_8px_rgba(255,255,255,0.8),4px_4px_8px_rgba(174,174,192,0.25)] hover:shadow-[inset_2px_2px_4px_rgba(174,174,192,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center transition-all"
            aria-label="Fechar modal"
          >
            <X size={20} className="text-[#6a6a6a]" />
          </button>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
