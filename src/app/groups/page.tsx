"use client";

import { INITIALS_MAX, ONE, ZERO } from "@/lib/shared/constants";
import { CheckCircle, Folder, Mail, Plus, Users, X, XCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface GroupItem {
  id: number;
  name: string;
  description: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

interface Invitation {
  id: number;
  sender: { id: number; name: string; email: string };
  group: { id: number; name: string };
  status: string;
  createdAt: string;
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

export default function GroupsPage () {
  const { status: sessionStatus } = useSession();
  const router = useRouter();

  const [ activeTab, setActiveTab ] = useState<"groups" | "invitations">("groups");
  const [ groups, setGroups ] = useState<GroupItem[]>([]);
  const [ invitations, setInvitations ] = useState<Invitation[]>([]);
  const [ loading, setLoading ] = useState(true);
  const [ invitesLoading, setInvitesLoading ] = useState(false);
  const [ error, setError ] = useState<string | null>(null);

  // Estados do modal de criação
  const [ showCreateModal, setShowCreateModal ] = useState(false);
  const [ creating, setCreating ] = useState(false);
  const [ name, setName ] = useState("");
  const [ description, setDescription ] = useState("");

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [ sessionStatus, router ]);

  async function fetchGroups () {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/group");

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));

        setError(body?.error || "Erro ao buscar grupos");
        setGroups([]);

        return;
      }

      const data = await res.json();

      if (!Array.isArray(data)) {
        setError("Resposta inválida do servidor");
        setGroups([]);

        return;
      }

      // Filtrar grupos pessoais (não devem aparecer aqui)
      const collaborativeGroups = data.filter((g: GroupItem) => g.type !== "PERSONAL");

      setGroups(collaborativeGroups);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro de conexão");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchInvitations () {
    setInvitesLoading(true);
    try {
      const res = await fetch("/api/group/invite", { credentials: "include" });

      if (!res.ok) {
        setInvitations([]);

        return;
      }

      const json = await res.json();

      setInvitations(Array.isArray(json?.invitations) ? json.invitations : []);
    } catch {
      setInvitations([]);
    } finally {
      setInvitesLoading(false);
    }
  }

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchGroups();
    }
  }, [ sessionStatus ]);

  useEffect(() => {
    if (activeTab === "invitations" && sessionStatus === "authenticated") {
      fetchInvitations();
    }
  }, [ activeTab, sessionStatus ]);

  async function handleCreate (e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      setError("Nome e descrição são obrigatórios");

      return;
    }

    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));

        throw new Error(body?.error || "Erro ao criar grupo");
      }

      await fetchGroups();
      setShowCreateModal(false);
      setName("");
      setDescription("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar grupo");
    } finally {
      setCreating(false);
    }
  }

  async function handleRespondInvitation (id: number, inviteStatus: "ACCEPTED" | "REJECTED") {
    try {
      const res = await fetch("/api/group/invite", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: inviteStatus }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));

        setError(body?.error || "Erro ao responder convite");

        return;
      }

      setInvitations((prev) => prev.filter((i) => i.id !== id));

      if (inviteStatus === "ACCEPTED") {
        await fetchGroups();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro de conexão");
    }
  }

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
      <header className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#4A90E2] mb-2">Meus Grupos</h1>
            <p className="text-sm text-[#6a6a6a]">Gerencie grupos colaborativos e convites</p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4A90E2] text-white font-bold shadow-[-4px_-4px_8px_rgba(255,255,255,0.6),4px_4px_8px_rgba(174,174,192,0.4)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.7),2px_2px_4px_rgba(174,174,192,0.5)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.2)] transition-all text-sm"
          >
            <Plus size={18} />
            <span>Criar Grupo</span>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab("groups")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
            activeTab === "groups" ?
              "bg-[#F0F0F3] text-[#4A90E2] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.2),inset_-3px_-3px_6px_rgba(255,255,255,0.9)]" :
              "bg-[#F0F0F3] text-[#6a6a6a] shadow-[-4px_-4px_8px_rgba(255,255,255,0.8),4px_4px_8px_rgba(174,174,192,0.25)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.9),2px_2px_4px_rgba(174,174,192,0.3)]"
          }`}
        >
          <Folder size={18} />
          <span className="text-sm">Grupos</span>
          <span className="ml-1 px-2 py-0.5 rounded-full bg-[#F0F0F3] text-xs font-bold shadow-[inset_2px_2px_4px_rgba(174,174,192,0.12)]">
            {groups.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("invitations")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
            activeTab === "invitations" ?
              "bg-[#F0F0F3] text-[#4A90E2] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.2),inset_-3px_-3px_6px_rgba(255,255,255,0.9)]" :
              "bg-[#F0F0F3] text-[#6a6a6a] shadow-[-4px_-4px_8px_rgba(255,255,255,0.8),4px_4px_8px_rgba(174,174,192,0.25)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.9),2px_2px_4px_rgba(174,174,192,0.3)]"
          }`}
        >
          <Mail size={18} />
          <span className="text-sm">Convites</span>
          {invitations.length > ZERO &&
            <span className="ml-1 px-2 py-0.5 rounded-full bg-[#c92a2a] text-white text-xs font-bold">
              {invitations.length}
            </span>
          }
        </button>
      </div>

      {error &&
        <div className="bg-[#ffd9d9] rounded-xl p-4 mb-6 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.08)] border border-[#ffb3b3]/30">
          <p className="text-[#c92a2a] text-sm">{error}</p>
        </div>
      }

      {/* Conteúdo */}
      {activeTab === "groups" &&
        <div className={`grid gap-4 ${groups.length === ONE ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
          {groups.length === ZERO &&
            <div className="col-span-full text-center text-[#6a6a6a] py-12">
              Você não participa de nenhum grupo colaborativo ainda.
            </div>
          }

          {groups.map((g) => <button
            key={g.id}
            onClick={() => router.push(`/group/${g.id}`)}
            className={`text-left bg-[#F0F0F3] rounded-2xl p-5 shadow-[-8px_-8px_16px_rgba(255,255,255,0.8),8px_8px_16px_rgba(174,174,192,0.25)] hover:shadow-[-4px_-4px_8px_rgba(255,255,255,0.9),4px_4px_8px_rgba(174,174,192,0.3)] active:shadow-[inset_3px_3px_6px_rgba(174,174,192,0.2),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] transition-all group ${groups.length === ONE ? "max-w-full" : ""}`}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#F0F0F3] shadow-[-4px_-4px_8px_rgba(255,255,255,0.8),4px_4px_8px_rgba(174,174,192,0.25)] group-hover:shadow-[inset_2px_2px_4px_rgba(174,174,192,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center transition-all">
                <span className="text-[#4A90E2] font-bold text-lg">{initials(g.name)}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-[#4a4a4a] truncate">{g.name}</h3>
                </div>
                <p className="text-sm text-[#6a6a6a] line-clamp-2">{g.description}</p>
              </div>

              <Users size={20} className="text-[#6a6a6a] flex-shrink-0 mt-1" />
            </div>
          </button>)}
        </div>
      }

      {activeTab === "invitations" &&
        <div className="bg-[#F0F0F3] rounded-2xl p-6 shadow-[-8px_-8px_16px_rgba(255,255,255,0.8),8px_8px_16px_rgba(174,174,192,0.25)]">
          <h2 className="text-lg font-semibold text-[#4a4a4a] mb-4 flex items-center gap-2">
            <Mail size={20} className="text-[#4A90E2]" />
            Convites Pendentes
          </h2>

          {invitesLoading &&
            <div className="text-center text-[#6a6a6a] py-8">Carregando convites...</div>
          }

          {!invitesLoading && invitations.length === ZERO &&
            <div className="text-center text-[#6a6a6a] py-8 text-sm">
              Você não tem convites pendentes
            </div>
          }

          {!invitesLoading && invitations.length > ZERO &&
            <div className="space-y-3">
              {invitations.map((inv) => <div
                key={inv.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-[#F0F0F3] rounded-xl shadow-[inset_2px_2px_4px_rgba(174,174,192,0.12)]"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#F0F0F3] shadow-[-3px_-3px_6px_rgba(255,255,255,0.9),3px_3px_6px_rgba(174,174,192,0.2)] flex items-center justify-center">
                    <span className="text-[#4A90E2] font-bold text-sm">
                      {initials(inv.sender.name)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#4a4a4a] truncate">
                      <strong>{inv.sender.name}</strong> convidou você
                    </p>
                    <p className="text-xs text-[#6a6a6a] truncate">
                      Para o grupo: <strong>{inv.group.name}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRespondInvitation(inv.id, "REJECTED")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#F0F0F3] text-[#c92a2a] font-medium shadow-[-3px_-3px_6px_rgba(255,255,255,0.9),3px_3px_6px_rgba(174,174,192,0.2)] hover:shadow-[inset_2px_2px_4px_rgba(174,174,192,0.2)] transition-all text-sm"
                  >
                    <XCircle size={16} />
                    <span>Rejeitar</span>
                  </button>

                  <button
                    onClick={() => handleRespondInvitation(inv.id, "ACCEPTED")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#4A90E2] text-white font-bold shadow-[-3px_-3px_6px_rgba(255,255,255,0.6),3px_3px_6px_rgba(174,174,192,0.4)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.7),2px_2px_4px_rgba(174,174,192,0.5)] transition-all text-sm"
                  >
                    <CheckCircle size={16} />
                    <span>Aceitar</span>
                  </button>
                </div>
              </div>)}
            </div>
          }
        </div>
      }

      {/* Modal Criar Grupo */}
      {showCreateModal &&
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreate}
            className="w-full max-w-md bg-[#F0F0F3] rounded-3xl shadow-[-6px_-6px_12px_rgba(255,255,255,0.9),6px_6px_12px_rgba(174,174,192,0.2)] p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#4A90E2]">Criar Novo Grupo</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-[#F0F0F3] shadow-[-3px_-3px_6px_rgba(255,255,255,0.9),3px_3px_6px_rgba(174,174,192,0.2)] hover:shadow-[inset_2px_2px_4px_rgba(174,174,192,0.2)] flex items-center justify-center transition-all"
              >
                <X size={16} className="text-[#6a6a6a]" />
              </button>
            </div>

            <label className="block text-sm text-[#4a4a4a] font-semibold mb-2">Nome do Grupo</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Viagem em Família"
              className="w-full px-4 py-2.5 mb-4 rounded-xl bg-[#F0F0F3] text-[#4a4a4a] placeholder:text-[#a0a0a0] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2)] focus:outline-none"
            />

            <label className="block text-sm text-[#4a4a4a] font-semibold mb-2">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Descreva o propósito do grupo..."
              rows={3}
              className="w-full px-4 py-2.5 mb-4 rounded-xl bg-[#F0F0F3] text-[#4a4a4a] placeholder:text-[#a0a0a0] shadow-[inset_3px_3px_6px_rgba(174,174,192,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] focus:shadow-[inset_4px_4px_8px_rgba(174,174,192,0.2)] focus:outline-none resize-none"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#F0F0F3] text-[#6a6a6a] font-semibold shadow-[-4px_-4px_8px_rgba(255,255,255,0.8),4px_4px_8px_rgba(174,174,192,0.25)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.9),2px_2px_4px_rgba(174,174,192,0.3)] transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creating}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#4A90E2] text-white font-bold shadow-[-4px_-4px_8px_rgba(255,255,255,0.6),4px_4px_8px_rgba(174,174,192,0.4)] hover:shadow-[-2px_-2px_4px_rgba(255,255,255,0.7),2px_2px_4px_rgba(174,174,192,0.5)] disabled:opacity-60 transition-all"
              >
                {creating ? "Criando..." : "Criar"}
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  );
}
