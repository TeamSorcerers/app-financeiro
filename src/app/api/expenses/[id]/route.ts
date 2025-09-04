import logger from "@/lib/server/logger";
import { RouteParams } from "@/lib/shared/types";

export async function GET (
  request: Request,
  { params }: RouteParams<{ id: string }>,
) {
  const { id } = await params;

  // Apenas temporário - Remover depois
  logger.info(`Obtendo despesa com id: ${id}`);

  return Response.json({ message: "Despesa obtida com sucesso" });
}

export async function PUT (
  request: Request,
  { params }: RouteParams<{ id: string }>,
) {
  const { id } = await params;

  // Apenas temporário - Remover depois
  logger.info(`Atualizando despesa com id: ${id}`);

  return Response.json({ message: "Despesa atualizada com sucesso" });
}

export async function DELETE (
  request: Request,
  { params }: RouteParams<{ id: string }>,
) {
  const { id } = await params;

  // Apenas temporário - Remover depois
  logger.info(`Apagando despesa com id: ${id}`);

  return Response.json({ message: "Despesa apagada com sucesso" });
}
