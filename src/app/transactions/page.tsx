"use client";

import TransactionDetailModal from "@/components/modal/TransactionDetailModal";
import { MINUS_ONE, PAD_LENGTH, ZERO } from "@/lib/shared/constants";
import { ArrowDown, ArrowLeft, ArrowUp, Calendar, DollarSign, Filter, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface TransactionItem {
  id: number;
  amount: number;
  type: "INCOME" | "EXPENSE";
  description?: string | null;
  transactionDate: string;
  isPaid: boolean;
  status: string;
  category?: { id: number; name: string } | null;
  createdBy?: { id: number; name: string } | null;
  group?: { id: number; name: string } | null;
}

type FilterType = "ALL" | "INCOME" | "EXPENSE" | "PAID" | "PENDING";

function formatCurrency (amount: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
}

function formatDate (dateString: string) {
  const d = new Date(dateString);

  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TransactionsPage () {
  const { status: sessionStatus, data: session } = useSession();
  const router = useRouter();

  const [ transactions, setTransactions ] = useState<TransactionItem[]>([]);
  const [ filteredTransactions, setFilteredTransactions ] = useState<TransactionItem[]>([]);
  const [ loading, setLoading ] = useState(true);
  const [ error, setError ] = useState<string | null>(null);

  const [ showTransactionDetail, setShowTransactionDetail ] = useState(false);
  const [ selectedTransaction, setSelectedTransaction ] = useState<TransactionItem | null>(null);

  const [ searchTerm, setSearchTerm ] = useState("");
  const [ filterType, setFilterType ] = useState<FilterType>("ALL");
  const [ selectedMonth, setSelectedMonth ] = useState<string>("");

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [ sessionStatus, router ]);

  async function loadTransactions () {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/transactions", { credentials: "include" });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));

        setError(body?.error || "Erro ao carregar transações");

        return;
      }

      const json = await res.json();

      setTransactions(json.data || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  const applyFilters = useCallback(() => {
    let filtered = [ ...transactions ];

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter((t) => t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.group?.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Filtro de tipo
    if (filterType === "INCOME") {
      filtered = filtered.filter((t) => t.type === "INCOME");
    } else if (filterType === "EXPENSE") {
      filtered = filtered.filter((t) => t.type === "EXPENSE");
    } else if (filterType === "PAID") {
      filtered = filtered.filter((t) => t.isPaid);
    } else if (filterType === "PENDING") {
      filtered = filtered.filter((t) => !t.isPaid);
    }

    // Filtro de mês
    if (selectedMonth) {
      filtered = filtered.filter((t) => {
        const txDate = new Date(t.transactionDate);
        const txMonth = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(PAD_LENGTH, "0")}`;

        return txMonth === selectedMonth;
      });
    }

    setFilteredTransactions(filtered);
  }, [ searchTerm, filterType, selectedMonth, transactions ]);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      loadTransactions();
    }
  }, [ sessionStatus ]);

  useEffect(() => {
    applyFilters();
  }, [ searchTerm, filterType, selectedMonth, transactions, applyFilters ]);

  function openTransactionDetail (transaction: TransactionItem) {
    setSelectedTransaction(transaction);
    setShowTransactionDetail(true);
  }

  // Calcular totais dos filtros
  const totals = {
    income: filteredTransactions.filter((t) => t.type === "INCOME").reduce((sum, t) => sum + t.amount, ZERO),
    expense: filteredTransactions.filter((t) => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, ZERO),
  };

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F0F3]">
        <div className="text-[#4a4a4a] text-lg">Carregando transações...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F0F3] p-4 sm:p-6">
      {/* Header */}
      <header className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#6a6a6a] hover:text-[#4A90E2] transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Voltar</span>
        </button>

        <h1 className="text-2xl sm:text-3xl font-bold text-[#4A90E2] mb-2">Todas as Transações</h1>
        <p className="text-sm text-[#6a6a6a]">Histórico completo de receitas e despesas</p>
      </header>

      {error &&
        <div className="bg-[#ffd9d9] rounded-xl p-4 mb-6 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.08)] border border-[#ffb3b3]/30">
          <p className="text-[#c92a2a] text-sm">{error}</p>
        </div>
      }

      {/* Filtros e Busca */}
      <div className="bg-[#F0F0F3] rounded-2xl p-5 shadow-[-8px_-8px_16px_rgba(255,255,255,0.8),8px_8px_16px_rgba(174,174,192,0.25)] mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-[#4A90E2]" />
          <h3 className="font-semibold text-[#4a4a4a]">Filtros</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Busca */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6a6a6a]" />
            <input
              type="text"
              placeholder="Buscar transações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#F0F0F3] text-[#4a4a4a] placeholder:text-[#a0a0a0] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2)] focus:outline-none text-sm"
            />
          </div>

          {/* Tipo */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="px-3 py-2.5 rounded-xl bg-[#F0F0F3] text-[#4a4a4a] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2)] focus:outline-none text-sm"
          >
            <option value="ALL">Todos os tipos</option>
            <option value="INCOME">Receitas</option>
            <option value="EXPENSE">Despesas</option>
            <option value="PAID">Pagos</option>
            <option value="PENDING">Pendentes</option>
          </select>

          {/* Mês */}
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[#F0F0F3] text-[#4a4a4a] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2)] focus:outline-none text-sm"
          />
        </div>

        {/* Resumo dos filtros */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#d0d0d0]">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#6a6a6a]">Total Receitas:</span>
            <span className="text-sm font-bold text-[#4A90E2]">{formatCurrency(totals.income)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#6a6a6a]">Total Despesas:</span>
            <span className="text-sm font-bold text-[#c92a2a]">{formatCurrency(totals.expense)}</span>
          </div>
        </div>
      </div>

      {/* Lista de Transações */}
      <div className="bg-[#F0F0F3] rounded-2xl p-5 shadow-[-8px_-8px_16px_rgba(255,255,255,0.8),8px_8px_16px_rgba(174,174,192,0.25)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign size={20} className="text-[#4A90E2]" />
            <h3 className="font-semibold text-[#4a4a4a]">
              {filteredTransactions.length} {filteredTransactions.length === 1 ? "transação" : "transações"}
            </h3>
          </div>
          <button onClick={loadTransactions} className="text-sm text-[#4A90E2] hover:text-[#2E6FB7] transition">
            Atualizar
          </button>
        </div>

        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {filteredTransactions.length === ZERO ?
              <div className="text-center text-[#6a6a6a] py-12 text-sm">
                {transactions.length === ZERO ?
                  "Nenhuma transação registrada ainda" :
                  "Nenhuma transação encontrada com os filtros aplicados"}
              </div> :
              filteredTransactions.map((t) => {
                const isIncome = t.type === "INCOME";

                return (
                  <div
                    key={t.id}
                    onClick={() => openTransactionDetail(t)}
                    className="flex items-center justify-between p-4 bg-[#F0F0F3] rounded-xl shadow-[inset_2px_2px_4px_rgba(174,174,192,0.12)] hover:shadow-[inset_3px_3px_6px_rgba(174,174,192,0.18)] transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-[2px_2px_4px_rgba(174,174,192,0.2)] ${isIncome ? "bg-[#d4f1d4]" : "bg-[#ffd9d9]"}`}>
                        {isIncome ? <ArrowUp size={20} className="text-[#4A90E2]" /> : <ArrowDown size={20} className="text-[#c92a2a]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[#4a4a4a] truncate">
                          {t.description || "Sem descrição"}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-[#6a6a6a]">
                          {t.category &&
                            <span className="px-2 py-0.5 rounded-full bg-[#F0F0F3] shadow-[inset_1px_1px_2px_rgba(174,174,192,0.12)]">
                              {t.category.name}
                            </span>
                          }
                          {t.group &&
                            <span className="px-2 py-0.5 rounded-full bg-[#F0F0F3] shadow-[inset_1px_1px_2px_rgba(174,174,192,0.12)]">
                              {t.group.name}
                            </span>
                          }
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(t.transactionDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <div className={`font-bold text-base ${isIncome ? "text-[#4A90E2]" : "text-[#c92a2a]"}`}>
                        {isIncome ? "+" : "-"} {formatCurrency(t.amount)}
                      </div>
                      {!t.isPaid &&
                        <div className="text-xs text-[#c92a2a] mt-1 px-2 py-0.5 rounded-full bg-[#ffd9d9]">
                          Pendente
                        </div>
                      }
                    </div>
                  </div>
                );
              })
          }
        </div>
      </div>

      <TransactionDetailModal
        isOpen={showTransactionDetail}
        onClose={() => {
          setShowTransactionDetail(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        groupId={selectedTransaction?.group?.id ?? MINUS_ONE}
        currentUserId={session?.user?.userId ?? ZERO}
        isAdmin={true}
        onSuccess={() => {
          setShowTransactionDetail(false);
          setSelectedTransaction(null);
          loadTransactions();
        }}
      />
    </div>
  );
}
