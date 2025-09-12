"use client";

import AddTransaction from "@/components/modal/add-transaction";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Divider from "@/components/ui/divider";
import gateways from "@/lib/client/gateways";
import { ArrowDown, ArrowUp, LogOut, Plus, Trash2, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

// Definição de tipo para transação
interface Transaction {
  id: number;
  amount: number;
  type: "INCOME" | "EXPENSE";
  description?: string;
  transactionDate: string;
  category?: { name: string } | null;
}

export default function Home () {
  const { status: sessionStatus, data: session } = useSession();
  const [ isModalOpen, setIsModalOpen ] = useState(false);
  const [ transactions, setTransactions ] = useState<Transaction[]>([]);
  const [ isLoadingTransactions, setIsLoadingTransactions ] = useState(true);
  const [ groupBalance, setGroupBalance ] = useState<number | null>(null);
  const [ errorMessage, setErrorMessage ] = useState<string | null>(null);

  // Busca transações do backend
  const fetchTransactions = async () => {
    setIsLoadingTransactions(true);
    try {
      const res = await fetch(gateways.GET_ALL_TRANSACTIONS(), { method: "GET", credentials: "include" });
      const result = await res.json();

      if (res.ok && Array.isArray(result.data)) {
        setTransactions(result.data);
      } else {
        setTransactions([]);
      }
    } catch {
      setTransactions([]);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Busca saldo do grupo do usuário
  const fetchGroupBalance = async () => {
    try {
      const res = await fetch(gateways.GROUP_ME(), { method: "GET", credentials: "include" });
      const result = await res.json();

      if (res.ok && result.data?.balance !== undefined) {
        setGroupBalance(result.data.balance);
      } else {
        setGroupBalance(null);
      }
    } catch {
      setGroupBalance(null);
    }
  };

  const onDeleteTransaction = async (id: number) => {
    try {
      const res = await fetch(gateways.DELETE_TRANSACTION(id), { method: "DELETE", credentials: "include" });

      if (res.ok) {
        fetchTransactions();
        fetchGroupBalance();
        setErrorMessage(null);
      } else {
        const result = await res.json();

        setErrorMessage(result?.error || "Erro ao excluir transação.");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Erro de conexão ao excluir transação.");
    }
  };

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchTransactions();
      fetchGroupBalance();
    }
  }, [ sessionStatus ]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);

  const formatDateTime = (dateString: string) => {
    const d = new Date(dateString);

    return `${d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })} ${d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const onLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Estados de carregamento e não autenticado
  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen bg-[#3c3c3c] flex items-center justify-center">
        <div className="text-[#d3d3d3] text-lg">Carregando...</div>
      </div>
    );
  }

  if (sessionStatus === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[#3c3c3c] flex items-center justify-center">
        <div className="text-[#d3d3d3] text-lg">Redirecionando...</div>
      </div>
    );
  }

  // Dados do usuário (real ou fallback para mock)
  const userName = session?.user?.name || "Usuário";
  const userBalance = groupBalance ?? 0;

  return (
    <div className="min-h-screen bg-[#3c3c3c] p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Mensagem de erro global */}
        {errorMessage &&
          <div className="mb-4 p-3 rounded bg-[#FF6B6B]/80 text-white text-center font-medium">
            {errorMessage}
          </div>
        }

        {/* Header com informações do usuário */}
        <Card className="bg-[#4A4A4A] rounded-lg border-t-4 border-t-[#296BA6] shadow-lg overflow-hidden">
          <div className="p-4 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <div className="w-16 h-16 bg-[#555555] rounded-full flex items-center justify-center border-2 border-[#296BA6] flex-shrink-0">
                  <User size={32} className="text-[#d3d3d3]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-[#d3d3d3] text-xl md:text-2xl font-semibold truncate">
                    Olá, {userName}
                  </h1>
                  <p className="text-[#d3d3d3] opacity-80 text-sm">
                    Grupo: Pessoal
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3 flex-shrink-0">
                <button
                  onClick={onLogout}
                  className="text-[#d3d3d3] hover:text-[#FF6B6B] transition-colors duration-200 flex items-center gap-1.5 text-xs opacity-60 hover:opacity-100 p-1 rounded"
                  title="Sair da conta"
                >
                  <LogOut size={14} />
                  <span>Sair</span>
                </button>

                <div className="text-right">
                  <p className="text-[#d3d3d3] text-sm opacity-80 mb-1">Saldo atual</p>
                  <p className={`text-xl md:text-2xl font-bold ${userBalance >= 0 ? "text-[#5AA4E6]" : "text-[#FF6B6B]"}`}>
                    {formatCurrency(userBalance)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Botão de nova transação */}
          <Card className="bg-[#4A4A4A] rounded-lg border-t-2 border-t-[#5AA4E6] shadow-lg overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-[#5AA4E6] rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus size={24} className="text-white" />
              </div>
              <h3 className="text-[#d3d3d3] text-lg font-semibold mb-2">
                Nova Transação
              </h3>
              <p className="text-[#d3d3d3] opacity-80 text-sm mb-4">
                Adicione uma receita ou despesa
              </p>
              <Button
                onClick={openModal}
                className="w-full bg-[#4592D7] py-2 hover:bg-[#5AA4E6] text-white font-medium rounded-md transition-colors duration-200"
              >
                Adicionar
              </Button>
            </div>
          </Card>

          {/* Resumo rápido */}
          <Card className="bg-[#4A4A4A] rounded-lg border-t-2 border-t-[#3A7BBD] shadow-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-[#d3d3d3] text-lg font-semibold mb-4">
                Este Mês
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ArrowUp size={16} className="text-[#5AA4E6]" />
                    <span className="text-[#d3d3d3] text-sm">Receitas</span>
                  </div>
                  <span className="text-[#5AA4E6] font-medium">
                    {/* TODO: Calcular receitas reais do mês */}
                    {formatCurrency((transactions as Transaction[]).filter((t) => t.type === "INCOME").reduce((acc, t) => acc + t.amount, 0))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ArrowDown size={16} className="text-[#FF6B6B]" />
                    <span className="text-[#d3d3d3] text-sm">Despesas</span>
                  </div>
                  <span className="text-[#FF6B6B] font-medium">
                    {/* TODO: Calcular despesas reais do mês */}
                    {formatCurrency((transactions as Transaction[]).filter((t) => t.type === "EXPENSE").reduce((acc, t) => acc + t.amount, 0))}
                  </span>
                </div>
                <Divider className="border-[#555555]" />
                <div className="flex items-center justify-between">
                  <span className="text-[#d3d3d3] font-medium">Saldo</span>
                  <span className="text-[#5AA4E6] font-bold">
                    {formatCurrency(userBalance)}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Categoria com mais gastos */}
          <Card className="bg-[#4A4A4A] rounded-lg border-t-2 border-t-[#3A7BBD] shadow-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-[#d3d3d3] text-lg font-semibold mb-4">
                Maior Gasto
              </h3>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#3A7BBD] rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-lg">🛒</span>
                </div>
                <p className="text-[#d3d3d3] font-medium">
                  {/* Categoria com maior gasto */}
                  {(() => {
                    const expenses = transactions.filter((t) => t.type === "EXPENSE");
                    const byCategory: Record<string, number> = {};

                    for (const t of expenses) {
                      const cat = t.category?.name || "Sem categoria";

                      byCategory[cat] = (byCategory[cat] || 0) + t.amount;
                    }
                    const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

                    if (sorted.length > 0) {
                      const [ [ catName ] ] = sorted;

                      return String(catName);
                    }

                    return "Sem categoria";
                  })()}
                </p>
                <p className="text-[#FF6B6B] text-xl font-bold">
                  {(() => {
                    const expenses = transactions.filter((t) => t.type === "EXPENSE");
                    const byCategory: Record<string, number> = {};

                    for (const t of expenses) {
                      const cat = t.category?.name || "Sem categoria";

                      byCategory[cat] = (byCategory[cat] || 0) + t.amount;
                    }
                    const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

                    if (sorted.length > 0) {
                      const [ [ , value ] ] = sorted;

                      return formatCurrency(value);
                    }

                    return formatCurrency(0);
                  })()}
                </p>
                <p className="text-[#d3d3d3] opacity-60 text-xs mt-1">
                  neste mês
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Histórico de transações */}
        <Card className="bg-[#4A4A4A] rounded-lg border-t-2 border-t-[#296BA6] shadow-lg overflow-hidden">
          <div className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-[#d3d3d3] text-lg md:text-xl font-semibold">
                Transações Recentes
              </h2>
              <Button className="bg-[#555555] hover:bg-[#666666] text-[#d3d3d3] text-sm px-4 py-2 rounded-md transition-colors w-full sm:w-auto">
                Ver Todas
              </Button>
            </div>
            <div className="space-y-3">
              {isLoadingTransactions &&
                <div className="text-[#d3d3d3] text-center py-8">Carregando transações...</div>
              }
              {!isLoadingTransactions && transactions.length === 0 &&
                <div className="text-[#d3d3d3] text-center py-8">Nenhuma transação encontrada.</div>
              }
              {!isLoadingTransactions && transactions.length > 0 &&
                transactions.map((transaction) => {
                  const isIncome = transaction.type === "INCOME";

                  return (
                    <div
                      key={transaction.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-[#555555] rounded-lg hover:bg-[#606060] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[#d3d3d3] font-medium text-base">
                          {transaction.description || "Sem descrição"}
                        </p>
                        <p className="text-[#d3d3d3] opacity-60 text-sm mt-1">
                          {transaction.category?.name || "Sem categoria"} • {formatDateTime(transaction.transactionDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-left sm:text-right flex-shrink-0">
                        <p className={`font-bold text-lg ${isIncome ? "text-[#5AA4E6]" : "text-[#FF6B6B]"}`}>
                          {isIncome ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <button
                          type="button"
                          className="transition-colors cursor-pointer text-[#d3d3d3] rounded-md bg-transparent hover:bg-[#FF6B6B]/60 focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] active:scale-95 sm:p-2 p-3 sm:ml-2 ml-0"
                          title="Excluir transação"
                          onClick={() => onDeleteTransaction(transaction.id)}
                        >
                          <Trash2 size={22} className="sm:w-5 sm:h-5 w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        </Card>
      </div>

      {/* Modal de Nova Transação */}
      <AddTransaction
        isOpen={isModalOpen}
        onClose={closeModal}
        onSuccess={() => {
          fetchTransactions();
          fetchGroupBalance();
        }}
      />
    </div>
  );
}
