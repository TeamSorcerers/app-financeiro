import Button from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import TextField from "@/components/ui/textfield";
import gateways from "@/lib/client/gateways";
import { HTTP_STATUS } from "@/lib/shared/constants";
import { TransactionSchema, TransactionSchemaData } from "@/lib/shared/schemas/transaction";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

interface AddTransactionProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PAD_LENGTH = 2;

function getDefaultDate () {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(PAD_LENGTH, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export default function AddTransaction ({ isOpen, onClose, onSuccess }: AddTransactionProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TransactionSchemaData>({
    resolver: zodResolver(TransactionSchema),
    mode: "onChange",
    defaultValues: {
      type: "EXPENSE",
      transactionDate: getDefaultDate(),
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [ isOpen, reset ]);

  const selectedType = watch("type");

  const onSubmit = async (data: TransactionSchemaData) => {
    try {
      // Corrige o formato da data para ISO
      const payload = {
        ...data,
        transactionDate: new Date(data.transactionDate).toISOString(),
      };
      const response = await fetch(gateways.CREATE_TRANSACTION(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
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
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch {
      setError("root", {
        type: "network",
        message: "Erro de conexão. Tente novamente.",
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Transação">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root?.message &&
          <div className="bg-[#FF6B6B] bg-opacity-10 border border-[#FF6B6B] text-[#FF6B6B] px-4 py-3 rounded-md text-sm text-center">
            {errors.root.message}
          </div>
        }
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
              <div className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors
                ${selectedType === "INCOME" ? "bg-[#5AA4E6] text-white" : "bg-[#555555] text-[#d3d3d3] hover:bg-[#5AA4E6] hover:text-white"}`}
              >
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
              <div className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors
                ${selectedType === "EXPENSE" ? "bg-[#FF6B6B] text-white" : "bg-[#555555] text-[#d3d3d3] hover:bg-[#FF6B6B] hover:text-white"}`}
              >
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
            onClick={onClose}
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
  );
}
