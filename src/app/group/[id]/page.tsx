"use client";

import AddTransaction from "@/components/modal/add-transaction";
import { ArrowDown, ArrowUp, ChevronLeft } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Member = {
  id: number;
  userId: number;
  isOwner: boolean;
  joinedAt: string;
  user: { id: number; name: string; email: string };
};

type TransactionItem = {
  id: number;
  amount: number;
  type: "INCOME" | "EXPENSE";
  description?: string | null;
  transactionDate: string;
  createdBy?: { id: number; name: string } | null;
  category?: { name: string } | null;
};

type GroupData = {
  id: number;
  name: string;
  description: string;
  type?: "PERSONAL" | "COLLABORATIVE";
  createdAt: string;
  updatedAt: string;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
}

function formatDate(dateString: string) {
  const d = new Date(dateString);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function GroupPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  // normalizar id (string | string[] | undefined) -> string | undefined
  const rawId = params?.id;
  const idParam = Array.isArray(rawId) ? rawId[0] : rawId;

  const [group, setGroup] = useState<GroupData | null>(null);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // métricas derivadas das transações
  const {
    totalIncome,
    totalExpense,
    netTotal,
    monthlyIncome,
    monthlyExpense,
    monthlyNet,
  } = useMemo(() => {
    const totals = { totalIncome: 0, totalExpense: 0, netTotal: 0, monthlyIncome: 0, monthlyExpense: 0, monthlyNet: 0 };

    if (!transactions || transactions.length === 0) {
      return totals;
    }

    const now = new Date();
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    for (const t of transactions) {
      const amt = Number(t.amount) || 0;
      if (t.type === "INCOME") {
        totals.totalIncome += amt;
      } else if (t.type === "EXPENSE") {
        totals.totalExpense += amt;
      }

      const txDate = new Date(t.transactionDate);
      if (txDate >= prevMonthStart && txDate <= prevMonthEnd) {
        if (t.type === "INCOME") totals.monthlyIncome += amt;
        if (t.type === "EXPENSE") totals.monthlyExpense += amt;
      }
    }

    totals.netTotal = totals.totalIncome - totals.totalExpense;
    totals.monthlyNet = totals.monthlyIncome - totals.monthlyExpense;

    return totals;
  }, [transactions]);

  function formatCurrencySmall (v: number) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  }

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [sessionStatus, router]);

  useEffect(() => {
    let mounted = true;

    async function loadGroup() {
      if (!idParam) {
        if (mounted) {
          setError("ID do grupo inválido");
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/group/${encodeURIComponent(idParam)}`, { credentials: "include" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (!mounted) return;
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          if (res.status === 403) {
            setError("Você não tem acesso a este grupo");
            return;
          }
          setError(body?.error || "Erro ao carregar grupo");
          return;
        }

        const json = await res.json();
        if (!mounted) return;

        setGroup(json.group ?? null);
        setMembers(json.members ?? []);
        setTransactions(json.transactions ?? []);
      } catch (e: unknown) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : String(e ?? "Erro desconhecido"));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (sessionStatus === "authenticated") {
      loadGroup();
    }

    return () => {
      mounted = false;
    };
  }, [idParam, sessionStatus, router]);

  // Atualiza isOwner sempre que membros ou sessão mudam
  useEffect(() => {
    if (!members || !session) {
      setIsOwner(false);
      return;
    }
    setIsOwner(members.some((m) => m.userId === session.user.userId && m.isOwner));
  }, [members, session]);

  const handleBack = () => router.push("/");

  const refreshGroup = async () => {
    if (!idParam) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/group/${encodeURIComponent(idParam)}`, { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        setGroup(json.group ?? null);
        setMembers(json.members ?? []);
        setTransactions(json.transactions ?? []);
        setError(null);
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body?.error || "Erro ao atualizar dados");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e ?? "Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  // enviar convite / adicionar membro por e-mail
  async function handleInviteByEmail() {
    if (!inviteEmail.trim()) {
      setInviteStatus("Informe um e-mail válido.");
      return;
    }
    setInviteStatus("Enviando...");
    try {
      const res = await fetch(`/api/group/${encodeURIComponent(String(idParam))}/member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok) {
        setInviteStatus("Convite enviado / membro adicionado.");
        setInviteEmail("");
        setInviteModalOpen(false); // fechar modal no sucesso
        await refreshGroup();
      } else {
        setInviteStatus(json?.error || "Erro ao convidar usuário.");
      }
    } catch (err: unknown) {
      setInviteStatus(err instanceof Error ? err.message : "Erro de conexão");
    } finally {
      // limpa mensagem após alguns segundos
      setTimeout(() => setInviteStatus(null), 3500);
    }
  }

  const isPersonalGroup = Boolean(
    group &&
    (
      group.type === "PERSONAL" ||
      String(group.name).toLowerCase().includes("pessoal")
    )
  );

  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen bg-[#1E1E1E] flex items-center justify-center">
        <div className="text-[#E0E0E0]">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1E1E1E] text-[#E0E0E0] p-6">
      {/* Header semelhante ao GroupsPage com botão de voltar */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 rounded-md bg-[#2A2D34] hover:bg-[#34373b] cursor-pointer shadow-sm"
            title="Voltar"
          >
            <ChevronLeft className="text-[#A3D5FF]" />
          </button>

          <div className="w-12 h-12 rounded-full bg-[#3a3f46] flex items-center justify-center text-[#A3D5FF] font-semibold text-sm">
            {session?.user?.name
              ? session.user.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase()
              : (session?.user?.email?.slice(0, 2).toUpperCase() ?? "US")}
          </div>

          <div className="min-w-0">
            <div className="text-[#6FB1FC] font-semibold leading-tight truncate">{session?.user?.name ?? "Usuário"}</div>
            <div className="text-sm text-[#E0E0E0]/80 truncate">{session?.user?.email ?? ""}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="px-3 py-2 text-sm rounded-md bg-transparent text-[#A3D5FF] border border-transparent hover:border-[#A3D5FF]/20 cursor-pointer transition shadow-sm"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Conteúdo do grupo */}
      <main className="space-y-4">
        {error && (
          <div className="bg-[#2A2D34] rounded-xl p-4 shadow-sm">
            <p className="text-[#FF6B6B]">{error}</p>
          </div>
        )}

        {loading && (
          <div className="bg-[#2A2D34] rounded-xl p-4 shadow-sm">
            <p>Carregando grupo...</p>
          </div>
        )}

        {!loading && group && (
          <>
            <div className="bg-[#2A2D34] rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[#6FB1FC] text-xl font-semibold">{group.name}</h2>
                  <p className="text-sm text-[#E0E0E0]/90 mt-1">{group.description}</p>
                </div>

                <div className="flex items-center gap-3">
                  {/* botão Atualizar refinado */}
                  <button
                    onClick={refreshGroup}
                    className="px-3 py-2 rounded-md bg-gradient-to-br from-[#2F3237] to-[#33363a] text-[#A3D5FF] border border-[#00000033] hover:brightness-105 transition shadow-sm"
                    title="Atualizar dados do grupo"
                  >
                    Atualizar
                  </button>
                </div>
              </div>
            </div>

            {/* Estatísticas do grupo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#2A2D34] rounded-xl p-4 shadow-sm flex flex-col">
                <span className="text-sm text-[#A3D5FF]">Saldo (calculado)</span>
                <strong className={`mt-2 text-lg ${netTotal >= 0 ? "text-[#5AA4E6]" : "text-[#FF6B6B]"}`}>{formatCurrencySmall(netTotal)}</strong>
                <span className="text-xs text-[#E0E0E0]/70 mt-1">Receitas totais: {formatCurrencySmall(totalIncome)}</span>
                <span className="text-xs text-[#E0E0E0]/70">Despesas totais: {formatCurrencySmall(totalExpense)}</span>
              </div>

              {/* Cartão "Último mês" — visual refinado e consistente */}
              <div className="bg-[#2A2D34] rounded-xl p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="text-sm text-[#A3D5FF]">Último mês</span>
                    <h4 className="mt-2 text-lg font-semibold text-[#d3d3d3] truncate">
                      Lucro: <span className={monthlyNet >= 0 ? "text-[#5AA4E6]" : "text-[#FF6B6B]"}>{formatCurrencySmall(monthlyNet)}</span>
                    </h4>
                    <p className="text-xs text-[#E0E0E0]/70 mt-1">Resumo de receita e despesa do mês anterior</p>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-md bg-[#16262d] border border-[#00000044]">
                        <ArrowUp size={16} className="text-[#6FB1FC]" />
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-[#A3D5FF] font-semibold">{formatCurrencySmall(monthlyIncome)}</div>
                        <div className="text-xs text-[#E0E0E0]/70">Receita</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-md bg-[#2c1212] border border-[#00000044]">
                        <ArrowDown size={16} className="text-[#FF6B6B]" />
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-[#FFB3B3] font-semibold">{formatCurrencySmall(monthlyExpense)}</div>
                        <div className="text-xs text-[#E0E0E0]/70">Despesa</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="w-full bg-[#222427] rounded-lg overflow-hidden h-3">
                    <div
                      className="h-3 rounded-lg transition-all"
                      style={{
                        width: `${Math.min(100, monthlyIncome === 0 && monthlyExpense === 0 ? 0 : Math.round((monthlyIncome / Math.max(1, monthlyIncome + monthlyExpense)) * 100))}%`,
                        background: "linear-gradient(90deg,#5AA4E6,#6FB1FC)",
                      }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-[#E0E0E0]/60">
                    <span className="truncate">Receita vs Despesa</span>
                    <span className="font-medium">{Math.round(monthlyIncome === 0 && monthlyExpense === 0 ? 0 : (monthlyIncome / Math.max(1, monthlyIncome + monthlyExpense)) * 100)}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#2A2D34] rounded-xl p-4 shadow-sm flex flex-col">
                <span className="text-sm text-[#A3D5FF]">Métricas rápidas</span>
                <div className="mt-2 flex items-center gap-2">
                  <div className="text-xs text-[#E0E0E0]/80">Total transações:</div>
                  <div className="text-sm font-semibold text-[#d3d3d3]">{transactions.length}</div>
                </div>
                <div className="mt-2">
                  <div className="text-xs text-[#E0E0E0]/80">Receita total:</div>
                  <div className="text-sm font-semibold text-[#5AA4E6]">{formatCurrencySmall(totalIncome)}</div>
                </div>
                <div className="mt-2">
                  <div className="text-xs text-[#E0E0E0]/80">Despesa total:</div>
                  <div className="text-sm font-semibold text-[#FF6B6B]">{formatCurrencySmall(totalExpense)}</div>
                </div>
              </div>
            </div>

            {/* Membros — não renderizar para grupo pessoal */}
            {!isPersonalGroup && (
              <div className="bg-[#2A2D34] rounded-xl p-3 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[#A3D5FF] font-semibold">Membros</h3>

                  {/* Somente proprietários veem o botão de convite (abre modal) */}
                  {isOwner && (
                    <button
                      onClick={() => { setInviteModalOpen(true); setInviteStatus(null); setInviteEmail(""); }}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-[#2F3237] hover:bg-[#34373b] text-[#A3D5FF] rounded-md border border-[#00000033] shadow-sm transition"
                      title="Adicionar membro"
                      aria-label="Adicionar membro"
                    >
                      ＋
                      <span className="text-sm">Adicionar membro</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {members && members.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 p-2 bg-[#27292c] rounded-lg border border-[#00000033] hover:bg-[#2e3134] transition"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#303538] flex items-center justify-center text-[#A3D5FF] font-semibold flex-shrink-0 text-sm">
                        {m.user.name ? m.user.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase() : m.user.email.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold text-[#E0E0E0] truncate">{m.user.name}</div>
                          {m.isOwner && (
                            <span className="text-xs bg-[#6FB1FC]/10 text-[#6FB1FC] px-2 py-0.5 rounded-full font-medium">Proprietário</span>
                          )}
                        </div>
                        <div className="text-xs text-[#E0E0E0]/70 truncate">{m.user.email}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* feedback do invite abaixo (opcional, curto) */}
                {inviteStatus && <p className="mt-2 text-sm text-[#A3D5FF]">{inviteStatus}</p>}
              </div>
            )}

            {/* Transações */}
            <div className="bg-[#2D2D34] rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[#A3D5FF] font-semibold">Transações</h3>
                <div className="text-sm text-[#E0E0E0]/80">{transactions.length} registros</div>
              </div>

              <div className="space-y-2">
                {transactions.length === 0 && <div className="text-[#E0E0E0]/80">Nenhuma movimentação registrada.</div>}

                {transactions.map((t) => {
                  const isIncome = t.type === "INCOME";
                  return (
                    <div key={t.id} className="flex items-center justify-between p-2 sm:p-3 bg-[#1F2226] rounded-md border border-[#00000022]">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[#E0E0E0] truncate">{t.description || "Sem descrição"}</div>
                        <div className="text-xs text-[#E0E0E0]/80 mt-1">{t.category?.name || "Sem categoria"} • {formatDate(t.transactionDate)}</div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className={`font-bold ${isIncome ? "text-[#5AA4E6]" : "text-[#FF6B6B]"}`}>
                          {isIncome ? "+" : "-"} {formatCurrency(t.amount)}
                        </div>
                        <div className="text-xs text-[#E0E0E0]/70">{t.createdBy?.name ?? ""}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FAB: mesmo visual do mobile, agora visível em todas as larguras (posição bottom-right) */}
            <button
              onClick={() => setModalOpen(true)}
              className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-br from-[#6FB1FC] to-[#4EA8F8] text-white font-semibold shadow-sm"
              aria-label="Adicionar transação"
              title="Adicionar transação"
            >
              ＋
              <span className="text-sm">Adicionar transação</span>
            </button>
          </>
        )}
      </main>

      {/* Modal de adicionar transação (reaproveita componente existente) */}
      <AddTransaction
        isOpen={modalOpen}
        groupId={group?.id ?? -1}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          refreshGroup();
        }}
      />

      {/* Modal de convite por e-mail */}
      {inviteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setInviteModalOpen(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={async (e) => { e.preventDefault(); await handleInviteByEmail(); }}
            className="w-full max-w-md bg-[#1E1E1E] p-6 rounded-xl shadow-lg border border-[#00000033]"
          >
            <h3 className="text-[#6FB1FC] text-lg font-semibold mb-4">Convidar membro</h3>

            <label className="block text-sm text-[#E0E0E0]">
              E-mail
              <input
                value={inviteEmail}
                onChange={(ev) => setInviteEmail(ev.target.value)}
                required
                placeholder="email@exemplo.com"
                className="mt-2 w-full p-3 rounded-lg bg-[#2A2D34] text-[#E0E0E0] shadow-sm placeholder:text-[#A3D5FF]/50"
              />
            </label>

            <div className="flex justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="px-4 py-2 text-[#A3D5FF] rounded-lg font-semibold hover:underline transition text-sm"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-br from-[#6FB1FC] to-[#4EA8F8] text-white rounded-lg font-bold shadow-sm text-sm"
              >
                Convidar
              </button>
            </div>

            {inviteStatus && <p className="mt-3 text-sm text-[#A3D5FF]">{inviteStatus}</p>}
          </form>
        </div>
      )}
    </div>
  );
}
