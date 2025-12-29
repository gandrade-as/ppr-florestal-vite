// src/mocks/handlers.ts
import { http, HttpResponse, delay } from "msw";

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

  // Exemplo de erro (descomente para testar como sua UI reage a erros)
  // http.get('*/dashboard/metrics', () => {
  //   return new HttpResponse(null, { status: 500 })
  // }),
];
