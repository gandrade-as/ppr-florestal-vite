import { useState } from "react";
import { Users, Plus, Search, Shield, Briefcase, Mail } from "lucide-react";
import { useUsers } from "@/hooks/useUserProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateUserSheet } from "@/components/CreateUserSheet";

export default function UsersManagementPage() {
  const { data: users, isLoading, isError } = useUsers();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false); // Estado para o Sheet de criação (próximo passo)

  // Filtragem local
  const filteredUsers =
    users?.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.sector.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  // Mapeamento de Cores para Cargos
  const roleBadgeColor = (role: string) => {
    switch (role) {
      case "superuser":
        return "destructive"; // Vermelho
      case "admin":
        return "default"; // Preto/Escuro
      case "gestor":
        return "secondary"; // Cinza/Azul claro
      case "avaliador":
        return "outline"; // Borda
      default:
        return "outline";
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Gerenciamento de Usuários
          </h2>
          <p className="text-muted-foreground">
            Administre os acessos, cargos e setores dos colaboradores.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="gap-2 shadow-sm"
        >
          <Plus className="h-4 w-4" /> Novo Usuário
        </Button>
      </div>

      {/* BARRA DE FERRAMENTAS */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm max-w-md">
        <Search className="h-4 w-4 text-muted-foreground ml-2" />
        <Input
          placeholder="Buscar por nome, email ou setor..."
          className="border-none shadow-none focus-visible:ring-0"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* LISTAGEM */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-100">
          Erro ao carregar usuários.
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-xl bg-slate-50/50">
          <Users className="h-10 w-10 opacity-20 mb-3" />
          <p>Nenhum usuário encontrado.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredUsers.map((user) => (
            <Card
              key={user.id}
              className="hover:border-primary/50 transition-colors cursor-pointer group"
            >
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm group-hover:scale-105 transition-transform">
                  <AvatarImage src={user.avatarUrl} />
                  <AvatarFallback className="bg-slate-100 text-slate-500 font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle
                    className="text-base font-semibold truncate"
                    title={user.name}
                  >
                    {user.name}
                  </CardTitle>
                  <div
                    className="flex items-center text-xs text-muted-foreground truncate gap-1"
                    title={user.email}
                  >
                    <Mail className="h-3 w-3" /> {user.email}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2.5 mt-2">
                  {/* Setor */}
                  <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                    <div className="p-1.5 bg-slate-100 rounded text-slate-500">
                      <Briefcase className="h-3.5 w-3.5" />
                    </div>
                    <span className="truncate">
                      {user.sector.name} ({user.sector.acronym})
                    </span>
                  </div>

                  {/* Cargos */}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {user.roles.map((role) => (
                      <Badge
                        key={role}
                        variant={roleBadgeColor(role)}
                        className="uppercase text-[10px]"
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateUserSheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}
