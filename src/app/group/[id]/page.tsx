"use client";

import AddTransaction from "@/components/modal/AddTransaction";
import TransactionDetailModal from "@/components/modal/TransactionDetailModal";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import { HOURS_IN_DAY, HTTP_STATUS, INITIALS_MAX, MILLISECONDS, MINUTES_IN_HOUR, ONE, SECONDS_IN_MINUTE, ZERO } from "@/lib/shared/constants";
import { ArrowDown, ArrowLeft, ArrowUp, Calendar, CreditCard, DollarSign, Edit2, Folder, Mail, PieChart, Plus, Trash2, TrendingDown, TrendingUp, UserMinus, Users, Wallet, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";

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
}

interface GroupData {
  id: number;
  name: string;
  description: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

interface Member {
  id: number;
  userId: number;
  isOwner: boolean;
  joinedAt: string;
  user: { id: number; name: string; email: string };
}

interface Category {
  id: number;
  name: string;
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

function initials (name: string) {
  const parts = name.trim().split(/\s+/u);

  if (parts.length === INITIALS_MAX - ONE) {
    return parts[ZERO].slice(ZERO, INITIALS_MAX).toUpperCase();
  }
  const first = parts[ZERO][ZERO] ?? "";
  const last = parts[parts.length - ONE][ZERO] ?? "";

  return (first + last).slice(ZERO, INITIALS_MAX).toUpperCase();
}

export default function GroupDetailPage ({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { status: sessionStatus, data: session } = useSession();
  const router = useRouter();

  const [ group, setGroup ] = useState<GroupData | null>(null);
  const [ members, setMembers ] = useState<Member[]>([]);
  const [ transactions, setTransactions ] = useState<TransactionItem[]>([]);
  const [ categories, setCategories ] = useState<Category[]>([]);
  const [ loading, setLoading ] = useState(true);
  const [ error, setError ] = useState<string | null>(null);

  // Estados dos modais
  const [ modalOpen, setModalOpen ] = useState(false);
  const [ showTransactionDetail, setShowTransactionDetail ] = useState(false);
  const [ selectedTransaction, setSelectedTransaction ] = useState<TransactionItem | null>(null);
  const [ showCategoryModal, setShowCategoryModal ] = useState(false);
  const [ showEditCategoryModal, setShowEditCategoryModal ] = useState(false);
  const [ showDeleteCategoryModal, setShowDeleteCategoryModal ] = useState(false);
  const [ showInviteModal, setShowInviteModal ] = useState(false);
  const [ showMembersModal, setShowMembersModal ] = useState(false);
  const [ showRemoveMemberConfirm, setShowRemoveMemberConfirm ] = useState(false);

  // Estados dos formulários
  const [ categoryName, setCategoryName ] = useState("");
  const [ editingCategory, setEditingCategory ] = useState<Category | null>(null);
  const [ deletingCategory, setDeletingCategory ] = useState<Category | null>(null);
  const [ inviteEmail, setInviteEmail ] = useState("");
  const [ submitting, setSubmitting ] = useState(false);
  const [ memberToRemove, setMemberToRemove ] = useState<number | null>(null);

  const groupId = parseInt(id);
  const isAdmin = members.find((m) => m.userId === session?.user?.userId)?.isOwner ?? false;

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

    let totalIncomePaid = ZERO;
    let totalExpensePaid = ZERO;
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
        if (t.isPaid) {
          totalIncomePaid += amt;
        } else {
          pendingIncome += amt;
        }
        
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
        if (t.isPaid) {
          totalExpensePaid += amt;
        }
        
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

        if (t.isPaid) {
          const categoryName = t.category?.name || "Sem categoria";
          const current = categoriesMap.get(categoryName) || { total: ZERO, count: ZERO };
          categoriesMap.set(categoryName, { total: current.total + amt, count: current.count + ONE });
        }
      }
    }

    const topCategories: CategorySummary[] = Array.from(categoriesMap.entries()).
      map(([ name, data ]) => ({
        name,
        total: data.total,
        count: data.count,
        percentage: totalExpensePaid > ZERO ? (data.total / totalExpensePaid) * PERCENTAGE_MULTIPLIER : ZERO,
      })).
      sort((a, b) => b.total - a.total).
      slice(ZERO, 5);

    const incomeGrowth = prevMonthIncome > ZERO ? ((currentMonthIncome - prevMonthIncome) / prevMonthIncome) * PERCENTAGE_MULTIPLIER : ZERO;
    const expenseGrowth = prevMonthExpense > ZERO ? ((currentMonthExpense - prevMonthExpense) / prevMonthExpense) * PERCENTAGE_MULTIPLIER : ZERO;

    return {
      totalIncome: totalIncomePaid,
      totalExpense: totalExpensePaid,
      netTotal: totalIncomePaid - totalExpensePaid,
      currentMonthIncome,
      currentMonthExpense,
      currentMonthNet: currentMonthIncome - currentMonthExpense,
      currentMonthIncomePaid,
      currentMonthExpensePaid,
      currentMonthNetPaid: currentMonthIncomePaid - currentMonthExpensePaid,
      incomeGrowth,
      expenseGrowth,
      pendingExpenses,
      pendingIncome,
      overdueExpenses,
      topCategories,
      savingsRate: currentMonthIncomePaid > ZERO ? ((currentMonthIncomePaid - currentMonthExpensePaid) / currentMonthIncomePaid) * PERCENTAGE_MULTIPLIER : ZERO,
    };
  }, [ transactions ]);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [ sessionStatus, router ]);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      loadGroupData();
      loadCategories();
    }
  }, [ sessionStatus, groupId ]);

  async function loadGroupData () {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/group/${groupId}`, { credentials: "include" });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));

        if (res.status === HTTP_STATUS.UNAUTHORIZED) {
          router.push("/login");

          return;
        }
        setError(body?.error || "Erro ao carregar dados do grupo");

        return;
      }

      const json = await res.json();

      setGroup(json.group ?? null);
      setMembers(json.members ?? []);
      setTransactions(json.transactions ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories () {
    try {
      const res = await fetch(`/api/categories?groupId=${groupId}`, { credentials: "include" });

      if (res.ok) {
        const data = await res.json();

        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
    }
  }

  async function handleCreateCategory (e: React.FormEvent) {
    e.preventDefault();
    if (!categoryName.trim()) {
      setError("Nome da categoria é obrigatório");

      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName.trim(), groupId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao criar categoria");

        return;
      }

      setCategoryName("");
      setShowCategoryModal(false);
      loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar categoria");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditCategory (e: React.FormEvent) {
    e.preventDefault();
    if (!editingCategory || !categoryName.trim()) {
      setError("Nome da categoria é obrigatório");

      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao editar categoria");

        return;
      }

      setCategoryName("");
      setEditingCategory(null);
      setShowEditCategoryModal(false);
      loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao editar categoria");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteCategory () {
    if (!deletingCategory) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/categories/${deletingCategory.id}`, { method: "DELETE" });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao deletar categoria");

        return;
      }

      setDeletingCategory(null);
      setShowDeleteCategoryModal(false);
      loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar categoria");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleInvite (e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      setError("E-mail é obrigatório");

      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/group/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), groupId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao enviar convite");

        return;
      }

      setInviteEmail("");
      setShowInviteModal(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar convite");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveMember (memberId: number) {
    try {
      const res = await fetch(`/api/group/${groupId}/member`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: memberId }),
      });

      if (!res.ok) {
        const data = await res.json();

        setError(data.error || "Erro ao remover membro");

        return;
      }

      loadGroupData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover membro");
    } finally {
      setShowRemoveMemberConfirm(false);
      setMemberToRemove(null);
    }
  }

  function openEditCategoryModal (category: Category) {
    setEditingCategory(category);
    setCategoryName(category.name);
    setShowEditCategoryModal(true);
  }

  function openDeleteCategoryModal (category: Category) {
    setDeletingCategory(category);
    setShowDeleteCategoryModal(true);
  }

  function openTransactionDetail(transaction: TransactionItem) {
    setSelectedTransaction(transaction);
    setShowTransactionDetail(true);
  }

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F0F3]">
        <div className="text-[#4a4a4a] text-lg">Carregando...</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F0F3]">
        <div className="text-[#c92a2a] text-lg">Grupo não encontrado</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F0F3] p-4 sm:p-6">
      {/* Header */}
      <header className="mb-6">
        <button
          onClick={() => router.push("/groups")}
          className="flex items-center gap-2 text-[#6a6a6a] hover:text-[#4A90E2] transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Voltar para grupos</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-[#F0F0F3] shadow-[-4px_-4px_8px_rgba(255,255,255,0.8),4px_4px_8px_rgba(174,174,192,0.25)] flex items-center justify-center">
                <span className="text-[#4A90E2] font-bold text-lg">{initials(group.name)}</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#4A90E2]">{group.name}</h1>
                <p className="text-sm text-[#6a6a6a]">{group.description}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <>
                <button
                  onClick={() => setShowCategoryModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F0F0F3] text-[#6a6a6a] font-semibold shadow-[-4px_-4px_8px_rgba(255,255,255,0.8),4px_4px_8px_rgba(174,174,192,0.25)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.9),2px_2px_4px_rgba(174,174,192,0.3)] transition-all text-sm"
                >
                  <Folder size={18} />
                  <span className="hidden sm:inline">Categorias</span>
                </button>

                <button
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F0F0F3] text-[#6a6a6a] font-semibold shadow-[-4px_-4px_8px_rgba(255,255,255,0.8),4px_4px_8px_rgba(174,174,192,0.25)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.9),2px_2px_4px_rgba(174,174,192,0.3)] transition-all text-sm"
                >
                  <Mail size={18} />
                  <span className="hidden sm:inline">Convidar</span>
                </button>
              </>
            )}

            <button
              onClick={() => setShowMembersModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F0F0F3] text-[#6a6a6a] font-semibold shadow-[-4px_-4px_8px_rgba(255,255,255,0.8),4px_4px_8px_rgba(174,174,192,0.25)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.9),2px_2px_4px_rgba(174,174,192,0.3)] transition-all text-sm"
            >
              <Users size={18} />
              <span className="hidden sm:inline">Membros ({members.length})</span>
            </button>

            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4A90E2] text-white font-bold shadow-[-4px_-4px_8px_rgba(255,255,255,0.6),4px_4px_8px_rgba(174,174,192,0.4)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.7),2px_2px_4px_rgba(174,174,192,0.5)] transition-all text-sm"
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

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
        </div>

        <div className="bg-[#F0F0F3] rounded-2xl p-5 shadow-[-8px_-8px_16px_rgba(255,255,255,0.8),8px_8px_16px_rgba(174,174,192,0.25)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#6a6a6a] uppercase tracking-wide">Receitas</span>
            <div className="w-10 h-10 rounded-full bg-[#F0F0F3] shadow-[inset_2px_2px_4px_rgba(174,174,192,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center">
              <TrendingUp size={20} className="text-[#4A90E2]" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#4A90E2]">{formatCurrency(metrics.currentMonthIncome)}</div>
          <div className="mt-2 flex items-center gap-1 text-xs">
            {metrics.incomeGrowth >= ZERO ? <ArrowUp size={12} className="text-[#4A90E2]" /> : <ArrowDown size={12} className="text-[#c92a2a]" />}
            <span className={metrics.incomeGrowth >= ZERO ? "text-[#4A90E2]" : "text-[#c92a2a]"}>
              {metrics.incomeGrowth >= ZERO ? "+" : ""}{metrics.incomeGrowth.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="bg-[#F0F0F3] rounded-2xl p-5 shadow-[-8px_-8px_16px_rgba(255,255,255,0.8),8px_8px_16px_rgba(174,174,192,0.25)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#6a6a6a] uppercase tracking-wide">Despesas</span>
            <div className="w-10 h-10 rounded-full bg-[#F0F0F3] shadow-[inset_2px_2px_4px_rgba(174,174,192,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center">
              <TrendingDown size={20} className="text-[#c92a2a]" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#c92a2a]">{formatCurrency(metrics.currentMonthExpense)}</div>
          <div className="mt-2 flex items-center gap-1 text-xs">
            {metrics.expenseGrowth >= ZERO ? <ArrowUp size={12} className="text-[#c92a2a]" /> : <ArrowDown size={12} className="text-[#4A90E2]" />}
            <span className={metrics.expenseGrowth >= ZERO ? "text-[#c92a2a]" : "text-[#4A90E2]"}>
              {metrics.expenseGrowth >= ZERO ? "+" : ""}{metrics.expenseGrowth.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="bg-[#F0F0F3] rounded-2xl p-5 shadow-[-8px_-8px_16px_rgba(255,255,255,0.8),8px_8px_16px_rgba(174,174,192,0.25)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#6a6a6a] uppercase tracking-wide">Economia</span>
            <div className="w-10 h-10 rounded-full bg-[#F0F0F3] shadow-[inset_2px_2px_4px_rgba(174,174,192,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center">
              <Wallet size={20} className="text-[#4A90E2]" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#4A90E2]">{metrics.savingsRate.toFixed(1)}%</div>
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
              {metrics.topCategories.map((cat, idx) => <div key={idx} className="flex items-center gap-3">
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
              </div>)}
            </div>
          )}
        </div>

        {/* Pendências */}
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

            {metrics.overdueExpenses > ZERO &&
              <div className="p-3 bg-[#ffd9d9] rounded-xl shadow-[inset_2px_2px_4px_rgba(0,0,0,0.08)] border border-[#ffb3b3]/30">
                <div className="text-xs text-[#c92a2a] mb-1">⚠️ Atrasadas</div>
                <div className="text-lg font-bold text-[#c92a2a]">{formatCurrency(metrics.overdueExpenses)}</div>
              </div>
            }
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
          <div className="flex gap-2">
            <button 
              onClick={() => router.push(`/group/${groupId}/transactions`)} 
              className="text-sm text-[#4A90E2] hover:text-[#2E6FB7] transition"
            >
              Ver todas
            </button>
            <button onClick={loadGroupData} className="text-sm text-[#4A90E2] hover:text-[#2E6FB7] transition">
              Atualizar
            </button>
          </div>
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
                      <div className="text-sm font-medium text-[#4a4a4a] truncate">{t.description || "Sem descrição"}</div>
                      <div className="text-xs text-[#6a6a6a] mt-0.5 truncate">
                        {t.category?.name || "Sem categoria"} • {t.createdBy?.name} • {formatDate(t.transactionDate)}
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

      {/* Modal Nova Transação */}
      <AddTransaction
        isOpen={modalOpen}
        groupId={groupId}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          loadGroupData();
        }}
      />

      {/* Modal Detalhes da Transação */}
      <TransactionDetailModal
        isOpen={showTransactionDetail}
        onClose={() => {
          setShowTransactionDetail(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        groupId={groupId}
        currentUserId={session?.user?.userId ?? ZERO}
        isAdmin={isAdmin}
        onSuccess={() => {
          setShowTransactionDetail(false);
          setSelectedTransaction(null);
          loadGroupData();
        }}
      />

      {/* Modal Gerenciar Categorias */}
      {showCategoryModal &&
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={() => setShowCategoryModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-[#F0F0F3] rounded-3xl shadow-[-6px_-6px_12px_rgba(255,255,255,0.9),6px_6px_12px_rgba(174,174,192,0.2)] p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#4A90E2]">Gerenciar Categorias</h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="w-8 h-8 rounded-full bg-[#F0F0F3] shadow-[-3px_-3px_6px_rgba(255,255,255,0.9),3px_3px_6px_rgba(174,174,192,0.2)] hover:shadow-[inset_2px_2px_4px_rgba(174,174,192,0.2)] flex items-center justify-center transition-all"
              >
                <X size={16} className="text-[#6a6a6a]" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="mb-4">
              <label className="block text-sm text-[#4a4a4a] font-semibold mb-2">Nova Categoria</label>
              <div className="flex gap-2">
                <input
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                  placeholder="Nome da categoria"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#F0F0F3] text-[#4a4a4a] placeholder:text-[#a0a0a0] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2)] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl bg-[#4A90E2] text-white font-bold shadow-[-4px_-4px_8px_rgba(255,255,255,0.6),4px_4px_8px_rgba(174,174,192,0.4)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.7),2px_2px_4px_rgba(174,174,192,0.5)] disabled:opacity-60 transition-all"
                >
                  <Plus size={20} />
                </button>
              </div>
            </form>

            <div className="space-y-2">
              {categories.length === ZERO ? (
                <div className="text-center text-[#6a6a6a] py-4 text-sm">Nenhuma categoria cadastrada</div>
              ) : (
                categories.map((cat) => <div key={cat.id} className="flex items-center justify-between p-3 bg-[#F0F0F3] rounded-xl shadow-[inset_2px_2px_4px_rgba(174,174,192,0.12)]">
                  <span className="text-sm font-medium text-[#4a4a4a]">{cat.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditCategoryModal(cat)}
                      className="w-8 h-8 rounded-lg bg-[#F0F0F3] shadow-[-3px_-3px_6px_rgba(255,255,255,0.9),3px_3px_6px_rgba(174,174,192,0.2)] hover:shadow-[inset_2px_2px_4px_rgba(174,174,192,0.2)] flex items-center justify-center transition-all"
                    >
                      <Edit2 size={14} className="text-[#4A90E2]" />
                    </button>
                    <button
                      onClick={() => openDeleteCategoryModal(cat)}
                      className="w-8 h-8 rounded-lg bg-[#F0F0F3] shadow-[-3px_-3px_6px_rgba(255,255,255,0.9),3px_3px_6px_rgba(174,174,192,0.2)] hover:shadow-[inset_2px_2px_4px_rgba(174,174,192,0.2)] flex items-center justify-center transition-all"
                    >
                      <Trash2 size={14} className="text-[#c92a2a]" />
                    </button>
                  </div>
                </div>)
              )}
            </div>
          </div>
        </div>
      }

      {/* Modal Editar Categoria */}
      {showEditCategoryModal && editingCategory &&
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={() => setShowEditCategoryModal(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleEditCategory} className="w-full max-w-md bg-[#F0F0F3] rounded-3xl shadow-[-6px_-6px_12px_rgba(255,255,255,0.9),6px_6px_12px_rgba(174,174,192,0.2)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#4A90E2]">Editar Categoria</h3>
              <button type="button" onClick={() => setShowEditCategoryModal(false)} className="w-8 h-8 rounded-full bg-[#F0F0F3] shadow-[-3px_-3px_6px_rgba(255,255,255,0.9),3px_3px_6px_rgba(174,174,192,0.2)] hover:shadow-[inset_2px_2px_4px_rgba(174,174,192,0.2)] flex items-center justify-center transition-all">
                <X size={16} className="text-[#6a6a6a]" />
              </button>
            </div>

            <label className="block text-sm text-[#4a4a4a] font-semibold mb-2">Nome da Categoria</label>
            <input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
              className="w-full px-4 py-2.5 mb-4 rounded-xl bg-[#F0F0F3] text-[#4a4a4a] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2)] focus:outline-none"
            />

            <div className="flex gap-3">
              <button type="button" onClick={() => setShowEditCategoryModal(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-[#F0F0F3] text-[#6a6a6a] font-semibold shadow-[-4px_-4px_8px_rgba(255,255,255,0.8),4px_4px_8px_rgba(174,174,192,0.25)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.9),2px_2px_4px_rgba(174,174,192,0.3)] transition-all">
                Cancelar
              </button>
              <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 rounded-xl bg-[#4A90E2] text-white font-bold shadow-[-4px_-4px_8px_rgba(255,255,255,0.6),4px_4px_8px_rgba(174,174,192,0.4)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.7),2px_2px_4px_rgba(174,174,192,0.5)] disabled:opacity-60 transition-all">
                {submitting ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      }

      {/* Modal Deletar Categoria */}
      {showDeleteCategoryModal && deletingCategory &&
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={() => setShowDeleteCategoryModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-[#F0F0F3] rounded-3xl shadow-[-6px_-6px_12px_rgba(255,255,255,0.9),6px_6px_12px_rgba(174,174,192,0.2)] p-6">
            <h3 className="text-xl font-bold text-[#c92a2a] mb-4">Deletar Categoria</h3>
            <p className="text-[#4a4a4a] mb-6">
              Tem certeza que deseja deletar a categoria <strong>{deletingCategory.name}</strong>? Esta ação não pode ser desfeita.
            </p>

            <div className="flex gap-3">
              <button onClick={() => setShowDeleteCategoryModal(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-[#F0F0F3] text-[#6a6a6a] font-semibold shadow-[-4px_-4px_8px_rgba(255,255,255,0.8),4px_4px_8px_rgba(174,174,192,0.25)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.9),2px_2px_4px_rgba(174,174,192,0.3)] transition-all">
                Cancelar
              </button>
              <button onClick={handleDeleteCategory} disabled={submitting} className="flex-1 px-4 py-2.5 rounded-xl bg-[#c92a2a] text-white font-bold shadow-[-4px_-4px_8px_rgba(255,255,255,0.6),4px_4px_8px_rgba(174,174,192,0.4)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.7),2px_2px_4px_rgba(174,174,192,0.5)] disabled:opacity-60 transition-all">
                {submitting ? "Deletando..." : "Deletar"}
              </button>
            </div>
          </div>
        </div>
      }

      {/* Modal Convidar Membro */}
      {showInviteModal &&
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={() => setShowInviteModal(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleInvite} className="w-full max-w-md bg-[#F0F0F3] rounded-3xl shadow-[-6px_-6px_12px_rgba(255,255,255,0.9),6px_6px_12px_rgba(174,174,192,0.2)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#4A90E2]">Convidar Membro</h3>
              <button type="button" onClick={() => setShowInviteModal(false)} className="w-8 h-8 rounded-full bg-[#F0F0F3] shadow-[-3px_-3px_6px_rgba(255,255,255,0.9),3px_3px_6px_rgba(174,174,192,0.2)] hover:shadow-[inset_2px_2px_4px_rgba(174,174,192,0.2)] flex items-center justify-center transition-all">
                <X size={16} className="text-[#6a6a6a]" />
              </button>
            </div>

            <label className="block text-sm text-[#4a4a4a] font-semibold mb-2">E-mail do Usuário</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              placeholder="usuario@exemplo.com"
              className="w-full px-4 py-2.5 mb-4 rounded-xl bg-[#F0F0F3] text-[#4a4a4a] placeholder:text-[#a0a0a0] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2)] focus:outline-none"
            />

            <div className="flex gap-3">
              <button type="button" onClick={() => setShowInviteModal(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-[#F0F0F3] text-[#6a6a6a] font-semibold shadow-[-4px_-4px_8px_rgba(255,255,255,0.8),4px_4px_8px_rgba(174,174,192,0.25)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.9),2px_2px_4px_rgba(174,174,192,0.3)] transition-all">
                Cancelar
              </button>
              <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 rounded-xl bg-[#4A90E2] text-white font-bold shadow-[-4px_-4px_8px_rgba(255,255,255,0.6),4px_4px_8px_rgba(174,174,192,0.4)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.7),2px_2px_4px_rgba(174,174,192,0.5)] disabled:opacity-60 transition-all">
                {submitting ? "Enviando..." : "Enviar Convite"}
              </button>
            </div>
          </form>
        </div>
      }

      {/* Modal Membros */}
      {showMembersModal &&
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={() => setShowMembersModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-[#F0F0F3] rounded-3xl shadow-[-6px_-6px_12px_rgba(255,255,255,0.9),6px_6px_12px_rgba(174,174,192,0.2)] p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#4A90E2]">Membros do Grupo</h3>
              <button onClick={() => setShowMembersModal(false)} className="w-8 h-8 rounded-full bg-[#F0F0F3] shadow-[-3px_-3px_6px_rgba(255,255,255,0.9),3px_3px_6px_rgba(174,174,192,0.2)] hover:shadow-[inset_2px_2px_4px_rgba(174,174,192,0.2)] flex items-center justify-center transition-all">
                <X size={16} className="text-[#6a6a6a]" />
              </button>
            </div>

            <div className="space-y-3">
              {members.map((member) => <div key={member.id} className="flex items-center justify-between p-3 bg-[#F0F0F3] rounded-xl shadow-[inset_2px_2px_4px_rgba(174,174,192,0.12)]">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#F0F0F3] shadow-[-3px_-3px_6px_rgba(255,255,255,0.9),3px_3px_6px_rgba(174,174,192,0.2)] flex items-center justify-center">
                    <span className="text-[#4A90E2] font-bold text-sm">{initials(member.user.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#4a4a4a] truncate">{member.user.name}</p>
                    <p className="text-xs text-[#6a6a6a] truncate">{member.user.email}</p>
                  </div>
                  {member.isOwner &&
                    <span className="px-2 py-1 rounded-full bg-[#d4f1d4] text-[#2d5a2d] text-xs font-semibold">Admin</span>
                  }
                </div>
                {isAdmin && !member.isOwner &&
                  <button
                    onClick={() => {
                      setMemberToRemove(member.userId);
                      setShowRemoveMemberConfirm(true);
                    }}
                    className="ml-2 w-8 h-8 rounded-lg bg-[#F0F0F3] shadow-[-3px_-3px_6px_rgba(255,255,255,0.9),3px_3px_6px_rgba(174,174,192,0.2)] hover:shadow-[inset_2px_2px_4px_rgba(174,174,192,0.2)] flex items-center justify-center transition-all"
                  >
                    <UserMinus size={14} className="text-[#c92a2a]" />
                  </button>
                }
              </div>)}
            </div>
          </div>
        </div>
      }

      <ConfirmModal
        isOpen={showRemoveMemberConfirm}
        onClose={() => {
          setShowRemoveMemberConfirm(false);
          setMemberToRemove(null);
        }}
        onConfirm={() => memberToRemove && handleRemoveMember(memberToRemove)}
        title="Remover Membro"
        message="Tem certeza que deseja remover este membro do grupo? Ele perderá acesso a todas as informações compartilhadas."
        confirmText="Remover"
        cancelText="Cancelar"
        isDestructive
      />
    </div>
  );
}
