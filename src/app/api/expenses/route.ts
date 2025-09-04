import logger from "@/lib/server/logger";

export function GET () {
  logger.info("Obtendo despesas");

  return Response.json({ message: "Despesas obtidas com sucesso" });
}

export function POST () {
  logger.info("Criando nova despesa");

  return Response.json({ message: "Despesa criada com sucesso" });
}
