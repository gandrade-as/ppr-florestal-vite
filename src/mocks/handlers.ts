import type { Launch } from "@/types/goal";
import { http, HttpResponse, delay } from "msw";

// Banco de dados em memória (para persistir lançamentos enquanto a tela não recarrega)
const launchesDB: Record<string, any[]> = {
  "501": [],
  "601": [], // Meta nova de exemplo
};

// Defina a URL base ou use caminhos relativos se configurou o axios baseURL
// Dica: Usar "*/endpoint" casa com qualquer baseURL
export const handlers = [
  // Intercepta GET /dashboard/metrics
  http.get("*/dashboard/metrics", async () => {
    // 1. Simula um delay de rede de 1.5 segundos
    // (Ótimo para ver o Skeleton Loading funcionando!)
    await delay(1500);

    // 2. Retorna o JSON de sucesso (Status 200)
    return HttpResponse.json({
      revenue: 45231.89,
      subscriptions: 2350,
      sales: 12234,
      activeNow: 573,
      // Você pode adicionar arrays de gráficos aqui também
      recentSales: [
        { name: "Ana Silva", email: "ana@teste.com", amount: 1999.0 },
        { name: "Carlos Souza", email: "carlos@teste.com", amount: 39.0 },
      ],
    });
  }),

  http.get("*/users/:uid", async ({ params }) => {
    await delay(800); // Simula delay de rede

    const { uid } = params;

    // Retorna dados simulados do banco SQL/NoSQL
    return HttpResponse.json({
      id: uid,
      name: "Gabriel Pinto Andrade",
      email: "gabriel.andrade@aguiasistemas.com",
      role: "superuser",
      setor: {
        id: 1,
        acronym: "TI",
        name: "Tecnologia da Informação",
      },
    });
  }),

  // GET /goals/:uid (Atualizado com Levels)
  http.get("*/goals/:uid", async ({ params }) => {
    // ... lógica de delay
    return HttpResponse.json([
      // CENÁRIO 1: NUMÉRICO (Faturamento)
      {
        id: "501",
        title: "Faturamento Q3",
        description: "Meta financeira.",
        status: "in_progress",
        priority: "high",
        progress: 0,
        deadline: "2024-12-31T00:00:00Z",
        frequency: "mensal",
        inputType: "numeric", // <--- TIPO NUMÉRICO

        levels: [
          { targetValue: 400000, percentage: 20 },
          { targetValue: 800000, percentage: 60 },
          { targetValue: 1000000, percentage: 100 },
        ],
        // ... IDs
        creatorId: "uid-gestor",
        responsibleId: params.uid,
        launcherId: params.uid,
      },

      // CENÁRIO 2: OPÇÕES (Sim/Não)
      {
        id: "601",
        title: "Obter Licença Ambiental",
        description: "A licença deve ser emitida e protocolada.",
        status: "pending",
        priority: "high",
        progress: 0,
        deadline: "2024-10-15T00:00:00Z",
        frequency: "semestral",
        inputType: "options", // <--- TIPO OPÇÕES

        levels: [
          { targetValue: "Não", percentage: 0 },
          { targetValue: "Sim", percentage: 100 },
        ],
        // ... IDs
        creatorId: "uid-gestor",
        responsibleId: params.uid,
        launcherId: params.uid,
      },
    ]);
  }),

  // GET /sector/:sectorId/goals
  http.get("*/sector/:sectorId/goals", async ({ params }) => {
    await delay(700);
    const { sectorId } = params;

    console.log(`[MSW] Buscando metas do setor: ${sectorId}`);

    return HttpResponse.json([
      // CENÁRIO 1: NUMÉRICO (Faturamento)
      {
        id: "501",
        title: "Faturamento Q3",
        description: "Meta financeira.",
        status: "in_progress",
        priority: "high",
        progress: 0,
        deadline: "2024-12-31T00:00:00Z",
        frequency: "mensal",
        inputType: "numeric", // <--- TIPO NUMÉRICO

        levels: [
          { targetValue: 400000, percentage: 20 },
          { targetValue: 800000, percentage: 60 },
          { targetValue: 1000000, percentage: 100 },
        ],
        // ... IDs
        creatorId: "uid-gestor",
        responsibleId: params.uid,
        launcherId: params.uid,
      },

      // CENÁRIO 2: OPÇÕES (Sim/Não)
      {
        id: "601",
        title: "Obter Licença Ambiental",
        description: "A licença deve ser emitida e protocolada.",
        status: "pending",
        priority: "high",
        progress: 0,
        deadline: "2024-10-15T00:00:00Z",
        frequency: "semestral",
        inputType: "options", // <--- TIPO OPÇÕES

        levels: [
          { targetValue: "Não", percentage: 0 },
          { targetValue: "Sim", percentage: 100 },
        ],
        // ... IDs
        creatorId: "uid-gestor",
        responsibleId: params.uid,
        launcherId: params.uid,
      },
    ]);
  }),

  // GET /goals/launcher/:uid
  // Retorna metas onde o usuário é o LANÇADOR
  http.get("*/goals/launcher/:uid", async ({ params }) => {
    await delay(600);
    const { uid } = params;
    const targetUid = Array.isArray(uid) ? uid[0] : uid;

    console.log(
      `[MSW] Buscando metas para lançamento. LauncherId == ${targetUid}`
    );

    return HttpResponse.json([
      // CENÁRIO 1: NUMÉRICO (Faturamento)
      {
        id: "501",
        title: "Faturamento Q3",
        description: "Meta financeira.",
        status: "in_progress",
        priority: "high",
        progress: 0,
        deadline: "2024-12-31T00:00:00Z",
        frequency: "mensal",
        inputType: "numeric", // <--- TIPO NUMÉRICO

        levels: [
          { targetValue: 400000, percentage: 20 },
          { targetValue: 800000, percentage: 60 },
          { targetValue: 1000000, percentage: 100 },
        ],
        // ... IDs
        creatorId: "uid-gestor",
        responsibleId: params.uid,
        launcherId: params.uid,
      },

      // CENÁRIO 2: OPÇÕES (Sim/Não)
      {
        id: "601",
        title: "Obter Licença Ambiental",
        description: "A licença deve ser emitida e protocolada.",
        status: "pending",
        priority: "high",
        progress: 0,
        deadline: "2024-10-15T00:00:00Z",
        frequency: "semestral",
        inputType: "options", // <--- TIPO OPÇÕES

        levels: [
          { targetValue: "Não", percentage: 0 },
          { targetValue: "Sim", percentage: 100 },
        ],
        // ... IDs
        creatorId: "uid-gestor",
        responsibleId: params.uid,
        launcherId: params.uid,
      },
    ]);
  }),

  // 1. GET /goals/:goalId/launches
  http.get("*/goals/:goalId/launches", async ({ params }) => {
    await delay(500);
    const { goalId } = params;
    const gid = String(goalId); // garante string

    return HttpResponse.json(launchesDB[gid] || []);
  }),

  // POST (Criar Novo)
  http.post("*/goals/:goalId/launches", async ({ params, request }) => {
    await delay(800);
    const { goalId } = params;
    const gid = String(goalId);
    const body = (await request.json()) as any;

    const newLaunch: Launch = {
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      authorName: "Eu Mesmo (Mock)",
      status: "pending", // Sempre nasce Pendente
      rejectionReason: undefined,
      ...body, // value, note, date, evidenceUrl
    };

    if (!launchesDB[gid]) launchesDB[gid] = [];
    launchesDB[gid].push(newLaunch);

    return HttpResponse.json(newLaunch, { status: 201 });
  }),

  // PUT (Corrigir Lançamento Rejeitado)
  http.put(
    "*/goals/:goalId/launches/:launchId",
    async ({ params, request }) => {
      await delay(800);
      const { goalId, launchId } = params;
      const gid = String(goalId);
      const body = (await request.json()) as any;

      const launches = launchesDB[gid] || [];
      const index = launches.findIndex((l) => l.id === launchId);

      if (index > -1) {
        // Atualiza os dados e volta para PENDENTE para nova auditoria
        launches[index] = {
          ...launches[index],
          ...body,
          status: "pending",
          rejectionReason: undefined, // Limpa o motivo da rejeição anterior
        };
        return HttpResponse.json(launches[index]);
      }

      return new HttpResponse(null, { status: 404 });
    }
  ),
];
