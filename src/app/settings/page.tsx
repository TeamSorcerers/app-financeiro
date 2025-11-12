"use client";

import { ZERO } from "@/lib/shared/constants";
import { Building2, CreditCard as CreditCardIcon, Wallet } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AccountSummary {
  paymentMethodsCount: number;
  bankAccountsCount: number;
  creditCardsCount: number;
}

export default function SettingsPage () {
  const { status: sessionStatus, data: session } = useSession();
  const router = useRouter();
  const [ summary, setSummary ] = useState<AccountSummary>({
    paymentMethodsCount: ZERO,
    bankAccountsCount: ZERO,
    creditCardsCount: ZERO,
  });
  const [ loading, setLoading ] = useState(true);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [ sessionStatus, router ]);

  async function loadAccountSummary () {
    setLoading(true);
    try {
      const [ pmRes, baRes, ccRes ] = await Promise.all([
        fetch("/api/payment-methods"),
        fetch("/api/bank-accounts"),
        fetch("/api/credit-cards"),
      ]);

      const [ pmData, baData, ccData ] = await Promise.all([
        pmRes.ok ? pmRes.json() : { paymentMethods: [] },
        baRes.ok ? baRes.json() : { bankAccounts: [] },
        ccRes.ok ? ccRes.json() : { creditCards: [] },
      ]);

      setSummary({
        paymentMethodsCount: pmData.paymentMethods?.length || ZERO,
        bankAccountsCount: baData.bankAccounts?.length || ZERO,
        creditCardsCount: ccData.creditCards?.length || ZERO,
      });
    } catch (err) {
      console.error("Erro ao carregar resumo:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      loadAccountSummary();
    }
  }, [ sessionStatus ]);

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F0F3]">
        <div className="text-[#4a4a4a] text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F0F3] p-4 sm:p-6">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#4A90E2] mb-2">Configurações</h1>
        <p className="text-sm text-[#6a6a6a]">
          Gerencie suas preferências e informações da conta
        </p>
      </header>

      {/* User Info Card */}
      <div className="bg-[#F0F0F3] rounded-2xl p-6 shadow-[-8px_-8px_16px_rgba(255,255,255,0.8),8px_8px_16px_rgba(174,174,192,0.25)] mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#F0F0F3] shadow-[-5px_-5px_10px_rgba(255,255,255,0.8),5px_5px_10px_rgba(174,174,192,0.25)] flex items-center justify-center">
            <span className="text-2xl font-bold text-[#4A90E2]">
              {session?.user?.name?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-[#4a4a4a] truncate">
              {session?.user?.name || "Usuário"}
            </h2>
            <p className="text-sm text-[#6a6a6a] truncate">{session?.user?.email}</p>
          </div>
        </div>
      </div>

      {/* Configurações Financeiras Card */}
      <button
        onClick={() => router.push("/settings/financial")}
        className="w-full text-left bg-[#F0F0F3] rounded-2xl p-6 shadow-[-8px_-8px_16px_rgba(255,255,255,0.8),8px_8px_16px_rgba(174,174,192,0.25)] hover:shadow-[-4px_-4px_8px_rgba(255,255,255,0.9),4px_4px_8px_rgba(174,174,192,0.3)] active:shadow-[inset_3px_3px_6px_rgba(174,174,192,0.2),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] transition-all group mb-6"
      >
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl bg-[#F0F0F3] shadow-[-4px_-4px_8px_rgba(255,255,255,0.8),4px_4px_8px_rgba(174,174,192,0.25)] group-hover:shadow-[inset_2px_2px_4px_rgba(174,174,192,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center transition-all"
          >
            <Wallet size={24} className="text-[#4A90E2]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-[#4a4a4a] mb-1 truncate">
              Configurações Financeiras
            </h3>
            <p className="text-sm text-[#6a6a6a] line-clamp-2">Métodos de pagamento, contas bancárias e cartões</p>
          </div>
        </div>
      </button>

      {/* Quick Stats */}
      <div className="bg-[#F0F0F3] rounded-2xl p-6 shadow-[-8px_-8px_16px_rgba(255,255,255,0.8),8px_8px_16px_rgba(174,174,192,0.25)] mb-6">
        <h3 className="text-lg font-semibold text-[#4a4a4a] mb-4">Resumo da Conta</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-[#F0F0F3] rounded-xl shadow-[inset_2px_2px_4px_rgba(174,174,192,0.12)]">
            <div className="flex items-center gap-3 mb-2">
              <Wallet size={20} className="text-[#4A90E2]" />
              <span className="text-sm font-medium text-[#6a6a6a]">Métodos de Pagamento</span>
            </div>
            <p className="text-2xl font-bold text-[#4a4a4a]">{summary.paymentMethodsCount}</p>
            <p className="text-xs text-[#6a6a6a] mt-1">
              {summary.paymentMethodsCount === ZERO ? "Configurar agora" : "Cadastrados"}
            </p>
          </div>

          <div className="p-4 bg-[#F0F0F3] rounded-xl shadow-[inset_2px_2px_4px_rgba(174,174,192,0.12)]">
            <div className="flex items-center gap-3 mb-2">
              <Building2 size={20} className="text-[#4A90E2]" />
              <span className="text-sm font-medium text-[#6a6a6a]">Contas Bancárias</span>
            </div>
            <p className="text-2xl font-bold text-[#4a4a4a]">{summary.bankAccountsCount}</p>
            <p className="text-xs text-[#6a6a6a] mt-1">
              {summary.bankAccountsCount === ZERO ? "Adicionar contas" : "Cadastradas"}
            </p>
          </div>

          <div className="p-4 bg-[#F0F0F3] rounded-xl shadow-[inset_2px_2px_4px_rgba(174,174,192,0.12)]">
            <div className="flex items-center gap-3 mb-2">
              <CreditCardIcon size={20} className="text-[#4A90E2]" />
              <span className="text-sm font-medium text-[#6a6a6a]">Cartões</span>
            </div>
            <p className="text-2xl font-bold text-[#4a4a4a]">{summary.creditCardsCount}</p>
            <p className="text-xs text-[#6a6a6a] mt-1">
              {summary.creditCardsCount === ZERO ? "Cadastrar cartões" : "Cadastrados"}
            </p>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-[#F0F0F3] rounded-2xl p-6 shadow-[-8px_-8px_16px_rgba(255,255,255,0.8),8px_8px_16px_rgba(174,174,192,0.25)]">
        <h3 className="text-lg font-semibold text-[#4a4a4a] mb-3">Precisa de ajuda?</h3>
        <p className="text-sm text-[#6a6a6a] mb-4">
          Acesse nossa central de ajuda para obter suporte sobre configurações e funcionalidades do
          aplicativo.
        </p>
        <button className="px-4 py-2 rounded-xl bg-[#F0F0F3] text-[#4A90E2] font-semibold shadow-[-4px_-4px_8px_rgba(255,255,255,0.8),4px_4px_8px_rgba(174,174,192,0.25)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.9),2px_2px_4px_rgba(174,174,192,0.3)] active:shadow-[inset_2px_2px_4px_rgba(174,174,192,0.2)] transition-all text-sm">
          Abrir Central de Ajuda
        </button>
      </div>
    </div>
  );
}
