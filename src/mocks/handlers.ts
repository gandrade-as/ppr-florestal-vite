import type { Launch, PendingLaunch } from "@/types/goal";
import { http, HttpResponse, delay } from "msw";

// --- BANCO DE DADOS EM MEMÓRIA ---
// DICA: Adicionei alguns dados iniciais para você ver a lista funcionando logo de cara
const launchesDB: Record<string, any[]> = {
  "501": [
    {
      id: "mock-init-1",
      date: "2024-08-20T10:00:00Z",
      value: 200000,
      note: "Lançamento inicial mockado",
      evidenceUrl: "https://google.com",
      status: "approved",
      authorName: "Sistema",
      createdAt: "2024-08-20T10:00:00Z",
    },
  ],
  "601": [],
};

// Helper para simular JOIN de tabelas (Lançamento + Meta)
const getGoalById = (id: string) => {
  const goals: Record<string, any> = {
    "501": {
      title: "Faturamento Q3",
      inputType: "numeric",
      responsibleName: "João Vendedor",
    },
    "601": {
      title: "Obter Licença Ambiental",
      inputType: "options",
      responsibleName: "Maria Engenheira",
    },
  };
  return (
    goals[id] || {
      title: "Meta Desconhecida",
      inputType: "numeric",
      responsibleName: "Desconhecido",
    }
  );
};

export const handlers = [
  // --- DASHBOARD & USER ---
  http.get("*/dashboard/metrics", async () => {
    await delay(1000);
    return HttpResponse.json({
      revenue: 45231.89,
      subscriptions: 2350,
      sales: 12234,
      activeNow: 573,
      recentSales: [
        { name: "Ana Silva", email: "ana@teste.com", amount: 1999.0 },
        { name: "Carlos Souza", email: "carlos@teste.com", amount: 39.0 },
      ],
    });
  }),

  http.get("*/users/:uid", async ({ params }) => {
    await delay(600);
    const { uid } = params;
    return HttpResponse.json({
      id: uid,
      name: "Gabriel Pinto Andrade",
      email: "gabriel.andrade@aguiasistemas.com",
      roles: ["superuser", "gestor"], // Corrigi typo 'avalaidor' -> 'gestor' ou mantenha se for custom
      setor: { id: 1, acronym: "TI", name: "Tecnologia da Informação" },
    });
  }),

  // --- LISTAS DE METAS (HARDCODED) ---
  // DICA: Unifiquei a resposta para garantir que o ID 501 exista nos dois lugares
  http.get("*/goals/:uid", async ({ params }) => {
    return HttpResponse.json(getHardcodedGoals(params.uid as string));
  }),

  http.get("*/sector/:sectorId/goals", async ({ params }) => {
    await delay(700);
    return HttpResponse.json(getHardcodedGoals(params.sectorId as string));
  }),

  http.get("*/goals/launcher/:uid", async ({ params }) => {
    await delay(600);
    return HttpResponse.json(getHardcodedGoals(params.uid as string));
  }),

  // --- CRUD DE LANÇAMENTOS (AQUI ESTÁ A LÓGICA CRÍTICA) ---

  // 1. GET: Lista lançamentos de uma meta
  http.get("*/goals/:goalId/launches", async ({ params }) => {
    await delay(300);
    const gid = String(params.goalId);

    const list = launchesDB[gid] || [];
    console.log(`[MSW] GET Launches para Meta ${gid}:`, list.length, "itens");

    return HttpResponse.json(list);
  }),

  // 2. POST: Cria novo lançamento
  http.post("*/goals/:goalId/launches", async ({ params, request }) => {
    await delay(800);
    const gid = String(params.goalId);
    const body = (await request.json()) as any;

    console.log(`[MSW] POST Launch recebido para Meta ${gid}:`, body);

    const newLaunch: Launch = {
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      authorName: "Eu Mesmo (Mock)",
      status: "pending",
      rejectionReason: undefined,
      ...body,
    };

    // Garante que o array existe antes de dar push
    if (!launchesDB[gid]) {
      launchesDB[gid] = [];
    }

    launchesDB[gid].push(newLaunch);

    console.log(
      `[MSW] Novo total de lançamentos para ${gid}:`,
      launchesDB[gid].length
    );

    return HttpResponse.json(newLaunch, { status: 201 });
  }),

  // 3. PUT: Corrige lançamento
  http.put(
    "*/goals/:goalId/launches/:launchId",
    async ({ params, request }) => {
      await delay(800);
      const gid = String(params.goalId);
      const { launchId } = params;
      const body = (await request.json()) as any;

      const launches = launchesDB[gid] || [];
      const index = launches.findIndex((l) => l.id === launchId);

      if (index > -1) {
        launches[index] = {
          ...launches[index],
          ...body,
          status: "pending",
          rejectionReason: undefined,
        };
        return HttpResponse.json(launches[index]);
      }
      return new HttpResponse(null, { status: 404 });
    }
  ),

  // --- AUDITORIA ---

  // 1. GET: Lista tudo que está pendente
  http.get("*/launches/pending", async () => {
    await delay(600);
    const pendingList: PendingLaunch[] = [];

    Object.keys(launchesDB).forEach((goalId) => {
      const goalInfo = getGoalById(goalId);
      const launches = launchesDB[goalId];

      const pendings = launches
        .filter((l) => l.status === "pending")
        .map((l) => ({
          ...l,
          goalId,
          goalTitle: goalInfo.title,
          goalInputType: goalInfo.inputType,
          responsibleName: goalInfo.responsibleName,
        }));

      pendingList.push(...pendings);
    });

    console.log(
      "[MSW] Pendentes encontrados na Auditoria:",
      pendingList.length
    );
    return HttpResponse.json(pendingList);
  }),

  // 2. PATCH: Aprova/Rejeita
  http.patch("*/launches/evaluate", async ({ request }) => {
    await delay(800);
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

// --- HELPER PARA EVITAR CÓDIGO DUPLICADO ---
function getHardcodedGoals(uid: string) {
  return [
    {
      id: "501",
      title: "Faturamento Q3",
      description: "Meta financeira.",
      status: "in_progress",
      priority: "high",
      progress: 0,
      deadline: "2024-12-31T00:00:00Z",
      frequency: "mensal",
      inputType: "numeric",
      levels: [
        { targetValue: 400000, percentage: 20 },
        { targetValue: 800000, percentage: 60 },
        { targetValue: 1000000, percentage: 100 },
      ],
      creatorId: "uid-gestor",
      responsibleId: uid,
      launcherId: uid,
    },
    {
      id: "601",
      title: "Obter Licença Ambiental",
      description: "A licença deve ser emitida e protocolada.",
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
      responsibleId: uid,
      launcherId: uid,
    },
  ];
}
