"use client";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Divider from "@/components/ui/divider";
import Modal from "@/components/ui/modal";
import TextField from "@/components/ui/textfield";
import gateways from "@/lib/client/gateways";
import { HTTP_STATUS } from "@/lib/shared/constants";
import { TransactionSchema, TransactionSchemaData } from "@/lib/shared/schemas/transaction";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, LogOut, Plus, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";

// Mock de dados do usuário e transações
const mockUser = {
  name: "João Silva",
  balance: 2450.75,
  groupName: "Pessoal",
};

const mockSummary = {
  income: 4300.00,
  expenses: 1849.25,
  balance: 2450.75,
  topCategory: {
    name: "Alimentação",
    amount: 235.50,
  },
};

const mockTransactions = [
  {
    id: 1,
    description: "Salário",
    amount: 3500.00,
    type: "INCOME" as const,
    date: "2024-01-15",
    category: "Trabalho",
  },
  {
    id: 2,
    description: "Supermercado",
    amount: 235.50,
    type: "EXPENSE" as const,
    date: "2024-01-14",
    category: "Alimentação",
  },
  {
    id: 3,
    description: "Combustível",
    amount: 180.00,
    type: "EXPENSE" as const,
    date: "2024-01-13",
    category: "Transporte",
  },
  {
    id: 4,
    description: "Freelance",
    amount: 800.00,
    type: "INCOME" as const,
    date: "2024-01-12",
    category: "Trabalho",
  },
  {
    id: 5,
    description: "Internet",
    amount: 89.90,
    type: "EXPENSE" as const,
    date: "2024-01-10",
    category: "Serviços",
  },
];

export default function Home () {
  const { status: sessionStatus, data: session } = useSession();
  const [ isModalOpen, setIsModalOpen ] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TransactionSchemaData>({
    resolver: zodResolver(TransactionSchema),
    mode: "onChange",
    defaultValues: {
      type: "EXPENSE",
      transactionDate: new Date().toISOString(),
    },
  });

  const formatCurrency = (amount: number) => new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const onLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const openModal = () => {
    setIsModalOpen(true);
    reset();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    reset();
  };

  const onSubmitTransaction = async (data: TransactionSchemaData) => {
    try {
      const response = await fetch(gateways.CREATE_TRANSACTION(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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

      // Sucesso - fechar modal e limpar form
      closeModal();
      console.log("Transação criada com sucesso:", result);

      // TODO: Atualizar lista de transações
    } catch (error) {
      console.error("Erro de rede:", error);
      setError("root", {
        type: "network",
        message: "Erro de conexão. Tente novamente.",
      });
    }
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
  const userName = session?.user?.name || mockUser.name;
  const userBalance = mockUser.balance; // Por enquanto mantém o mock para o saldo

  return (
    <div className="min-h-screen bg-[#3c3c3c] p-4">
      <div className="max-w-6xl mx-auto space-y-6">
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
                    Grupo: {mockUser.groupName}
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
                    {formatCurrency(mockSummary.income)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ArrowDown size={16} className="text-[#FF6B6B]" />
                    <span className="text-[#d3d3d3] text-sm">Despesas</span>
                  </div>
                  <span className="text-[#FF6B6B] font-medium">
                    {formatCurrency(mockSummary.expenses)}
                  </span>
                </div>
                <Divider className="border-[#555555]" />
                <div className="flex items-center justify-between">
                  <span className="text-[#d3d3d3] font-medium">Saldo</span>
                  <span className="text-[#5AA4E6] font-bold">
                    {formatCurrency(mockSummary.balance)}
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
                <p className="text-[#d3d3d3] font-medium">{mockSummary.topCategory.name}</p>
                <p className="text-[#FF6B6B] text-xl font-bold">
                  {formatCurrency(mockSummary.topCategory.amount)}
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
              {mockTransactions.map((transaction) => {
                const isIncome = transaction.type === "INCOME";

                return (
                  <div
                    key={transaction.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-[#555555] rounded-lg hover:bg-[#606060] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[#d3d3d3] font-medium text-base">
                        {transaction.description}
                      </p>
                      <p className="text-[#d3d3d3] opacity-60 text-sm mt-1">
                        {transaction.category} • {formatDate(transaction.date)}
                      </p>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <p className={`font-bold text-lg ${
                        isIncome ?
                          "text-[#5AA4E6]" :
                          "text-[#FF6B6B]"
                      }`}>
                        {isIncome ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Modal de Nova Transação */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Nova Transação"
      >
        <form onSubmit={handleSubmit(onSubmitTransaction)} className="space-y-4">
          {errors.root?.message &&
            <div className="bg-[#FF6B6B] bg-opacity-10 border border-[#FF6B6B] text-[#FF6B6B] px-4 py-3 rounded-md text-sm text-center">
              {errors.root.message}
            </div>
          }

          {/* Tipo de Transação */}
          <div>
            <label className="block text-[#d3d3d3] text-sm font-medium mb-2">
              Tipo de Transação
            </label>
            <div className="flex gap-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="INCOME"
                  className="sr-only"
                  {...register("type")}
                />
                <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#555555] text-[#d3d3d3] hover:bg-[#5AA4E6] hover:text-white transition-colors">
                  <ArrowUp size={16} />
                  <span>Receita</span>
                </div>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="EXPENSE"
                  className="sr-only"
                  {...register("type")}
                />
                <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#555555] text-[#d3d3d3] hover:bg-[#FF6B6B] hover:text-white transition-colors">
                  <ArrowDown size={16} />
                  <span>Despesa</span>
                </div>
              </label>
            </div>
          </div>

          <TextField
            type="number"
            label="Valor"
            placeholder="0,00"
            className="w-full"
            inputClassName="bg-[#555555] border-[#555555] text-[#d3d3d3] placeholder:text-[#999999] focus:border-[#296BA6] focus:ring-1 focus:ring-[#296BA6] transition-colors"
            tooltipContent="Valor da transação em reais"
            isRequired
            errorContent={errors.amount?.message}
            {...register("amount", { valueAsNumber: true })}
          />

          <TextField
            type="text"
            label="Descrição (opcional)"
            placeholder="Ex: Supermercado, Salário, etc."
            className="w-full"
            inputClassName="bg-[#555555] border-[#555555] text-[#d3d3d3] placeholder:text-[#999999] focus:border-[#296BA6] focus:ring-1 focus:ring-[#296BA6] transition-colors"
            tooltipContent="Descrição opcional da transação"
            errorContent={errors.description?.message}
            {...register("description")}
          />

          <TextField
            type="datetime-local"
            label="Data e Hora"
            className="w-full"
            inputClassName="bg-[#555555] border-[#555555] text-[#d3d3d3] placeholder:text-[#999999] focus:border-[#296BA6] focus:ring-1 focus:ring-[#296BA6] transition-colors"
            tooltipContent="Data e hora da transação"
            isRequired
            errorContent={errors.transactionDate?.message}
            {...register("transactionDate")}
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={closeModal}
              className="flex-1 bg-[#555555] hover:bg-[#666666] text-[#d3d3d3] py-2 rounded-md transition-colors"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isDisabled={isSubmitting}
              className="flex-1 bg-[#4592D7] hover:bg-[#5AA4E6] text-white py-2 rounded-md transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
