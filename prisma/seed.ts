import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  // Categorias de Receitas
  { name: "Salário" },
  { name: "Freelance" },
  { name: "Investimentos" },
  { name: "Vendas" },
  { name: "Rendimentos" },
  { name: "Bonificações" },
  { name: "Outros Ganhos" },

  // Categorias de Despesas
  { name: "Alimentação" },
  { name: "Transporte" },
  { name: "Moradia" },
  { name: "Saúde" },
  { name: "Educação" },
  { name: "Entretenimento" },
  { name: "Compras" },
  { name: "Serviços" },
  { name: "Impostos" },
  { name: "Seguros" },
  { name: "Viagens" },
  { name: "Pets" },
  { name: "Doações" },
  { name: "Outros Gastos" },
];

async function main () {
  console.log("🌱 Iniciando seed das categorias...");

  const existing = await prisma.financialCategory.findMany();
  const existingNames = new Set(existing.map((c) => c.name));

  const toCreate = categories.filter((category) => !existingNames.has(category.name));

  await Promise.all(
    toCreate.map(async (category) => {
      await prisma.financialCategory.create({ data: category });
      console.log(`✅ Categoria criada: ${category.name}`);
    }),
  );

  if (toCreate.length === 0) {
    console.log("⏭️ Todas as categorias já existem.");
  }

  console.log("🎉 Seed das categorias concluído!");
}

async function runSeed () {
  try {
    await main();
    await prisma.$disconnect();
  } catch (e) {
    console.error("❌ Erro durante o seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  }
}

runSeed();
