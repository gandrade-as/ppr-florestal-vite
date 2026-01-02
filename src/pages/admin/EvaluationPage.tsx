import { usePendingGoals } from "@/hooks/useGoals";

export default function EvaluationPage() {
  const { data: goals, isLoading, isError } = usePendingGoals();


  // 2. Feedback Visual de Carregamento
  if (isLoading) {
    return <div className="animate-pulse">Carregando metas pendentes...</div>;
  }

  // 3. Tratamento de Erro
  if (isError) {
    return (
      <div className="text-red-500">
        Erro ao carregar as metas. Tente novamente.
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Painel de Avaliação
        </h1>
        <p className="text-gray-600">
          Gerencie as avaliações e metas pendentes.
        </p>
      </header>

      <section aria-labelledby="goals-list">
        <h2 id="goals-list" className="text-xl font-semibold mb-4">
          Metas Pendentes
        </h2>

        {goals && goals.length > 0 ? (
          <ul className="space-y-3">
            {goals.map((goal) => (
              <li
                key={goal.id}
                className="p-4 border rounded shadow-sm hover:shadow-md transition-shadow bg-white"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{goal.title}</span>
                  <span className="text-sm text-gray-500">
                    Vencimento: {goal.deadline.toDate().toLocaleDateString("pt-BR")}
                  </span>
                </div>
                {/* Aqui você pode adicionar botões de ação para o avaliador */}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">
            Nenhuma meta pendente para avaliação.
          </p>
        )}
      </section>
    </div>
  );
}
