import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import Modal from "@/components/ui/modal/Modal";
import { Calendar, DollarSign, FileText, Tag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    id: number;
    amount: number;
    type: "INCOME" | "EXPENSE";
    description?: string | null;
    transactionDate: string;
    status: string;
    isPaid?: boolean;
    category?: { id: number; name: string } | null;
    createdBy?: { id: number; name: string } | null;
  } | null;
  groupId: number;
  currentUserId: number;
  isAdmin: boolean;
  onSuccess?: () => void;
}

interface Category {
  id: number;
  name: string;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
}

function formatDate(dateString: string) {
  const d = new Date(dateString);
  return d.toLocaleString("pt-BR", { 
    day: "2-digit", 
    month: "2-digit", 
    year: "numeric", 
    hour: "2-digit", 
    minute: "2-digit" 
  });
}

export default function TransactionDetailModal({
  isOpen,
  onClose,
  transaction,
  groupId,
  currentUserId,
  isAdmin,
  onSuccess,
}: TransactionDetailModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [selectedStatus, setSelectedStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const canEdit = transaction && (transaction.createdBy?.id === currentUserId || isAdmin);

  useEffect(() => {
    if (isOpen && transaction) {
      setSelectedCategory(transaction.category?.id);
      setSelectedStatus(transaction.status);
      loadCategories();
    }
  }, [isOpen, transaction]);

  async function loadCategories() {
    try {
      const res = await fetch(`/api/categories?groupId=${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
    }
  }

  async function handleUpdateStatus() {
    if (!transaction) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao atualizar status");
        return;
      }

      const result = await res.json();
      
      // Atualizar o estado local da transação
      transaction.status = selectedStatus;
      
      // Sincronizar isPaid com o status atualizado do servidor
      if (result.data) {
        transaction.isPaid = result.data.isPaid;
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar status");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateCategory() {
    if (!transaction) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: selectedCategory || null }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao atualizar categoria");
        return;
      }

      // Atualizar o estado local da transação
      const updatedCategory = categories.find(c => c.id === selectedCategory);
      if (selectedCategory && updatedCategory) {
        transaction.category = updatedCategory;
      } else {
        transaction.category = null;
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar categoria");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!transaction) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao excluir transação");
        return;
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir transação");
    } finally {
      setSubmitting(false);
      setShowDeleteConfirm(false);
    }
  }

  if (!transaction) return null;

  const isIncome = transaction.type === "INCOME";

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Detalhes da Transação">
        <div className="space-y-4">
          {error && (
            <div className="bg-[#ffd9d9] rounded-xl p-3 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.08)] border border-[#ffb3b3]/30">
              <p className="text-[#c92a2a] text-sm">{error}</p>
            </div>
          )}

          {/* Valor */}
          <div className="p-4 bg-[#F0F0F3] rounded-xl shadow-[inset_2px_2px_4px_rgba(174,174,192,0.12)]">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={16} className="text-[#4A90E2]" />
              <span className="text-xs font-medium text-[#6a6a6a]">Valor</span>
            </div>
            <p className={`text-2xl font-bold ${isIncome ? "text-[#4A90E2]" : "text-[#c92a2a]"}`}>
              {isIncome ? "+" : "-"} {formatCurrency(transaction.amount)}
            </p>
          </div>

          {/* Descrição */}
          {transaction.description && (
            <div className="p-4 bg-[#F0F0F3] rounded-xl shadow-[inset_2px_2px_4px_rgba(174,174,192,0.12)]">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={16} className="text-[#4A90E2]" />
                <span className="text-xs font-medium text-[#6a6a6a]">Descrição</span>
              </div>
              <p className="text-sm text-[#4a4a4a]">{transaction.description}</p>
            </div>
          )}

          {/* Data */}
          <div className="p-4 bg-[#F0F0F3] rounded-xl shadow-[inset_2px_2px_4px_rgba(174,174,192,0.12)]">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} className="text-[#4A90E2]" />
              <span className="text-xs font-medium text-[#6a6a6a]">Data</span>
            </div>
            <p className="text-sm text-[#4a4a4a]">{formatDate(transaction.transactionDate)}</p>
          </div>

          {/* Criado por */}
          {transaction.createdBy && (
            <div className="p-4 bg-[#F0F0F3] rounded-xl shadow-[inset_2px_2px_4px_rgba(174,174,192,0.12)]">
              <span className="text-xs font-medium text-[#6a6a6a]">Criado por: </span>
              <span className="text-sm text-[#4a4a4a] font-medium">{transaction.createdBy.name}</span>
            </div>
          )}

          {canEdit && (
            <>
              {/* Status */}
              <div>
                <label className="block text-sm text-[#4a4a4a] font-semibold mb-2">Status da Transação</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F0F0F3] text-[#4a4a4a] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2)] focus:outline-none text-sm"
                >
                  <option value="PENDING">Pendente</option>
                  <option value="PAID">Pago</option>
                  <option value="OVERDUE">Atrasado</option>
                  <option value="CANCELLED">Cancelado</option>
                  <option value="PARTIALLY_PAID">Parcialmente Pago</option>
                </select>
                {selectedStatus !== transaction.status && (
                  <button
                    onClick={handleUpdateStatus}
                    disabled={submitting}
                    className="w-full mt-2 px-4 py-2 rounded-xl bg-[#4A90E2] text-white font-semibold shadow-[-3px_-3px_6px_rgba(255,255,255,0.6),3px_3px_6px_rgba(174,174,192,0.4)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.7),2px_2px_4px_rgba(174,174,192,0.5)] disabled:opacity-60 transition-all text-sm"
                  >
                    {submitting ? "Atualizando..." : "Atualizar Status"}
                  </button>
                )}
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm text-[#4a4a4a] font-semibold mb-2">
                  <Tag size={16} className="inline mr-1 mb-0.5" />
                  Categoria
                </label>
                <select
                  value={selectedCategory || ""}
                  onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F0F0F3] text-[#4a4a4a] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2)] focus:outline-none text-sm"
                >
                  <option value="">Sem categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {selectedCategory !== transaction.category?.id && (
                  <button
                    onClick={handleUpdateCategory}
                    disabled={submitting}
                    className="w-full mt-2 px-4 py-2 rounded-xl bg-[#4A90E2] text-white font-semibold shadow-[-3px_-3px_6px_rgba(255,255,255,0.6),3px_3px_6px_rgba(174,174,192,0.4)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.7),2px_2px_4px_rgba(174,174,192,0.5)] disabled:opacity-60 transition-all text-sm"
                  >
                    {submitting ? "Atualizando..." : "Atualizar Categoria"}
                  </button>
                )}
              </div>

              {/* Excluir */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#c92a2a] text-white font-bold shadow-[-4px_-4px_8px_rgba(255,255,255,0.6),4px_4px_8px_rgba(174,174,192,0.4)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.7),2px_2px_4px_rgba(174,174,192,0.5)] disabled:opacity-60 transition-all text-sm"
              >
                <Trash2 size={18} />
                <span>Excluir Transação</span>
              </button>
            </>
          )}
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Excluir Transação"
        message="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        isDestructive
        isLoading={submitting}
      />
    </>
  );
}
