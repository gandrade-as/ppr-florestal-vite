// src/mocks/handlers.ts
import { http, HttpResponse, delay } from "msw";
import type { Goal, Launch, PendingLaunch } from "@/types/goal";

// ===========================================================================
// 1. BANCO DE DADOS EM MEMÓRIA (Persiste durante a sessão do navegador)
// ===========================================================================

// Mock Inicial de Metas
const goalsDB: Goal[] = [
  {
    id: "501",
    title: "Faturamento Q3",
    description: "Meta financeira crítica para o trimestre.",
    status: "in_progress",
    priority: "high",
    progress: 45,
    deadline: "2024-12-31T00:00:00Z",
    frequency: "mensal",
    inputType: "numeric",
    levels: [
      { targetValue: 400000, percentage: 20 },
      { targetValue: 800000, percentage: 60 },
      { targetValue: 1000000, percentage: 100 },
    ],
    creatorId: "uid-gestor", // ID simulado do gestor
    creatorName: "Gabriel Gestor",
    responsibleId: "uid-gestor",
    responsibleName: "Gabriel Gestor",
    launcherId: "uid-gestor",
  },
  {
    id: "601",
    title: "Obter Licença Ambiental",
    description: "A licença deve ser emitida e protocolada junto ao órgão.",
    status: "pending",
    priority: "high",
    progress: 0,
    deadline: "2024-10-15T00:00:00Z",
    frequency: "semestral",
    inputType: "options",
    levels: [
      { targetValue: "Não", percentage: 0 },
      { targetValue: "Sim", percentage: 100 },
    ],
    creatorId: "uid-gestor",
    creatorName: "Gabriel Gestor",
    responsibleId: "uid-gestor",
    responsibleName: "Gabriel Gestor",
    launcherId: "uid-gestor",
  },
];

// Mock Inicial de Lançamentos (Vinculados aos IDs das metas acima)
const launchesDB: Record<string, Launch[]> = {
  "501": [
    {
      id: "launch-001",
      date: "2024-08-20T10:00:00Z",
      value: 200000,
      note: "Lançamento inicial consolidado.",
      evidenceUrl: "https://drive.google.com/file/d/exemplo",
      status: "approved",
      authorName: "Sistema",
      createdAt: "2024-08-20T10:00:00Z",
    },
    {
      id: "launch-002",
      date: "2024-08-25T14:00:00Z",
      value: 55000,
      note: "Faturamento parcial da semana (Aguardando análise).",
      evidenceUrl: "https://comprovante.com/pdf",
      status: "pending", // ITEM PENDENTE PARA TESTAR AUDITORIA
      authorName: "Gabriel Gestor",
      createdAt: "2024-08-25T14:00:00Z",
    },
  ],
  "601": [],
};

// Helper: Simula um "JOIN" para pegar dados da meta ao listar lançamentos pendentes
const getGoalById = (id: string): Goal | undefined => {
  return goalsDB.find((g) => g.id === id);
};

// ===========================================================================
// 2. HANDLERS (Rotas da API Mockada)
// ===========================================================================

export const handlers = [
  // --- DASHBOARD & USER ---
  http.get("*/dashboard/metrics", async () => {
    await delay(800);
    return HttpResponse.json({
      revenue: 45231.89,
      subscriptions: 2350,
      sales: 12234,
      activeNow: 573,
    });
  }),

  // http.get("*/users/:uid", async ({ params }) => {
  //   await delay(500);
  //   const { uid } = params;
  //   return HttpResponse.json({
  //     id: uid,
  //     name: "Gabriel Pinto Andrade",
  //     email: "gabriel.andrade@exemplo.com",
  //     roles: ["superuser", "gestor"], // Permissões para acessar todas as telas
  //     sector: { id: "1", acronym: "TI", name: "Tecnologia da Informação" },
  //   });
  // }),

  // --- METAS (CRUD) ---

  // 1. Listar Metas (Geral / Minhas Metas)
  http.get("*/goals/:uid", async () => {
    await delay(400);
    // Na vida real filtraria por responsável, aqui retorna tudo para facilitar teste
    return HttpResponse.json(goalsDB);
  }),

  // 2. Listar Metas Criadas por Mim (Gestão)
  http.get("*/goals/created/:uid", async ({ params }) => {
    await delay(400);
    const uid = String(params.uid);
    // Retorna metas onde o creatorId bate com o usuário logado (ou o mock default)
    const myCreatedGoals = goalsDB.filter(
      (g) => g.creatorId === uid || g.creatorId === "uid-gestor"
    );
    return HttpResponse.json(myCreatedGoals);
  }),

  // 3. Listar Metas do Setor
  http.get("*/sector/:sectorId/goals", async () => {
    await delay(600);
    return HttpResponse.json(goalsDB); // Retorna todas como exemplo
  }),

  // 4. Listar Metas onde sou Lançador
  http.get("*/goals/launcher/:uid", async () => {
    await delay(400);
    return HttpResponse.json(goalsDB); // Retorna todas como exemplo
  }),

  // 5. CRIAR NOVA META (POST)
  http.post("*/goals", async ({ request }) => {
    await delay(1000); // Delay maior para simular processamento
    const body = (await request.json()) as Partial<Goal>;

    const newGoal: Goal = {
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: "pending",
      // Valores padrão para garantir integridade
      title: body.title || "Nova Meta Sem Título",
      description: body.description || "",
      deadline: body.deadline || new Date().toISOString(),
      frequency: body.frequency || "mensal",
      priority: body.priority || "medium",
      inputType: body.inputType || "numeric",
      levels: body.levels || [],
      // Mock de papéis
      creatorId: body.creatorId || "uid-gestor",
      creatorName: "Eu (Gestor)",
      responsibleId: body.responsibleId || "uid-gestor",
      responsibleName: "Colaborador Padrão",
      launcherId: body.launcherId || "uid-gestor",
      launcherName: "Colaborador Padrão",
      ...body,
    };

    goalsDB.push(newGoal); // Adiciona ao banco em memória

    // Inicializa o array de lançamentos para essa nova meta
    launchesDB[newGoal.id] = [];

    return HttpResponse.json(newGoal, { status: 201 });
  }),

  // --- LANÇAMENTOS (CRUD) ---

  // 1. Listar Lançamentos de uma Meta
  http.get("*/goals/:goalId/launches", async ({ params }) => {
    await delay(300);
    const gid = String(params.goalId);
    return HttpResponse.json(launchesDB[gid] || []);
  }),

  // 2. Criar Lançamento (POST)
  http.post("*/goals/:goalId/launches", async ({ params, request }) => {
    await delay(600);
    const gid = String(params.goalId);
    const body = (await request.json()) as Partial<Launch>;

    const newLaunch: Launch = {
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      authorName: "Gabriel Gestor", // Simula usuário logado
      status: "pending",
      date: new Date().toISOString(),
      value: 0,
      evidenceUrl: "",
      ...body,
    };

    if (!launchesDB[gid]) launchesDB[gid] = [];
    launchesDB[gid].push(newLaunch);

    return HttpResponse.json(newLaunch, { status: 201 });
  }),

  // 3. Atualizar Lançamento (PUT)
  http.put(
    "*/goals/:goalId/launches/:launchId",
    async ({ params, request }) => {
      await delay(600);
      const gid = String(params.goalId);
      const { launchId } = params;
      const body = (await request.json()) as Partial<Launch>;

      const list = launchesDB[gid] || [];
      const index = list.findIndex((l) => l.id === launchId);

      if (index > -1) {
        list[index] = { ...list[index], ...body, status: "pending" }; // Volta para pendente ao editar
        return HttpResponse.json(list[index]);
      }

      return new HttpResponse(null, { status: 404 });
    }
  ),

  // --- AUDITORIA ---

  // 1. Listar TODOS os pendentes (Auditoria Global)
  http.get("*/launches/pending", async () => {
    await delay(500);
    const pendingList: PendingLaunch[] = [];

    // Itera sobre todas as metas no banco de lançamentos
    Object.keys(launchesDB).forEach((goalId) => {
      const goalInfo = getGoalById(goalId);
      const launches = launchesDB[goalId];

      if (goalInfo && launches) {
        const pendings = launches
          .filter((l) => l.status === "pending")
          .map((l) => ({
            ...l,
            goalId,
            goalTitle: goalInfo.title,
            goalInputType: goalInfo.inputType,
            responsibleName: goalInfo.responsibleName || "Desconhecido",
          }));
        pendingList.push(...pendings);
      }
    });

    return HttpResponse.json(pendingList);
  }),

  // 2. Avaliar Lançamento (PATCH)
  http.patch("*/launches/evaluate", async ({ request }) => {
    await delay(600);
    const body = (await request.json()) as any;
    const { goalId, launchId, status, rejectionReason } = body;
    const gid = String(goalId);

    const list = launchesDB[gid];
    if (list) {
      const index = list.findIndex((l) => l.id === launchId);
      if (index > -1) {
        list[index].status = status;
        if (status === "rejected") {
          list[index].rejectionReason = rejectionReason;
        }
        return HttpResponse.json({ success: true });
      }
    }
    return new HttpResponse(null, { status: 404 });
  }),
];
