import { BankAccount, CardType, FinancialGroup, GroupType, PaymentMethodType, PrismaClient, RecurringFrequency, TransactionType, User } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;
const MIN_COLLABORATIVE_GROUPS = 2;
const MIN_GROUPS_FOR_TRAVEL = 3;

const categories = [
  // Categorias de Receitas
  { name: "Salário", isGlobal: true },
  { name: "Freelance", isGlobal: true },
  { name: "Investimentos", isGlobal: true },
  { name: "Vendas", isGlobal: true },
  { name: "Rendimentos", isGlobal: true },
  { name: "Bonificações", isGlobal: true },
  { name: "Outros Ganhos", isGlobal: true },

  // Categorias de Despesas
  { name: "Alimentação", isGlobal: true },
  { name: "Transporte", isGlobal: true },
  { name: "Moradia", isGlobal: true },
  { name: "Saúde", isGlobal: true },
  { name: "Educação", isGlobal: true },
  { name: "Entretenimento", isGlobal: true },
  { name: "Compras", isGlobal: true },
  { name: "Serviços", isGlobal: true },
  { name: "Impostos", isGlobal: true },
  { name: "Seguros", isGlobal: true },
  { name: "Viagens", isGlobal: true },
  { name: "Pets", isGlobal: true },
  { name: "Doações", isGlobal: true },
  { name: "Outros Gastos", isGlobal: true },
];

async function createTestUsers () {
  console.log("Criando usuários de teste...");

  const hashedPassword = await bcrypt.hash("123456", SALT_ROUNDS);

  const users = [
    {
      email: "gabriel@teste.com",
      name: "Gabriel Silva",
      password: hashedPassword,
    },
    {
      email: "maria@teste.com",
      name: "Maria Santos",
      password: hashedPassword,
    },
    {
      email: "joao@teste.com",
      name: "João Oliveira",
      password: hashedPassword,
    },
  ];

  const userPromises = users.map(async (userData) => {
    const existing = await prisma.user.findUnique({ where: { email: userData.email } });

    if (existing) {
      console.log(`Usuário já existe: ${existing.name}`);

      return existing;
    }

    const user = await prisma.user.create({ data: userData });

    console.log(`Usuário criado: ${user.name}`);

    return user;
  });

  const createdUsers = await Promise.all(userPromises);

  return createdUsers;
}

async function createFinancialGroups (users: User[]) {
  console.log("Criando grupos financeiros...");

  const groups = [
    {
      name: "Pessoal - Gabriel",
      description: "Controle financeiro pessoal",
      createdById: users[0].id,
      type: GroupType.PERSONAL,
    },
    {
      name: "Casa da Família Silva",
      description: "Gastos compartilhados da casa",
      createdById: users[0].id,
      type: GroupType.COLLABORATIVE,
    },
    {
      name: "Viagem em Grupo",
      description: "Controle de gastos da viagem",
      createdById: users[1].id,
      type: GroupType.COLLABORATIVE,
    },
  ];

  const groupPromises = groups.map(async (groupData) => {
    const existingGroup = await prisma.financialGroup.findFirst({
      where: {
        name: groupData.name,
        createdById: groupData.createdById,
      },
    });

    if (existingGroup) {
      console.log(`Grupo já existe: ${existingGroup.name}`);

      return existingGroup;
    }

    const group = await prisma.financialGroup.create({ data: groupData });

    // Adicionar criador como membro owner
    await prisma.financialGroupMember.create({
      data: {
        userId: groupData.createdById,
        financialGroupId: group.id,
        isOwner: true,
      },
    });

    console.log(`Grupo criado: ${group.name}`);

    return group;
  });

  const createdGroups = await Promise.all(groupPromises);

  // Adicionar membros aos grupos colaborativos
  if (createdGroups.length >= MIN_COLLABORATIVE_GROUPS) {
    // Adicionar Maria ao grupo da casa
    const existingMemberMaria = await prisma.financialGroupMember.findFirst({
      where: {
        userId: users[1].id,
        financialGroupId: createdGroups[1].id,
      },
    });

    if (!existingMemberMaria) {
      await prisma.financialGroupMember.create({
        data: {
          userId: users[1].id,
          financialGroupId: createdGroups[1].id,
          isOwner: false,
        },
      });
      console.log("Maria adicionada ao grupo da casa");
    }

    if (createdGroups.length >= MIN_GROUPS_FOR_TRAVEL) {
      // Adicionar Gabriel ao grupo de viagem
      const existingMemberGabriel = await prisma.financialGroupMember.findFirst({
        where: {
          userId: users[0].id,
          financialGroupId: createdGroups[2].id,
        },
      });

      if (!existingMemberGabriel) {
        await prisma.financialGroupMember.create({
          data: {
            userId: users[0].id,
            financialGroupId: createdGroups[2].id,
            isOwner: false,
          },
        });
        console.log("Gabriel adicionado ao grupo de viagem");
      }

      // Adicionar João ao grupo de viagem
      const existingMemberJoao = await prisma.financialGroupMember.findFirst({
        where: {
          userId: users[2].id,
          financialGroupId: createdGroups[2].id,
        },
      });

      if (!existingMemberJoao) {
        await prisma.financialGroupMember.create({
          data: {
            userId: users[2].id,
            financialGroupId: createdGroups[2].id,
            isOwner: false,
          },
        });
        console.log("João adicionado ao grupo de viagem");
      }
    }
  }

  return createdGroups;
}

async function createCustomCategories (users: User[]) {
  console.log("Criando categorias personalizadas...");

  const customCategories = [
    {
      name: "Projetos Pessoais",
      isGlobal: false,
      userId: users[0].id,
    },
    {
      name: "Freelance Design",
      isGlobal: false,
      userId: users[1].id,
    },
    {
      name: "Consultoria IT",
      isGlobal: false,
      userId: users[2].id,
    },
  ];

  await Promise.all(
    customCategories.map(async (category) => {
      const existing = await prisma.financialCategory.findFirst({
        where: {
          name: category.name,
          userId: category.userId,
          isGlobal: false,
        },
      });

      if (!existing) {
        await prisma.financialCategory.create({ data: category });
        console.log(`Categoria personalizada criada: ${category.name}`);
      }
    }),
  );
}

async function createPaymentMethods (users: User[]) {
  console.log("Criando métodos de pagamento...");

  const paymentMethods = [
    // Gabriel
    {
      name: "PIX Banco do Brasil",
      type: PaymentMethodType.PIX,
      description: "Chave PIX CPF",
      userId: users[0].id,
    },
    {
      name: "Cartão Nubank",
      type: PaymentMethodType.CREDIT_CARD,
      description: "Cartão de crédito principal",
      userId: users[0].id,
    },
    {
      name: "Dinheiro",
      type: PaymentMethodType.CASH,
      description: "Pagamentos em espécie",
      userId: users[0].id,
    },
    // Maria
    {
      name: "PIX Itaú",
      type: PaymentMethodType.PIX,
      description: "Chave PIX email",
      userId: users[1].id,
    },
    {
      name: "Cartão Santander",
      type: PaymentMethodType.CREDIT_CARD,
      description: "Cartão de crédito",
      userId: users[1].id,
    },
    // João
    {
      name: "PIX Bradesco",
      type: PaymentMethodType.PIX,
      description: "Chave PIX telefone",
      userId: users[2].id,
    },
  ];

  await Promise.all(
    paymentMethods.map(async (method) => {
      const existing = await prisma.paymentMethod.findFirst({
        where: {
          name: method.name,
          userId: method.userId,
        },
      });

      if (!existing) {
        await prisma.paymentMethod.create({ data: method });
        console.log(`Método de pagamento criado: ${method.name}`);
      }
    }),
  );
}

async function createBankAccounts (users: User[]) {
  console.log("Criando contas bancárias...");

  const bankAccounts = [
    // Gabriel
    {
      name: "Conta Corrente BB",
      bank: "Banco do Brasil",
      balance: 5500.00,
      userId: users[0].id,
    },
    {
      name: "Conta Poupança BB",
      bank: "Banco do Brasil",
      balance: 12000.00,
      userId: users[0].id,
    },
    // Maria
    {
      name: "Conta Corrente Itaú",
      bank: "Itaú Unibanco",
      balance: 3200.50,
      userId: users[1].id,
    },
    // João
    {
      name: "Conta Corrente Bradesco",
      bank: "Bradesco",
      balance: 1800.75,
      userId: users[2].id,
    },
  ];

  const bankAccountPromises = bankAccounts.map(async (account) => {
    const existing = await prisma.bankAccount.findFirst({
      where: {
        name: account.name,
        userId: account.userId,
      },
    });

    if (existing) {
      console.log(`Conta bancária já existe: ${existing.name}`);

      return existing;
    }

    const created = await prisma.bankAccount.create({ data: account });

    console.log(`Conta bancária criada: ${account.name}`);

    return created;
  });

  const createdAccounts = await Promise.all(bankAccountPromises);

  return createdAccounts;
}

async function createCreditCards (users: User[], bankAccounts: BankAccount[]) {
  console.log("Criando cartões de crédito...");

  const creditCards = [
    // Gabriel
    {
      name: "Nubank Roxinho",
      last4Digits: "1234",
      brand: "Mastercard",
      type: CardType.CREDIT,
      creditLimit: 8000.00,
      closingDay: 15,
      dueDay: 10,
      userId: users[0].id,
      bankAccountId: bankAccounts[0].id,
    },
    {
      name: "Cartão Débito BB",
      last4Digits: "5678",
      brand: "Visa",
      type: CardType.DEBIT,
      userId: users[0].id,
      bankAccountId: bankAccounts[0].id,
    },
    // Maria
    {
      name: "Cartão Itaú Click",
      last4Digits: "9876",
      brand: "Visa",
      type: CardType.BOTH,
      creditLimit: 5000.00,
      closingDay: 20,
      dueDay: 15,
      userId: users[1].id,
      bankAccountId: bankAccounts[2].id,
    },
    // João
    {
      name: "Cartão Bradesco Prime",
      last4Digits: "4321",
      brand: "Mastercard",
      type: CardType.CREDIT,
      creditLimit: 3000.00,
      closingDay: 5,
      dueDay: 25,
      userId: users[2].id,
      bankAccountId: bankAccounts[3].id,
    },
  ];

  await Promise.all(
    creditCards.map(async (card) => {
      const existing = await prisma.creditCard.findFirst({
        where: {
          name: card.name,
          userId: card.userId,
        },
      });

      if (!existing) {
        await prisma.creditCard.create({ data: card });
        console.log(`Cartão criado: ${card.name}`);
      }
    }),
  );
}

async function createRecurringTransactions (users: User[], groups: FinancialGroup[]) {
  console.log("Criando transações recorrentes...");

  const salarioCategory = await prisma.financialCategory.findFirst({ where: { name: "Salário", isGlobal: true } });

  const moradiaCategory = await prisma.financialCategory.findFirst({ where: { name: "Moradia", isGlobal: true } });

  const alimentacaoCategory = await prisma.financialCategory.findFirst({ where: { name: "Alimentação", isGlobal: true } });

  const recurringTransactions = [
    // Salário Gabriel
    {
      name: "Salário Empresa XYZ",
      description: "Salário mensal",
      amount: 4500.00,
      type: TransactionType.INCOME,
      frequency: RecurringFrequency.MONTHLY,
      startDate: new Date("2024-01-01"),
      nextExecutionDate: new Date("2024-01-01"),
      userId: users[0].id,
      categoryId: salarioCategory?.id,
      groupId: groups[0].id,
    },
    // Aluguel casa compartilhada
    {
      name: "Aluguel Casa",
      description: "Aluguel mensal da casa",
      amount: 1200.00,
      type: TransactionType.EXPENSE,
      frequency: RecurringFrequency.MONTHLY,
      startDate: new Date("2024-01-05"),
      nextExecutionDate: new Date("2024-01-05"),
      userId: users[0].id,
      categoryId: moradiaCategory?.id,
      groupId: groups[1].id,
    },
    // Supermercado semanal
    {
      name: "Compras Supermercado",
      description: "Compras semanais",
      amount: 250.00,
      type: TransactionType.EXPENSE,
      frequency: RecurringFrequency.WEEKLY,
      startDate: new Date("2024-01-07"),
      nextExecutionDate: new Date("2024-01-07"),
      userId: users[0].id,
      categoryId: alimentacaoCategory?.id,
      groupId: groups[1].id,
    },
    // Salário Maria
    {
      name: "Freelance Design",
      description: "Trabalhos de design",
      amount: 2800.00,
      type: TransactionType.INCOME,
      frequency: RecurringFrequency.MONTHLY,
      startDate: new Date("2024-01-01"),
      nextExecutionDate: new Date("2024-01-01"),
      userId: users[1].id,
      categoryId: salarioCategory?.id,
      groupId: groups[2].id,
    },
  ];

  await Promise.all(
    recurringTransactions.map(async (transaction) => {
      const existing = await prisma.recurringTransaction.findFirst({
        where: {
          name: transaction.name,
          userId: transaction.userId,
        },
      });

      if (!existing) {
        await prisma.recurringTransaction.create({ data: transaction });
        console.log(`Transação recorrente criada: ${transaction.name}`);
      }
    }),
  );
}

async function createSampleTransactions (users: User[], groups: FinancialGroup[]) {
  console.log("Criando transações de exemplo...");

  const alimentacaoCategory = await prisma.financialCategory.findFirst({ where: { name: "Alimentação", isGlobal: true } });

  const transporteCategory = await prisma.financialCategory.findFirst({ where: { name: "Transporte", isGlobal: true } });

  const entretenimentoCategory = await prisma.financialCategory.findFirst({ where: { name: "Entretenimento", isGlobal: true } });

  const transactions = [
    // Transações Gabriel - Grupo Pessoal
    {
      amount: 35.50,
      type: TransactionType.EXPENSE,
      description: "Almoço restaurante",
      transactionDate: new Date("2024-01-15"),
      createdById: users[0].id,
      groupId: groups[0].id,
      categoryId: alimentacaoCategory?.id,
    },
    {
      amount: 120.00,
      type: TransactionType.EXPENSE,
      description: "Combustível posto",
      transactionDate: new Date("2024-01-14"),
      createdById: users[0].id,
      groupId: groups[0].id,
      categoryId: transporteCategory?.id,
    },
    // Transações grupo casa
    {
      amount: 180.50,
      type: TransactionType.EXPENSE,
      description: "Compras supermercado",
      transactionDate: new Date("2024-01-13"),
      createdById: users[0].id,
      groupId: groups[1].id,
      categoryId: alimentacaoCategory?.id,
    },
    {
      amount: 45.00,
      type: TransactionType.EXPENSE,
      description: "Netflix mensal",
      transactionDate: new Date("2024-01-12"),
      createdById: users[1].id,
      groupId: groups[1].id,
      categoryId: entretenimentoCategory?.id,
    },
    // Transações grupo viagem
    {
      amount: 320.00,
      type: TransactionType.EXPENSE,
      description: "Hotel primeira noite",
      transactionDate: new Date("2024-01-10"),
      createdById: users[1].id,
      groupId: groups[2].id,
      categoryId: entretenimentoCategory?.id,
    },
    {
      amount: 85.50,
      type: TransactionType.EXPENSE,
      description: "Jantar grupo",
      transactionDate: new Date("2024-01-10"),
      createdById: users[2].id,
      groupId: groups[2].id,
      categoryId: alimentacaoCategory?.id,
    },
  ];

  await Promise.all(
    transactions.map(async (transaction) => {
      const existing = await prisma.transaction.findFirst({
        where: {
          description: transaction.description,
          amount: transaction.amount,
          createdById: transaction.createdById,
        },
      });

      if (!existing) {
        await prisma.transaction.create({ data: transaction });
        console.log(`Transação criada: ${transaction.description} - ${transaction.amount}`);
      }
    }),
  );
}

async function main () {
  console.log("Iniciando seed do banco de dados...");

  const existing = await prisma.financialCategory.findMany();
  const existingNames = new Set(existing.map((c) => c.name));

  const toCreate = categories.filter((category) => !existingNames.has(category.name));

  await Promise.all(
    toCreate.map(async (category) => {
      await prisma.financialCategory.create({ data: category });
      console.log(`Categoria criada: ${category.name}`);
    }),
  );

  if (toCreate.length === 0) {
    console.log("Todas as categorias já existem.");
  }

  // Criar usuários de teste
  const users = await createTestUsers();

  // Criar grupos financeiros
  const groups = await createFinancialGroups(users);

  // Criar categorias personalizadas
  await createCustomCategories(users);

  // Criar métodos de pagamento
  await createPaymentMethods(users);

  // Criar contas bancárias
  const bankAccounts = await createBankAccounts(users);

  // Criar cartões de crédito
  await createCreditCards(users, bankAccounts);

  // Criar transações recorrentes
  await createRecurringTransactions(users, groups);

  // Criar transações de exemplo
  await createSampleTransactions(users, groups);

  console.log("Seed concluído com sucesso!");
}

async function runSeed () {
  try {
    await main();
    await prisma.$disconnect();
  } catch (e) {
    console.error("Erro durante o seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  }
}

runSeed();
