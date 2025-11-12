"use client";

import AddTransaction from "@/components/modal/AddTransaction";
import TransactionDetailModal from "@/components/modal/TransactionDetailModal";
import { HOURS_IN_DAY, HTTP_STATUS, MILLISECONDS, MINUTES_IN_HOUR, ONE, SECONDS_IN_MINUTE, ZERO } from "@/lib/shared/constants";
import { ArrowDown, ArrowUp, Calendar, CreditCard, DollarSign, Folder, PieChart, Plus, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
  paymentMethod?: { name: string; type: string } | null;
  creditCard?: { name: string; last4Digits: string } | null;
}

interface PersonalGroupData {
  id: number;
  name: string;
  description: string;
  balance: number;
}

interface CategorySummary {
  name: string;
  total: number;
  count: number;
  percentage: number;
}

const PERCENTAGE_MULTIPLIER = 100;
const MONTHS = [ "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez" ];

function formatCurrency (amount: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
}

function formatDate (dateString: string) {
  const d = new Date(dateString);

  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function HomePage () {
  const { status: sessionStatus, data: session } = useSession();
  const router = useRouter();

  const [ group, setGroup ] = useState<PersonalGroupData | null>(null);
  const [ transactions, setTransactions ] = useState<TransactionItem[]>([]);
  const [ loading, setLoading ] = useState(true);
  const [ error, setError ] = useState<string | null>(null);
  const [ modalOpen, setModalOpen ] = useState(false);
  const [ showTransactionDetail, setShowTransactionDetail ] = useState(false);
  const [ selectedTransaction, setSelectedTransaction ] = useState<TransactionItem | null>(null);

  function openTransactionDetail (transaction: TransactionItem) {
    setSelectedTransaction(transaction);
    setShowTransactionDetail(true);
  }

  // Métricas calculadas
  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthStart = new Date(currentYear, currentMonth, ONE);
    const currentMonthEnd = new Date(currentYear, currentMonth + ONE, ZERO, HOURS_IN_DAY, MINUTES_IN_HOUR, SECONDS_IN_MINUTE, MILLISECONDS);

    const prevMonth = currentMonth === ZERO ? 11 : currentMonth - ONE;
    const prevYear = currentMonth === ZERO ? currentYear - ONE : currentYear;
    const prevMonthStart = new Date(prevYear, prevMonth, ONE);
    const prevMonthEnd = new Date(prevYear, prevMonth + ONE, ZERO, HOURS_IN_DAY, MINUTES_IN_HOUR, SECONDS_IN_MINUTE, MILLISECONDS);

    // Totais APENAS de transações PAGAS (saldo real)
    let totalIncomePaid = ZERO;
    let totalExpensePaid = ZERO;
    
    // Totais do mês atual (pagas + previstas)
    let currentMonthIncome = ZERO;
    let currentMonthExpense = ZERO;
    let currentMonthIncomePaid = ZERO;
    let currentMonthExpensePaid = ZERO;
    
    let prevMonthIncome = ZERO;
    let prevMonthExpense = ZERO;
    let pendingExpenses = ZERO;
    let pendingIncome = ZERO;
    let overdueExpenses = ZERO;

    const categoriesMap = new Map<string, { total: number; count: number }>();

    for (const t of transactions) {
      const amt = Number(t.amount) || ZERO;
      const txDate = new Date(t.transactionDate);

      if (t.type === "INCOME") {
        // Saldo total: apenas receitas efetivamente recebidas
        if (t.isPaid) {
          totalIncomePaid += amt;
        } else {
          pendingIncome += amt;
        }
        
        // Mês atual: todas as receitas (para comparação)
        if (txDate >= currentMonthStart && txDate <= currentMonthEnd) {
          currentMonthIncome += amt;
          if (t.isPaid) {
            currentMonthIncomePaid += amt;
          }
        }
        if (txDate >= prevMonthStart && txDate <= prevMonthEnd) {
          prevMonthIncome += amt;
        }
      } else {
        // Saldo total: apenas despesas efetivamente pagas
        if (t.isPaid) {
          totalExpensePaid += amt;
        }
        
        // Mês atual: todas as despesas (para comparação)
        if (txDate >= currentMonthStart && txDate <= currentMonthEnd) {
          currentMonthExpense += amt;
          if (t.isPaid) {
            currentMonthExpensePaid += amt;
          }
        }
        if (txDate >= prevMonthStart && txDate <= prevMonthEnd) {
          prevMonthExpense += amt;
        }

        if (!t.isPaid) {
          pendingExpenses += amt;
          if (t.status === "OVERDUE") {
            overdueExpenses += amt;
          }
        }

        // Categorias: considerar apenas despesas pagas para análise real
        if (t.isPaid) {
          const categoryName = t.category?.name || "Sem categoria";
          const current = categoriesMap.get(categoryName) || { total: ZERO, count: ZERO };
          categoriesMap.set(categoryName, { total: current.total + amt, count: current.count + ONE });
        }
      }
    }

    const topCategories: CategorySummary[] = Array.from(categoriesMap.entries())
      .map(([ name, data ]) => ({
        name,
        total: data.total,
        count: data.count,
        percentage: totalExpensePaid > ZERO ? (data.total / totalExpensePaid) * PERCENTAGE_MULTIPLIER : ZERO,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(ZERO, 5);

    const incomeGrowth = prevMonthIncome > ZERO ? ((currentMonthIncome - prevMonthIncome) / prevMonthIncome) * PERCENTAGE_MULTIPLIER : ZERO;
    const expenseGrowth = prevMonthExpense > ZERO ? ((currentMonthExpense - prevMonthExpense) / prevMonthExpense) * PERCENTAGE_MULTIPLIER : ZERO;

    return {
      // SALDO REAL (apenas transações pagas)
      totalIncome: totalIncomePaid,
      totalExpense: totalExpensePaid,
      netTotal: totalIncomePaid - totalExpensePaid,
      
      // PREVISÕES DO MÊS (pagas + pendentes)
      currentMonthIncome,
      currentMonthExpense,
      currentMonthNet: currentMonthIncome - currentMonthExpense,
      
      // REALIZADAS DO MÊS (apenas pagas)
      currentMonthIncomePaid,
      currentMonthExpensePaid,
      currentMonthNetPaid: currentMonthIncomePaid - currentMonthExpensePaid,
      
      prevMonthNet: prevMonthIncome - prevMonthExpense,
      incomeGrowth,
      expenseGrowth,
      
      // PENDÊNCIAS
      pendingExpenses,
      pendingIncome,
      overdueExpenses,
      
      topCategories,
      
      // TAXA DE ECONOMIA (baseada em valores REALIZADOS)
      savingsRate: currentMonthIncomePaid > ZERO ? ((currentMonthIncomePaid - currentMonthExpensePaid) / currentMonthIncomePaid) * PERCENTAGE_MULTIPLIER : ZERO,
    };
  }, [ transactions ]);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [ sessionStatus, router ]);

  useEffect(() => {
    let mounted = true;

    async function loadPersonalGroup () {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/group/me", { credentials: "include" });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));

          if (!mounted) {
            return;
          }
          if (res.status === HTTP_STATUS.UNAUTHORIZED) {
            router.push("/login");

            return;
          }
          setError(body?.error || "Erro ao carregar dados");

          return;
        }

        const json = await res.json();

        if (!mounted) {
          return;
        }

        setGroup(json.data ?? null);

        // Buscar transações do grupo pessoal
        if (json.data?.id) {
          const txRes = await fetch(`/api/group/${json.data.id}`, { credentials: "include" });

          if (txRes.ok) {
            const txJson = await txRes.json();

            setTransactions(txJson.transactions ?? []);
          }
        }
      } catch (e: unknown) {
        if (!mounted) {
          return;
        }
        setError(e instanceof Error ? e.message : "Erro desconhecido");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (sessionStatus === "authenticated") {
      loadPersonalGroup();
    }

    return () => {
      mounted = false;
    };
  }, [ sessionStatus, router ]);

  const refreshData = async () => {
    if (!group?.id) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/group/${group.id}`, { credentials: "include" });

      if (res.ok) {
        const json = await res.json();

        setTransactions(json.transactions ?? []);
        setError(null);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar");
    } finally {
      setLoading(false);
    }
  };

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F0F3]">
        <div className="text-[#4a4a4a] text-lg">Carregando seu dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F0F3] p-4 sm:p-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#4A90E2] mb-2">Dashboard Financeiro</h1>
            <p className="text-sm text-[#6a6a6a]">Visão geral das suas finanças pessoais • {MONTHS[new Date().getMonth()]} {new Date().getFullYear()}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/categories")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F0F0F3] text-[#6a6a6a] font-semibold shadow-[-4px_-4px_8px_rgba(255,255,255,0.8),4px_4px_8px_rgba(174,174,192,0.25)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.9),2px_2px_4px_rgba(174,174,192,0.3)] active:shadow-[inset_2px_2px_4px_rgba(174,174,192,0.2)] transition-all text-sm"
            >
              <Folder size={18} />
              <span className="hidden sm:inline">Categorias</span>
            </button>

            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4A90E2] text-white font-bold shadow-[-4px_-4px_8px_rgba(255,255,255,0.6),4px_4px_8px_rgba(174,174,192,0.4)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.7),2px_2px_4px_rgba(174,174,192,0.5)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.2)] transition-all text-sm"
            >
              <Plus size={18} />
              <span>Nova Transação</span>
            </button>
          </div>
        </div>
      </header>

      {error &&
        <div className="bg-[#ffd9d9] rounded-xl p-4 mb-6 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.08)] border border-[#ffb3b3]/30">
          <p className="text-[#c92a2a] text-sm">{error}</p>
        </div>
      }

      {/* Cards principais de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Saldo Total */}
        <div className="bg-[#F0F0F3] rounded-2xl p-5 shadow-[-8px_-8px_16px_rgba(255,255,255,0.8),8px_8px_16px_rgba(174,174,192,0.25)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#6a6a6a] uppercase tracking-wide">Saldo Total</span>
            <div className="w-10 h-10 rounded-full bg-[#F0F0F3] shadow-[inset_2px_2px_4px_rgba(174,174,192,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center">
              <DollarSign size={20} className="text-[#4A90E2]" />
            </div>
          </div>
          <div className={`text-2xl font-bold ${metrics.netTotal >= ZERO ? "text-[#4A90E2]" : "text-[#c92a2a]"}`}>
            {formatCurrency(metrics.netTotal)}
          </div>
          <div className="mt-2 text-xs text-[#6a6a6a]">
            {metrics.netTotal >= ZERO ? "Saldo positivo" : "Saldo negativo"}
          </div>
        </div>

        {/* Receitas do Mês */}
        <div className="bg-[#F0F0F3] rounded-2xl p-5 shadow-[-8px_-8px_16px_rgba(255,255,255,0.8),8px_8px_16px_rgba(174,174,192,0.25)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#6a6a6a] uppercase tracking-wide">Receitas</span>
            <div className="w-10 h-10 rounded-full bg-[#F0F0F3] shadow-[inset_2px_2px_4px_rgba(174,174,192,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center">
              <TrendingUp size={20} className="text-[#4A90E2]" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#4A90E2]">{formatCurrency(metrics.currentMonthIncome)}</div>
          <div className="mt-2 flex items-center gap-1 text-xs">
            {metrics.incomeGrowth >= ZERO ? (
              <>
                <ArrowUp size={12} className="text-[#4A90E2]" />
                <span className="text-[#4A90E2]">+{metrics.incomeGrowth.toFixed(1)}%</span>
              </>
            ) : (
              <>
                <ArrowDown size={12} className="text-[#c92a2a]" />
                <span className="text-[#c92a2a]">{metrics.incomeGrowth.toFixed(1)}%</span>
              </>
            )}
            <span className="text-[#6a6a6a] ml-1">vs mês anterior</span>
          </div>
        </div>

        {/* Despesas do Mês */}
        <div className="bg-[#F0F0F3] rounded-2xl p-5 shadow-[-8px_-8px_16px_rgba(255,255,255,0.8),8px_8px_16px_rgba(174,174,192,0.25)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#6a6a6a] uppercase tracking-wide">Despesas</span>
            <div className="w-10 h-10 rounded-full bg-[#F0F0F3] shadow-[inset_2px_2px_4px_rgba(174,174,192,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center">
              <TrendingDown size={20} className="text-[#c92a2a]" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#c92a2a]">{formatCurrency(metrics.currentMonthExpense)}</div>
          <div className="mt-2 flex items-center gap-1 text-xs">
            {metrics.expenseGrowth >= ZERO ? (
              <>
                <ArrowUp size={12} className="text-[#c92a2a]" />
                <span className="text-[#c92a2a]">+{metrics.expenseGrowth.toFixed(1)}%</span>
              </>
            ) : (
              <>
                <ArrowDown size={12} className="text-[#4A90E2]" />
                <span className="text-[#4A90E2]">{metrics.expenseGrowth.toFixed(1)}%</span>
              </>
            )}
            <span className="text-[#6a6a6a] ml-1">vs mês anterior</span>
          </div>
        </div>

        {/* Taxa de Economia */}
        <div className="bg-[#F0F0F3] rounded-2xl p-5 shadow-[-8px_-8px_16px_rgba(255,255,255,0.8),8px_8px_16px_rgba(174,174,192,0.25)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#6a6a6a] uppercase tracking-wide">Taxa de Economia</span>
            <div className="w-10 h-10 rounded-full bg-[#F0F0F3] shadow-[inset_2px_2px_4px_rgba(174,174,192,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center">
              <Wallet size={20} className="text-[#4A90E2]" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#4A90E2]">{metrics.savingsRate.toFixed(1)}%</div>
          <div className="mt-2 text-xs text-[#6a6a6a]">
            {metrics.savingsRate >= 20 ? "Excelente!" : metrics.savingsRate >= 10 ? "Bom desempenho" : "Pode melhorar"}
          </div>
        </div>
      </div>

      {/* Grid secundário */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Top Categorias */}
        <div className="lg:col-span-2 bg-[#F0F0F3] rounded-2xl p-5 shadow-[-8px_-8px_16px_rgba(255,255,255,0.8),8px_8px_16px_rgba(174,174,192,0.25)]">
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={20} className="text-[#4A90E2]" />
            <h3 className="font-semibold text-[#4a4a4a]">Top Categorias de Despesas</h3>
          </div>

          {metrics.topCategories.length === ZERO ? (
            <div className="text-center text-[#6a6a6a] py-8 text-sm">Nenhuma despesa registrada ainda</div>
          ) : (
            <div className="space-y-3">
              {metrics.topCategories.map((cat, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-[#4a4a4a]">{cat.name}</span>
                      <span className="text-sm font-bold text-[#c92a2a]">{formatCurrency(cat.total)}</span>
                    </div>
                    <div className="h-2 bg-[#F0F0F3] rounded-full shadow-[inset_2px_2px_4px_rgba(174,174,192,0.15)]">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-[#c92a2a] to-[#ff8787]"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-[#6a6a6a] w-12 text-right">{cat.percentage.toFixed(1)}%</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alertas e Pendências */}
        <div className="bg-[#F0F0F3] rounded-2xl p-5 shadow-[-8px_-8px_16px_rgba(255,255,255,0.8),8px_8px_16px_rgba(174,174,192,0.25)]">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={20} className="text-[#4A90E2]" />
            <h3 className="font-semibold text-[#4a4a4a]">Pendências</h3>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-[#F0F0F3] rounded-xl shadow-[inset_2px_2px_4px_rgba(174,174,192,0.15)]">
              <div className="text-xs text-[#6a6a6a] mb-1">Contas Pendentes</div>
              <div className="text-lg font-bold text-[#c92a2a]">{formatCurrency(metrics.pendingExpenses)}</div>
            </div>

            {metrics.overdueExpenses > ZERO && (
              <div className="p-3 bg-[#ffd9d9] rounded-xl shadow-[inset_2px_2px_4px_rgba(0,0,0,0.08)] border border-[#ffb3b3]/30">
                <div className="text-xs text-[#c92a2a] mb-1">⚠️ Contas Atrasadas</div>
                <div className="text-lg font-bold text-[#c92a2a]">{formatCurrency(metrics.overdueExpenses)}</div>
              </div>
            )}

            <button
              onClick={() => router.push("/transactions")}
              className="w-full mt-3 px-4 py-2 rounded-xl bg-[#F0F0F3] text-[#4A90E2] text-sm font-medium shadow-[-3px_-3px_6px_rgba(255,255,255,0.9),3px_3px_6px_rgba(174,174,192,0.2)] hover:shadow-[inset_2px_2px_4px_rgba(174,174,192,0.2)] transition-all"
            >
              Ver Todas as Transações
            </button>
          </div>
        </div>
      </div>

      {/* Transações Recentes */}
      <div className="bg-[#F0F0F3] rounded-2xl p-5 shadow-[-8px_-8px_16px_rgba(255,255,255,0.8),8px_8px_16px_rgba(174,174,192,0.25)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard size={20} className="text-[#4A90E2]" />
            <h3 className="font-semibold text-[#4a4a4a]">Transações Recentes</h3>
          </div>
          <button onClick={refreshData} className="text-sm text-[#4A90E2] hover:text-[#2E6FB7] transition">
            Atualizar
          </button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {transactions.length === ZERO ? (
            <div className="text-center text-[#6a6a6a] py-8 text-sm">Nenhuma transação registrada</div>
          ) : (
            transactions.slice(ZERO, 10).map((t) => {
              const isIncome = t.type === "INCOME";

              return (
                <div
                  key={t.id}
                  onClick={() => openTransactionDetail(t)}
                  className="flex items-center justify-between p-3 bg-[#F0F0F3] rounded-xl shadow-[inset_2px_2px_4px_rgba(174,174,192,0.12)] hover:shadow-[inset_3px_3px_6px_rgba(174,174,192,0.18)] transition cursor-pointer"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-[2px_2px_4px_rgba(174,174,192,0.2)] ${isIncome ? "bg-[#d4f1d4]" : "bg-[#ffd9d9]"}`}>
                      {isIncome ? <ArrowUp size={18} className="text-[#4A90E2]" /> : <ArrowDown size={18} className="text-[#c92a2a]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#4a4a4a] truncate">
                        {t.description || "Sem descrição"}
                      </div>
                      <div className="text-xs text-[#6a6a6a] mt-0.5 truncate">
                        {t.category?.name || "Sem categoria"} • {formatDate(t.transactionDate)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <div className={`font-bold text-sm ${isIncome ? "text-[#4A90E2]" : "text-[#c92a2a]"}`}>
                      {isIncome ? "+" : "-"} {formatCurrency(t.amount)}
                    </div>
                    {!t.isPaid && <div className="text-xs text-[#c92a2a] mt-0.5">Pendente</div>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <AddTransaction
        isOpen={modalOpen}
        groupId={group?.id ?? -1}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          refreshData();
        }}
      />

      <TransactionDetailModal
        isOpen={showTransactionDetail}
        onClose={() => {
          setShowTransactionDetail(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        groupId={group?.id ?? -1}
        currentUserId={session?.user?.userId ?? ZERO}
        isAdmin={true}
        onSuccess={() => {
          setShowTransactionDetail(false);
          setSelectedTransaction(null);
          refreshData();
        }}
      />
    </div>
  );
}
