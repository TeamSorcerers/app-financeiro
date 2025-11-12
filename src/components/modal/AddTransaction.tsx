import Modal from "@/components/ui/modal/Modal";
import gateways from "@/lib/client/gateways";
import { HTTP_STATUS } from "@/lib/shared/constants";
import { TransactionSchema, TransactionSchemaData } from "@/lib/shared/schemas/transaction";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Building2, Calendar, CheckCircle, CreditCard as CreditCardIcon, DollarSign, FileText, Tag, Wallet } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Resolver, SubmitHandler, useForm } from "react-hook-form";

interface AddTransactionProps {
  groupId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Category {
  id: number;
  name: string;
}

interface PaymentMethod {
  id: number;
  name: string;
  type: string;
}

interface BankAccount {
  id: number;
  name: string;
  bank: string;
}

interface CreditCard {
  id: number;
  name: string;
  last4Digits: string;
  brand: string;
}

export default function AddTransaction ({ groupId, isOpen, onClose, onSuccess }: AddTransactionProps) {
  const [ categories, setCategories ] = useState<Category[]>([]);
  const [ paymentMethods, setPaymentMethods ] = useState<PaymentMethod[]>([]);
  const [ bankAccounts, setBankAccounts ] = useState<BankAccount[]>([]);
  const [ creditCards, setCreditCards ] = useState<CreditCard[]>([]);
  const [ loadingData, setLoadingData ] = useState(false);

  const resolver = zodResolver(TransactionSchema) as Resolver<TransactionSchemaData>;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TransactionSchemaData>({
    resolver,
    mode: "onChange",
    defaultValues: {
      type: "EXPENSE",
      transactionDate: new Date(),
      groupId,
      isPaid: false,
    },
  });

  const loadFormData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [ categoriesRes, paymentMethodsRes, bankAccountsRes, creditCardsRes ] = await Promise.all([
        fetch(`/api/categories?groupId=${groupId}`, { credentials: "include" }),
        fetch("/api/payment-methods", { credentials: "include" }),
        fetch("/api/bank-accounts", { credentials: "include" }),
        fetch("/api/credit-cards", { credentials: "include" }),
      ]);

      if (categoriesRes.ok) {
        const data = await categoriesRes.json();

        setCategories(data.categories || []);
      }

      if (paymentMethodsRes.ok) {
        const data = await paymentMethodsRes.json();

        setPaymentMethods(data.paymentMethods || []);
      }

      if (bankAccountsRes.ok) {
        const data = await bankAccountsRes.json();

        setBankAccounts(data.bankAccounts || []);
      }

      if (creditCardsRes.ok) {
        const data = await creditCardsRes.json();

        setCreditCards(data.creditCards || []);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do formulário:", err);
    } finally {
      setLoadingData(false);
    }
  }, [ groupId ]);

  useEffect(() => {
    setValue("groupId", groupId);
  }, [ groupId, setValue ]);

  useEffect(() => {
    if (isOpen) {
      reset({
        type: "EXPENSE",
        transactionDate: new Date(),
        groupId,
        isPaid: false,
      });
      loadFormData();
    }
  }, [ isOpen, reset, groupId, loadFormData ]);

  const selectedType = watch("type");
  const selectedPaymentMethodId = watch("paymentMethodId");

  // Buscar o método de pagamento selecionado para determinar se precisa de campos adicionais
  const selectedPaymentMethod = paymentMethods.find((pm) => pm.id === Number(selectedPaymentMethodId));
  const needsBankAccount = selectedPaymentMethod?.type === "DEBIT_CARD" || selectedPaymentMethod?.type === "BANK_TRANSFER";
  const needsCreditCard = selectedPaymentMethod?.type === "CREDIT_CARD";

  const onSubmit: SubmitHandler<TransactionSchemaData> = async (data) => {
    try {
      const payload = {
        ...data,
        transactionDate: new Date(data.transactionDate).toISOString(),
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        paidAt: data.status === "PAID" && data.isPaid ? new Date().toISOString() : undefined,
        // Corrigir NaN: se categoryId for undefined/null, remover do payload
        categoryId: data.categoryId || undefined,
        paymentMethodId: data.paymentMethodId || undefined,
        bankAccountId: data.bankAccountId || undefined,
        creditCardId: data.creditCardId || undefined,
      };

      const response = await fetch(gateways.CREATE_TRANSACTION(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === HTTP_STATUS.BAD_REQUEST) {
          setError("root", {
            type: "server",
            message: result.error || "Dados inválidos",
          });

          return;
        }
        setError("root", {
          type: "server",
          message: result.error || "Erro interno do servidor",
        });

        return;
      }

      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch {
      setError("root", {
        type: "network",
        message: "Erro de conexão. Tente novamente.",
      });
    }
  };

  const getSubmitButtonText = () => {
    if (isSubmitting) {
      return "Salvando...";
    }
    if (loadingData) {
      return "Carregando...";
    }

    return "Salvar Transação";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Transação">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root?.message &&
          <div className="bg-[#ffd9d9] rounded-xl p-3 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.08)] border border-[#ffb3b3]/30">
            <p className="text-[#c92a2a] text-sm text-center">{errors.root.message}</p>
          </div>
        }

        {/* Tipo de Transação */}
        <div>
          <label className="block text-[#4a4a4a] text-sm font-semibold mb-2">Tipo de Transação</label>
          <div className="grid grid-cols-2 gap-3">
            <label className="cursor-pointer">
              <input type="radio" value="INCOME" className="sr-only peer" {...register("type")} />
              <div className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all font-medium ${selectedType === "INCOME" ? "bg-[#F0F0F3] text-[#4A90E2] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.2),inset_-3px_-3px_6px_rgba(255,255,255,0.9)]" : "bg-[#F0F0F3] text-[#6a6a6a] shadow-[-4px_-4px_8px_rgba(255,255,255,0.8),4px_4px_8px_rgba(174,174,192,0.25)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.9),2px_2px_4px_rgba(174,174,192,0.3)]"}`}>
                <ArrowUp size={16} />
                <span className="text-sm">Receita</span>
              </div>
            </label>

            <label className="cursor-pointer">
              <input type="radio" value="EXPENSE" className="sr-only peer" {...register("type")} />
              <div className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all font-medium ${selectedType === "EXPENSE" ? "bg-[#F0F0F3] text-[#c92a2a] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.2),inset_-3px_-3px_6px_rgba(255,255,255,0.9)]" : "bg-[#F0F0F3] text-[#6a6a6a] shadow-[-4px_-4px_8px_rgba(255,255,255,0.8),4px_4px_8px_rgba(174,174,192,0.25)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.9),2px_2px_4px_rgba(174,174,192,0.3)]"}`}>
                <ArrowDown size={16} />
                <span className="text-sm">Despesa</span>
              </div>
            </label>
          </div>
        </div>

        {/* Método de Pagamento */}
        <div>
          <label className="block text-[#4a4a4a] text-sm font-semibold mb-2">
            <Wallet size={16} className="inline mr-1 mb-0.5" />
            Método de Pagamento
          </label>
          <select
            className="w-full px-3 py-2.5 rounded-xl bg-[#F0F0F3] text-[#4a4a4a] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] focus:outline-none transition-shadow text-sm"
            {...register("paymentMethodId", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
          >
            <option value="">Selecione...</option>
            {paymentMethods.map((pm) => <option key={pm.id} value={pm.id}>{pm.name} ({pm.type})</option>)}
          </select>
        </div>

        {/* Valor */}
        <div>
          <label className="block text-[#4a4a4a] text-sm font-semibold mb-2">
            Valor <span className="text-[#c92a2a]">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6a6a6a]">
              <DollarSign size={16} />
            </div>
            <input
              type="number"
              step="0.01"
              placeholder="0,00"
              className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#F0F0F3] text-[#4a4a4a] placeholder:text-[#a0a0a0] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] focus:outline-none transition-shadow text-sm"
              {...register("amount", { valueAsNumber: true })}
            />
          </div>
          {errors.amount && <p className="mt-1 text-xs text-[#c92a2a]">{errors.amount.message}</p>}
        </div>

        {/* Status da Transação */}
        <div>
          <label className="block text-[#4a4a4a] text-sm font-semibold mb-2">
            <CheckCircle size={16} className="inline mr-1 mb-0.5" />
            Status
          </label>
          <select
            className="w-full px-3 py-2.5 rounded-xl bg-[#F0F0F3] text-[#4a4a4a] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] focus:outline-none transition-shadow text-sm"
            {...register("status")}
          >
            <option value="PENDING">Pendente</option>
            <option value="PAID">Pago</option>
            <option value="OVERDUE">Atrasado</option>
            <option value="CANCELLED">Cancelado</option>
            <option value="PARTIALLY_PAID">Parcialmente Pago</option>
          </select>
          {errors.status && <p className="mt-1 text-xs text-[#c92a2a]">{errors.status.message}</p>}
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-[#4a4a4a] text-sm font-semibold mb-2">Descrição (opcional)</label>
          <div className="relative">
            <div className="absolute left-3 top-3 text-[#6a6a6a]">
              <FileText size={16} />
            </div>
            <textarea
              placeholder="Ex: Supermercado, Salário, etc."
              rows={2}
              className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#F0F0F3] text-[#4a4a4a] placeholder:text-[#a0a0a0] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] focus:outline-none transition-shadow resize-none text-sm"
              {...register("description")}
            />
          </div>
          {errors.description && <p className="mt-1 text-xs text-[#c92a2a]">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Data e Hora */}
          <div>
            <label className="block text-[#4a4a4a] text-sm font-semibold mb-2">
              <Calendar size={16} className="inline mr-1 mb-0.5" />
              Data <span className="text-[#c92a2a]">*</span>
            </label>
            <input
              type="datetime-local"
              className="w-full px-3 py-2.5 rounded-xl bg-[#F0F0F3] text-[#4a4a4a] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] focus:outline-none transition-shadow text-sm"
              {...register("transactionDate")}
            />
            {errors.transactionDate && <p className="mt-1 text-xs text-[#c92a2a]">{errors.transactionDate.message}</p>}
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-[#4a4a4a] text-sm font-semibold mb-2">
              <Tag size={16} className="inline mr-1 mb-0.5" />
              Categoria
            </label>
            <select
              className="w-full px-3 py-2.5 rounded-xl bg-[#F0F0F3] text-[#4a4a4a] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] focus:outline-none transition-shadow text-sm"
              {...register("categoryId", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
            >
              <option value="">Selecione...</option>
              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
        </div>

        {/* Conta Bancária (condicional - apenas para débito e transferência) */}
        {needsBankAccount &&
          <div>
            <label className="block text-[#4a4a4a] text-sm font-semibold mb-2">
              <Building2 size={16} className="inline mr-1 mb-0.5" />
              Conta Bancária
            </label>
            <select
              className="w-full px-3 py-2.5 rounded-xl bg-[#F0F0F3] text-[#4a4a4a] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] focus:outline-none transition-shadow text-sm"
              {...register("bankAccountId", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
            >
              <option value="">Selecione...</option>
              {bankAccounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.name} - {acc.bank}</option>)}
            </select>
          </div>
        }

        {/* Cartão de Crédito (condicional - apenas para cartão de crédito) */}
        {needsCreditCard &&
          <div>
            <label className="block text-[#4a4a4a] text-sm font-semibold mb-2">
              <CreditCardIcon size={16} className="inline mr-1 mb-0.5" />
              Cartão de Crédito
            </label>
            <select
              className="w-full px-3 py-2.5 rounded-xl bg-[#F0F0F3] text-[#4a4a4a] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] focus:outline-none transition-shadow text-sm"
              {...register("creditCardId", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
            >
              <option value="">Selecione...</option>
              {creditCards.map((card) => <option key={card.id} value={card.id}>{card.name} •••• {card.last4Digits}</option>)}
            </select>
          </div>
        }

        {/* Botões */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#F0F0F3] text-[#6a6a6a] font-semibold shadow-[-4px_-4px_8px_rgba(255,255,255,0.8),4px_4px_8px_rgba(174,174,192,0.25)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.9),2px_2px_4px_rgba(174,174,192,0.3)] active:shadow-[inset_2px_2px_4px_rgba(174,174,192,0.2)] disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={isSubmitting || loadingData}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#4A90E2] text-white font-bold shadow-[-4px_-4px_8px_rgba(255,255,255,0.6),4px_4px_8px_rgba(174,174,192,0.4)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.7),2px_2px_4px_rgba(174,174,192,0.5)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.2)] disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm"
          >
            {getSubmitButtonText()}
          </button>
        </div>
      </form>
    </Modal>
  );
}
