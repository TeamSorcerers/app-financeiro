"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Helpers e constantes no topo do módulo (fora do componente) — reduz complexidade e evita dependências de hook
const INITIALS_MAX = 2;

function hasOwnProp (obj: unknown, prop: string): boolean {
  return typeof obj === "object" && obj !== null && Object.hasOwn(obj, prop);
}

function isErrorLike (e: unknown): e is { message?: unknown } {
  return hasOwnProp(e, "message");
}

function getErrorMessage (e: unknown): string {
  if (e instanceof Error) {
    return e.message;
  }
  if (isErrorLike(e) && typeof (e as Record<string, unknown>).message === "string") {
    return (e as Record<string, string>).message;
  }

  return String(e ?? "Erro desconhecido");
}

function initials (name: string) {
  const parts = name.trim().split(/\s+/u);

  if (parts.length === 1) {
    return parts[0].slice(0, INITIALS_MAX).toUpperCase();
  }
  const first = parts[0][0] ?? "";
  const last = parts[parts.length - 1][0] ?? "";

  return (first + last).slice(0, INITIALS_MAX).toUpperCase();
}

// Componente extraído para cada card de grupo — reduz a complexidade de GroupsPage
function GroupCard ({ g, onOpen }: { g: { id: number; name: string; description: string | null; createdAt: string }, onOpen: (id: number) => void }) {
  return (
    <button
      key={g.id}
      onClick={() => onOpen(g.id)}
      className="w-full text-left flex items-center gap-4 bg-[#2A2D34] rounded-xl p-4
                 shadow-sm hover:shadow-md hover:translate-y-[-2px] hover:bg-[#2F3237] transition transform cursor-pointer"
      aria-label={`Abrir grupo ${g.name}`}
    >
      {/* Avatar com iniciais */}
      <div className="flex-shrink-0">
        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#3a3f46] text-[#A3D5FF] font-bold">
          {initials(g.name)}
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[#6FB1FC] text-base font-semibold truncate">{g.name}</h3>
        </div>
        <p className="mt-1 text-sm text-[#E0E0E0]/90 truncate">{g.description || "Sem descrição"}</p>
      </div>

      {/* Chevron discreto no final */}
      <div className="ml-3 text-[#A3D5FF] flex-shrink-0 cursor-pointer">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="opacity-80" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </button>
  );
}

/* Novo: Header extraído para reduzir complexidade do componente principal */
function Header ({
  session,
  onOpenModal,
  onSignOut,
}: {
  session: ReturnType<typeof useSession>["data"] | null | undefined;
  onOpenModal: () => void;
  onSignOut: () => void;
}) {
  const displayInitials = (() => {
    if (session?.user?.name) {
      return initials(session.user.name);
    }
    if (session?.user?.email) {
      return session.user.email.slice(0, INITIALS_MAX).toUpperCase();
    }

    return "US";
  })();

  const displayName = session?.user?.name ?? "Usuário";
  const displayEmail = session?.user?.email ?? "";

  return (
    <header className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-[#3a3f46] flex items-center justify-center text-[#A3D5FF] font-bold">
          {displayInitials}
        </div>
        <div>
          <div className="text-[#6FB1FC] font-semibold">{displayName}</div>
          <div className="text-sm text-[#E0E0E0]/80">{displayEmail}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onOpenModal}
          className="flex items-center h-10 gap-2 cursor-pointer bg-[#2A2D34] text-[#E0E0E0] px-4 rounded-[12px] font-semibold
                     border border-[#6FB1FC]/10 hover:border-[#6FB1FC]/30 transition-shadow shadow-sm hover:shadow-md"
        >
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#6FB1FC]/20 text-[#6FB1FC] text-sm font-bold">
            ＋
          </span>
          <span className="text-sm">Criar Grupo</span>
        </button>

        <button
          onClick={onSignOut}
          className="px-3 py-2 text-sm rounded-md bg-transparent text-[#A3D5FF] border border-transparent hover:border-[#A3D5FF]/20 cursor-pointer transition"
          title="Sair"
        >
          Sair
        </button>
      </div>
    </header>
  );
}

/* Novo: Modal de criação extraído */
function CreateGroupModal ({
  isOpen,
  onClose,
  name,
  setName,
  description,
  setDescription,
  creating,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  creating: boolean;
  onSubmit: (e?: React.FormEvent) => Promise<void>;
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <form
        onSubmit={async (e) => {
          e.stopPropagation();
          await onSubmit(e);
        }}
        onClick={(ev) => ev.stopPropagation()}
        className="w-full max-w-2xl bg-[#1E1E1E] p-6 rounded-xl shadow-lg border border-[#00000033]"
      >
        <h3 className="text-[#6FB1FC] text-lg font-semibold mb-4">Criar novo grupo</h3>

        <label className="block text-sm text-[#E0E0E0]">
          Nome
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Nome do grupo"
            className="mt-2 w-full p-3 rounded-lg bg-[#2A2D34] text-[#E0E0E0] shadow-sm placeholder:text-[#A3D5FF]/50"
          />
        </label>

        <label className="block text-sm text-[#E0E0E0] mt-4">
          Descrição
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Descrição do grupo"
            className="mt-2 w-full p-3 rounded-lg bg-[#2A2D34] text-[#E0E0E0] shadow-sm placeholder:text-[#A3D5FF]/50 min-h-[80px]"
          />
        </label>

        <div className="flex justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[#A3D5FF] rounded-lg font-semibold hover:underline transition text-sm cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={creating}
            className="px-4 py-2 bg-gradient-to-br from-[#6FB1FC] to-[#4EA8F8] text-white rounded-lg font-bold shadow-md disabled:opacity-60 text-sm cursor-pointer"
          >
            {creating ? "Criando..." : "Criar"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function HomePage () {
  // Hooks sempre no topo (sem condicionais antes)
  const { data: session, status: sessionStatus } = useSession();
  const [ groups, setGroups ] = useState<{ id: number; name: string; description: string | null; createdAt: string; updatedAt: string; }[] | null>(null);
  const [ loading, setLoading ] = useState(false);
  const [ error, setError ] = useState<string | null>(null);

  const [ activeTab, setActiveTab ] = useState<"requests" | "groups">("groups");
  const [ showModal, setShowModal ] = useState(false);
  const [ creating, setCreating ] = useState(false);
  const [ name, setName ] = useState("");
  const [ description, setDescription ] = useState("");

  const router = useRouter();

  // redirecionar se não autenticado
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [ sessionStatus, router ]);

  // carregamento de grupos
  useEffect(() => {
    let mounted = true;

    async function loadGroups () {
      if (!mounted) {
        return;
      }
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/group");

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));

          if (!mounted) {
            return;
          }
          setError(body?.error || "Erro ao buscar grupos");
          setGroups([]);

          return;
        }

        const data = await res.json();

        if (!mounted) {
          return;
        }

        if (!Array.isArray(data)) {
          setError("Resposta inválida do servidor");
          setGroups([]);

          return;
        }

        setGroups(data);
      } catch (err: unknown) {
        if (!mounted) {
          return;
        }
        setError(getErrorMessage(err) || "Erro de conexão");
        setGroups([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    // somente buscar se autenticado
    if (sessionStatus === "authenticated") {
      loadGroups();
    } else {
      // limpar quando não autenticado
      setGroups(null);
    }

    return () => {
      mounted = false;
    };
  }, [ sessionStatus ]); // dependência intencional: re-executa quando status muda

  // Funções de criação e navegação (mantidas simples)
  async function handleCreate (e?: React.FormEvent) {
    e?.preventDefault();
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

      // após criação, recarregar lista
      const refreshed = await fetch("/api/group");

      if (refreshed.ok) {
        const data = await refreshed.json();

        if (Array.isArray(data)) {
          setGroups(data);
        } else {
          setGroups([]);
        }
      } else {
        const body = await refreshed.json().catch(() => ({}));

        setError(body?.error || "Erro ao atualizar grupos");
        setGroups([]);
      }

      setShowModal(false);
      setName("");
      setDescription("");
    } catch (err: unknown) {
      const msg = getErrorMessage(err);

      console.error("Erro ao criar grupo:", msg);
      setError(msg || "Erro ao criar grupo");
    } finally {
      setCreating(false);
    }
  }

  function openGroup (id: number) {
    router.push(`/group/${id}`);
  }

  // tela de loading enquanto a sessão é verificada
  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen bg-[#1E1E1E] flex items-center justify-center">
        <div className="text-[#E0E0E0]">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1E1E1E] text-[#E0E0E0] p-6">
      {/* Header com avatar, nome e ações */}
      <Header
        session={session}
        onOpenModal={() => setShowModal(true)}
        onSignOut={() => signOut({ callbackUrl: "/login" })}
      />

      {/* Tabs (Meus Grupos primeiro) */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveTab("groups")}
          className={`px-4 py-2 rounded-[12px] font-semibold transition ${activeTab === "groups" ?
            "bg-[#2A2D34] ring-1 ring-[#6FB1FC]/60 shadow-sm" :
            "bg-transparent hover:bg-[#2A2D34]"} cursor-pointer`}
        >
          Meus Grupos
        </button>

        <button
          onClick={() => setActiveTab("requests")}
          className={`px-4 py-2 rounded-[12px] font-semibold transition ${activeTab === "requests" ?
            "bg-[#2A2D34] ring-1 ring-[#6FB1FC]/60 shadow-sm" :
            "bg-transparent hover:bg-[#2A2D34]"} cursor-pointer`}
        >
          Solicitações
        </button>
      </div>

      {/* Conteúdo */}
      <main className="space-y-4">
        {error &&
          <div className="bg-[#2A2D34] rounded-xl p-4 shadow-sm">
            <p className="text-[#FF6B6B]">{error}</p>
          </div>
        }

        {activeTab === "requests" &&
          <div className="bg-[#2A2D34] rounded-xl p-5 shadow-sm hover:shadow-md border border-[#00000033]">
            <h3 className="text-[#A3D5FF] text-base font-semibold">Solicitações</h3>
            <p className="mt-2 text-sm text-[#E0E0E0]/90">Aqui aparecerão as solicitações e convites de grupos. No momento não há solicitações.</p>
          </div>
        }

        {activeTab === "groups" &&
          <div className="grid gap-3">
            {loading &&
              <div className="bg-[#2A2D34] rounded-xl p-4 shadow-sm">
                <p>Carregando grupos...</p>
              </div>
            }

            {!loading && groups?.length === 0 &&
              <div className="bg-[#2A2D34] rounded-xl p-4 shadow-sm">
                <p>Você não participa de nenhum grupo ainda.</p>
              </div>
            }

            {!loading && groups && groups.map((g) => <GroupCard key={g.id} g={g} onOpen={openGroup} />)}
          </div>
        }
      </main>

      {/* Modal de criação */}
      <CreateGroupModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        name={name}
        setName={setName}
        description={description}
        setDescription={setDescription}
        creating={creating}
        onSubmit={handleCreate}
      />
    </div>
  );
}
