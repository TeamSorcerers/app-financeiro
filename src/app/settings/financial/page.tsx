"use client";

import { ZERO } from "@/lib/shared/constants";
import { Building2, CreditCard as CreditCardIcon, Plus, Wallet } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type TabType = "payment-methods" | "bank-accounts" | "credit-cards";

interface PaymentMethod {
  id: number;
  name: string;
  type: string;
  description?: string | null;
}

interface BankAccount {
  id: number;
  name: string;
  bank: string;
  balance: number;
}

interface CreditCard {
  id: number;
  name: string;
  last4Digits: string;
  brand: string;
  type: "CREDIT" | "DEBIT" | "BOTH";
  creditLimit: number | null;
  closingDay: number | null;
  dueDay: number | null;
}

export default function FinancialSettingsPage() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("payment-methods");
  const [loading, setLoading] = useState(false);

  // Estados dos dados
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);

  // Estados dos modais
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showBankAccountModal, setShowBankAccountModal] = useState(false);
  const [showCreditCardModal, setShowCreditCardModal] = useState(false);

  // Estados dos formulários - Método de Pagamento
  const [pmName, setPmName] = useState("");
  const [pmType, setPmType] = useState("PIX");
  const [pmDescription, setPmDescription] = useState("");
  const [pmError, setPmError] = useState("");

  // Estados dos formulários - Conta Bancária
  const [baName, setBaName] = useState("");
  const [baBank, setBaBank] = useState("");
  const [baBalance, setBaBalance] = useState("");
  const [baError, setBaError] = useState("");

  // Estados dos formulários - Cartão de Crédito
  const [ccName, setCcName] = useState("");
  const [ccLast4, setCcLast4] = useState("");
  const [ccBrand, setCcBrand] = useState("");
  const [ccType, setCcType] = useState("CREDIT");
  const [ccLimit, setCcLimit] = useState("");
  const [ccClosingDay, setCcClosingDay] = useState("");
  const [ccDueDay, setCcDueDay] = useState("");
  const [ccError, setCcError] = useState("");

  // Estado para detalhes do cartão
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);
  const [cardUsage, setCardUsage] = useState<any[]>([]);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [sessionStatus, router]);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      loadData();
    }
  }, [sessionStatus, activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      if (activeTab === "payment-methods") {
        const res = await fetch("/api/payment-methods");
        if (res.ok) {
          const data = await res.json();
          setPaymentMethods(data.paymentMethods || []);
        }
      } else if (activeTab === "bank-accounts") {
        const res = await fetch("/api/bank-accounts");
        if (res.ok) {
          const data = await res.json();
          setBankAccounts(data.bankAccounts || []);
        }
      } else if (activeTab === "credit-cards") {
        const res = await fetch("/api/credit-cards");
        if (res.ok) {
          const data = await res.json();
          setCreditCards(data.creditCards || []);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePaymentMethod(e: React.FormEvent) {
    e.preventDefault();
    setPmError("");

    try {
      const res = await fetch("/api/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pmName.trim(),
          type: pmType,
          description: pmDescription.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPmError(data.error || "Erro ao criar método de pagamento");
        return;
      }

      setPmName("");
      setPmType("PIX");
      setPmDescription("");
      setShowPaymentMethodModal(false);
      loadData();
    } catch {
      setPmError("Erro de conexão");
    }
  }

  async function handleCreateBankAccount(e: React.FormEvent) {
    e.preventDefault();
    setBaError("");

    try {
      const res = await fetch("/api/bank-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: baName.trim(),
          bank: baBank.trim(),
          balance: parseFloat(baBalance) || ZERO,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setBaError(data.error || "Erro ao criar conta bancária");
        return;
      }

      setBaName("");
      setBaBank("");
      setBaBalance("");
      setShowBankAccountModal(false);
      loadData();
    } catch {
      setBaError("Erro de conexão");
    }
  }

  async function handleCreateCreditCard(e: React.FormEvent) {
    e.preventDefault();
    setCcError("");

    if (ccLast4.length !== 4 || !/^\d+$/u.test(ccLast4)) {
      setCcError("Últimos 4 dígitos devem conter exatamente 4 números");
      return;
    }

    const payload: Record<string, unknown> = {
      name: ccName.trim(),
      last4Digits: ccLast4,
      brand: ccBrand.trim(),
      type: ccType,
    };

    if (ccType === "CREDIT" || ccType === "BOTH") {
      if (!ccLimit || !ccClosingDay || !ccDueDay) {
        setCcError("Cartões de crédito precisam de limite, dia de fechamento e vencimento");
        return;
      }
      payload.creditLimit = parseFloat(ccLimit);
      payload.closingDay = parseInt(ccClosingDay);
      payload.dueDay = parseInt(ccDueDay);
    }

    try {
      const res = await fetch("/api/credit-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setCcError(data.error || "Erro ao criar cartão");
        return;
      }

      setCcName("");
      setCcLast4("");
      setCcBrand("");
      setCcType("CREDIT");
      setCcLimit("");
      setCcClosingDay("");
      setCcDueDay("");
      setShowCreditCardModal(false);
      loadData();
    } catch {
      setCcError("Erro de conexão");
    }
  }

  async function loadCardUsage(cardId: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/credit-cards/${cardId}/usage`);
      if (res.ok) {
        const data = await res.json();
        setCardUsage(data.usage || []);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do cartão:", err);
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: "payment-methods" as TabType, label: "Métodos de Pagamento", icon: Wallet },
    { id: "bank-accounts" as TabType, label: "Contas Bancárias", icon: Building2 },
    { id: "credit-cards" as TabType, label: "Cartões de Crédito", icon: CreditCardIcon },
  ];

  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F0F3]">
        <div className="text-[#4a4a4a] text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F0F3] p-4 sm:p-6">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#4A90E2] mb-2">Configurações Financeiras</h1>
        <p className="text-sm text-[#6a6a6a]">Gerencie seus métodos de pagamento, contas e cartões</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[#F0F0F3] text-[#4A90E2] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.2),inset_-3px_-3px_6px_rgba(255,255,255,0.9)]"
                : "bg-[#F0F0F3] text-[#6a6a6a] shadow-[-4px_-4px_8px_rgba(255,255,255,0.8),4px_4px_8px_rgba(174,174,192,0.25)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.9),2px_2px_4px_rgba(174,174,192,0.3)]"
            }`}
          >
            <tab.icon size={18} />
            <span className="text-sm">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div className="bg-[#F0F0F3] rounded-2xl p-6 shadow-[-8px_-8px_16px_rgba(255,255,255,0.8),8px_8px_16px_rgba(174,174,192,0.25)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#4a4a4a]">
            {activeTab === "payment-methods" && "Meus Métodos de Pagamento"}
            {activeTab === "bank-accounts" && "Minhas Contas Bancárias"}
            {activeTab === "credit-cards" && "Meus Cartões"}
          </h2>

          <button
            onClick={() => {
              if (activeTab === "payment-methods") setShowPaymentMethodModal(true);
              if (activeTab === "bank-accounts") setShowBankAccountModal(true);
              if (activeTab === "credit-cards") setShowCreditCardModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4A90E2] text-white font-semibold shadow-[-4px_-4px_8px_rgba(255,255,255,0.6),4px_4px_8px_rgba(174,174,192,0.4)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.7),2px_2px_4px_rgba(174,174,192,0.5)] transition-all text-sm"
          >
            <Plus size={16} />
            Adicionar
          </button>
        </div>

        {loading ? (
          <div className="text-center text-[#6a6a6a] py-8">Carregando...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTab === "payment-methods" && paymentMethods.length === ZERO && (
              <div className="col-span-full text-center text-[#6a6a6a] py-8 text-sm">
                Nenhum método de pagamento cadastrado
              </div>
            )}

            {activeTab === "payment-methods" &&
              paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className="p-4 bg-[#F0F0F3] rounded-xl shadow-[inset_2px_2px_4px_rgba(174,174,192,0.12)]"
                >
                  <div className="flex items-center gap-3">
                    <Wallet size={20} className="text-[#4A90E2]" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#4a4a4a] truncate">{pm.name}</p>
                      <p className="text-xs text-[#6a6a6a]">{pm.type}</p>
                      {pm.description && <p className="text-xs text-[#6a6a6a] mt-1 truncate">{pm.description}</p>}
                    </div>
                  </div>
                </div>
              ))}

            {activeTab === "bank-accounts" && bankAccounts.length === ZERO && (
              <div className="col-span-full text-center text-[#6a6a6a] py-8 text-sm">
                Nenhuma conta bancária cadastrada
              </div>
            )}

            {activeTab === "bank-accounts" &&
              bankAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-4 bg-[#F0F0F3] rounded-xl shadow-[inset_2px_2px_4px_rgba(174,174,192,0.12)]"
                >
                  <div className="flex items-center gap-3">
                    <Building2 size={20} className="text-[#4A90E2]" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#4a4a4a] truncate">{acc.name}</p>
                      <p className="text-xs text-[#6a6a6a]">{acc.bank}</p>
                      <p className="text-sm font-bold text-[#4A90E2] mt-1">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(acc.balance)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

            {activeTab === "credit-cards" && creditCards.length === ZERO && (
              <div className="col-span-full text-center text-[#6a6a6a] py-8 text-sm">Nenhum cartão cadastrado</div>
            )}

            {activeTab === "credit-cards" &&
              creditCards.map((card) => (
                <div
                  key={card.id}
                  className="p-4 bg-[#F0F0F3] rounded-xl shadow-[inset_2px_2px_4px_rgba(174,174,192,0.12)]"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <CreditCardIcon size={20} className="text-[#4A90E2]" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#4a4a4a] truncate">{card.name}</p>
                        <p className="text-xs text-[#6a6a6a]">
                          {card.brand} •••• {card.last4Digits}
                        </p>
                      </div>
                    </div>
                    
                    {card.creditLimit && (card.type === "CREDIT" || card.type === "BOTH") && (
                      <div className="border-t border-[#d0d0d0] pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-[#6a6a6a]">Limite Total:</span>
                          <span className="text-xs font-bold text-[#4a4a4a]">
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                              card.creditLimit,
                            )}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => {
                            setSelectedCard(card);
                            loadCardUsage(card.id);
                          }}
                          className="w-full text-xs text-[#4A90E2] hover:text-[#2E6FB7] transition mt-2"
                        >
                          Ver detalhes do uso
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Modal Método de Pagamento */}
      {showPaymentMethodModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
          onClick={() => setShowPaymentMethodModal(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreatePaymentMethod}
            className="w-full max-w-md bg-[#F0F0F3] rounded-3xl shadow-[-6px_-6px_12px_rgba(255,255,255,0.9),6px_6px_12px_rgba(174,174,192,0.2)] p-6"
          >
            <h3 className="text-xl font-bold text-[#4A90E2] mb-4">Novo Método de Pagamento</h3>

            {pmError && (
              <div className="mb-4 p-3 bg-[#ffd9d9] rounded-xl text-[#c92a2a] text-sm shadow-[inset_2px_2px_4px_rgba(0,0,0,0.08)]">
                {pmError}
              </div>
            )}

            <label className="block text-sm text-[#4a4a4a] font-semibold mb-2">Nome</label>
            <input
              value={pmName}
              onChange={(e) => setPmName(e.target.value)}
              required
              placeholder="Ex: Meu PIX, Dinheiro..."
              className="w-full px-4 py-2.5 mb-4 rounded-xl bg-[#F0F0F3] text-[#4a4a4a] placeholder:text-[#a0a0a0] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2)] focus:outline-none"
            />

            <label className="block text-sm text-[#4a4a4a] font-semibold mb-2">Tipo</label>
            <select
              value={pmType}
              onChange={(e) => setPmType(e.target.value)}
              className="w-full px-4 py-2.5 mb-4 rounded-xl bg-[#F0F0F3] text-[#4a4a4a] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2)] focus:outline-none"
            >
              <option value="PIX">PIX</option>
              <option value="CREDIT_CARD">Cartão de Crédito</option>
              <option value="DEBIT_CARD">Cartão de Débito</option>
              <option value="CASH">Dinheiro</option>
              <option value="BANK_TRANSFER">Transferência Bancária</option>
              <option value="CHECK">Cheque</option>
              <option value="OTHER">Outro</option>
            </select>

            <label className="block text-sm text-[#4a4a4a] font-semibold mb-2">Descrição (opcional)</label>
            <textarea
              value={pmDescription}
              onChange={(e) => setPmDescription(e.target.value)}
              placeholder="Informações adicionais..."
              rows={2}
              className="w-full px-4 py-2.5 mb-4 rounded-xl bg-[#F0F0F3] text-[#4a4a4a] placeholder:text-[#a0a0a0] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2)] focus:outline-none resize-none"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowPaymentMethodModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#F0F0F3] text-[#6a6a6a] font-semibold shadow-[-4px_-4px_8px_rgba(255,255,255,0.8),4px_4px_8px_rgba(174,174,192,0.25)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.9),2px_2px_4px_rgba(174,174,192,0.3)] transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#4A90E2] text-white font-bold shadow-[-4px_-4px_8px_rgba(255,255,255,0.6),4px_4px_8px_rgba(174,174,192,0.4)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.7),2px_2px_4px_rgba(174,174,192,0.5)] transition-all"
              >
                Criar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Conta Bancária */}
      {showBankAccountModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
          onClick={() => setShowBankAccountModal(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateBankAccount}
            className="w-full max-w-md bg-[#F0F0F3] rounded-3xl shadow-[-6px_-6px_12px_rgba(255,255,255,0.9),6px_6px_12px_rgba(174,174,192,0.2)] p-6"
          >
            <h3 className="text-xl font-bold text-[#4A90E2] mb-4">Nova Conta Bancária</h3>

            {baError && (
              <div className="mb-4 p-3 bg-[#ffd9d9] rounded-xl text-[#c92a2a] text-sm shadow-[inset_2px_2px_4px_rgba(0,0,0,0.08)]">
                {baError}
              </div>
            )}

            <label className="block text-sm text-[#4a4a4a] font-semibold mb-2">Nome da Conta</label>
            <input
              value={baName}
              onChange={(e) => setBaName(e.target.value)}
              required
              placeholder="Ex: Conta Corrente"
              className="w-full px-4 py-2.5 mb-4 rounded-xl bg-[#F0F0F3] text-[#4a4a4a] placeholder:text-[#a0a0a0] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2)] focus:outline-none"
            />

            <label className="block text-sm text-[#4a4a4a] font-semibold mb-2">Banco</label>
            <input
              value={baBank}
              onChange={(e) => setBaBank(e.target.value)}
              required
              placeholder="Ex: Nubank, Inter, Bradesco..."
              className="w-full px-4 py-2.5 mb-4 rounded-xl bg-[#F0F0F3] text-[#4a4a4a] placeholder:text-[#a0a0a0] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2)] focus:outline-none"
            />

            <label className="block text-sm text-[#4a4a4a] font-semibold mb-2">Saldo Inicial (opcional)</label>
            <input
              type="number"
              step="0.01"
              value={baBalance}
              onChange={(e) => setBaBalance(e.target.value)}
              placeholder="0,00"
              className="w-full px-4 py-2.5 mb-4 rounded-xl bg-[#F0F0F3] text-[#4a4a4a] placeholder:text-[#a0a0a0] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2)] focus:outline-none"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowBankAccountModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#F0F0F3] text-[#6a6a6a] font-semibold shadow-[-4px_-4px_8px_rgba(255,255,255,0.8),4px_4px_8px_rgba(174,174,192,0.25)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.9),2px_2px_4px_rgba(174,174,192,0.3)] transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#4A90E2] text-white font-bold shadow-[-4px_-4px_8px_rgba(255,255,255,0.6),4px_4px_8px_rgba(174,174,192,0.4)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.7),2px_2px_4px_rgba(174,174,192,0.5)] transition-all"
              >
                Criar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Cartão de Crédito */}
      {showCreditCardModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
          onClick={() => setShowCreditCardModal(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateCreditCard}
            className="w-full max-w-md bg-[#F0F0F3] rounded-3xl shadow-[-6px_-6px_12px_rgba(255,255,255,0.9),6px_6px_12px_rgba(174,174,192,0.2)] p-6 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-bold text-[#4A90E2] mb-4">Novo Cartão</h3>

            {ccError && (
              <div className="mb-4 p-3 bg-[#ffd9d9] rounded-xl text-[#c92a2a] text-sm shadow-[inset_2px_2px_4px_rgba(0,0,0,0.08)]">
                {ccError}
              </div>
            )}

            <label className="block text-sm text-[#4a4a4a] font-semibold mb-2">Nome do Cartão</label>
            <input
              value={ccName}
              onChange={(e) => setCcName(e.target.value)}
              required
              placeholder="Ex: Cartão Principal"
              className="w-full px-4 py-2.5 mb-4 rounded-xl bg-[#F0F0F3] text-[#4a4a4a] placeholder:text-[#a0a0a0] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2)] focus:outline-none"
            />

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm text-[#4a4a4a] font-semibold mb-2">Últimos 4 Dígitos</label>
                <input
                  value={ccLast4}
                  onChange={(e) => setCcLast4(e.target.value.replace(/\D/gu, "").slice(0, 4))}
                  required
                  placeholder="1234"
                  maxLength={4}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F0F0F3] text-[#4a4a4a] placeholder:text-[#a0a0a0] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-[#4a4a4a] font-semibold mb-2">Bandeira</label>
                <input
                  value={ccBrand}
                  onChange={(e) => setCcBrand(e.target.value)}
                  required
                  placeholder="Visa, Mastercard..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F0F0F3] text-[#4a4a4a] placeholder:text-[#a0a0a0] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2)] focus:outline-none"
                />
              </div>
            </div>

            <label className="block text-sm text-[#4a4a4a] font-semibold mb-2">Tipo</label>
            <select
              value={ccType}
              onChange={(e) => setCcType(e.target.value)}
              className="w-full px-4 py-2.5 mb-4 rounded-xl bg-[#F0F0F3] text-[#4a4a4a] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2)] focus:outline-none"
            >
              <option value="CREDIT">Crédito</option>
              <option value="DEBIT">Débito</option>
              <option value="BOTH">Crédito e Débito</option>
            </select>

            {(ccType === "CREDIT" || ccType === "BOTH") && (
              <>
                <label className="block text-sm text-[#4a4a4a] font-semibold mb-2">Limite de Crédito</label>
                <input
                  type="number"
                  step="0.01"
                  value={ccLimit}
                  onChange={(e) => setCcLimit(e.target.value)}
                  required={ccType === "CREDIT" || ccType === "BOTH"}
                  placeholder="0,00"
                  className="w-full px-4 py-2.5 mb-4 rounded-xl bg-[#F0F0F3] text-[#4a4a4a] placeholder:text-[#a0a0a0] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2)] focus:outline-none"
                />

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-sm text-[#4a4a4a] font-semibold mb-2">Dia Fechamento</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={ccClosingDay}
                      onChange={(e) => setCcClosingDay(e.target.value)}
                      required={ccType === "CREDIT" || ccType === "BOTH"}
                      placeholder="10"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F0F0F3] text-[#4a4a4a] placeholder:text-[#a0a0a0] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#4a4a4a] font-semibold mb-2">Dia Vencimento</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={ccDueDay}
                      onChange={(e) => setCcDueDay(e.target.value)}
                      required={ccType === "CREDIT" || ccType === "BOTH"}
                      placeholder="20"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F0F0F3] text-[#4a4a4a] placeholder:text-[#a0a0a0] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2)] focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCreditCardModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#F0F0F3] text-[#6a6a6a] font-semibold shadow-[-4px_-4px_8px_rgba(255,255,255,0.8),4px_4px_8px_rgba(174,174,192,0.25)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.9),2px_2px_4px_rgba(174,174,192,0.3)] transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#4A90E2] text-white font-bold shadow-[-4px_-4px_8px_rgba(255,255,255,0.6),4px_4px_8px_rgba(174,174,192,0.4)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.7),2px_2px_4px_rgba(174,174,192,0.5)] transition-all"
              >
                Criar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
