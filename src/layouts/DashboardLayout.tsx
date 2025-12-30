import { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  LogOut,
  Menu,
  Package2,
  ChevronLeft,
  ChevronRight,
  Target,
  Users,
  PenTool,
  Scale,
  Briefcase,
} from "lucide-react";
import { auth } from "@/lib/firebase/client"; // Ajuste o caminho se necessário (ex: @/lib/firebase/client)

// Componentes UI
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/context/AuthContext"; // Ajuste o caminho se necessário
import { cn } from "@/lib/utils";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleGuard } from "@/components/RoleGuard";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation(); // Para saber em qual rota estamos
  const { user } = useAuth();

  // Estado da Sidebar com persistência no LocalStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved === "true";
  });

  const { data: profile, isLoading: isLoadingProfile } = useUserProfile();
  const isManager = profile?.roles.some((r) =>
    ["gestor", "superuser"].includes(r)
  );

  // Salva a preferência sempre que mudar
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(isCollapsed));
  }, [isCollapsed]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Erro ao sair", error);
    }
  };

  // Helper para renderizar Links com Tooltip (quando colapsado) ou Texto (quando expandido)
  const NavItem = ({
    to,
    icon: Icon,
    label,
  }: {
    to: string;
    icon: any;
    label: string;
  }) => {
    const isActive = location.pathname === to;

    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to={to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                // Estilização baseada no estado ativo
                isActive
                  ? "bg-muted text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted",
                // Ajuste de layout quando colapsado
                isCollapsed ? "justify-center px-2" : ""
              )}
            >
              <Icon className="h-4 w-4" />
              {!isCollapsed && <span>{label}</span>}
            </Link>
          </TooltipTrigger>
          {/* Só mostra o Tooltip se a sidebar estiver fechada */}
          {isCollapsed && <TooltipContent side="right">{label}</TooltipContent>}
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div
      // A mágica do Grid dinâmico acontece aqui
      className={cn(
        "grid h-screen w-full transition-all duration-300 overflow-hidden",
        isCollapsed
          ? "md:grid-cols-[60px_1fr]" // Largura Mini
          : "md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]" // Largura Normal
      )}
    >
      {/* --- SIDEBAR (Desktop) --- */}
      <div className="hidden border-r bg-muted/40 md:flex md:flex-col overflow-hidden relative group">
        {/* Header da Sidebar */}
        <div
          className={cn(
            "flex h-14 items-center border-b lg:h-15 shrink-0 transition-all",
            isCollapsed ? "justify-center" : "px-4 lg:px-6"
          )}
        >
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Package2 className="h-6 w-6" />
            {!isCollapsed && <span className="">Meu App</span>}
          </Link>
        </div>

        {/* Botão de Toggle (Aparece ao passar o mouse na sidebar) */}
        <div className="absolute -right-px mx-1 top-5 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6 rounded-full border shadow-md bg-background"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </Button>
        </div>

        {/* Links de Navegação */}
        <div className="flex-1 overflow-y-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem to="/metas" icon={Target} label="Minhas Metas" />
            <NavItem
              to="/lancamentos"
              icon={PenTool}
              label="Meus Lançamentos"
            />
            <RoleGuard allowedRoles={["superuser", "avaliador"]}>
              <NavItem to="/auditoria" icon={Scale} label="Auditoria" />
            </RoleGuard>
            {/* <NavItem to="/perfil" icon={User} label="Perfil" /> */}
          </nav>
        </div>

        {isManager && profile?.sector?.id && (
          <>
            <div className="my-2 border-t border-border/50" />
            <span
              className={cn(
                "px-4 text-xs font-semibold text-muted-foreground mb-2",
                isCollapsed && "hidden"
              )}
            >
              GESTÃO
            </span>

            {/* Link Dinâmico usando o ID do setor do usuário logado */}
            <NavItem
              to={`/sector/${profile.sector.id}/goals`}
              icon={Users}
              label="Metas do Setor"
            />
            <NavItem
              to="/created-goals"
              icon={Briefcase}
              label="Criadas por Mim"
            />
          </>
        )}

        {/* Footer da Sidebar (Opcional: Logout rápido) */}
        <div className="mt-auto p-4 border-t">
          {!isCollapsed && (
            <div className="text-xs text-muted-foreground text-center">
              v1.0.0
            </div>
          )}
        </div>
      </div>

      {/* --- ÁREA PRINCIPAL (Direita) --- */}
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header Superior */}
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-15 lg:px-6 shrink-0">
          {/* Menu Mobile (Sheet) */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                  to="#"
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                  <Package2 className="h-6 w-6" />
                  <span className="sr-only">PPR Florestal</span>
                </Link>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-4 rounded-xl px-3 py-2 hover:bg-muted"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Dashboard
                </Link>
                <Link
                  to="/perfil"
                  className="flex items-center gap-4 rounded-xl px-3 py-2 hover:bg-muted"
                >
                  <User className="h-5 w-5" />
                  Perfil
                </Link>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Espaçador */}
          <div className="w-full flex-1"></div>

          <div className="w-full flex-1 flex justify-end items-center">
            {/* Exemplo: Mostrar "Olá, Fulano" no header */}
            {isLoadingProfile ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <span className="text-sm font-medium ml-4 hidden md:inline-block">
                Olá, {profile?.name.split(" ")[0] || "Usuário"}
              </span>
            )}
          </div>

          {/* Dropdown do Usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.photoURL || ""} />
                  <AvatarFallback>
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">Menu do usuário</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {isLoadingProfile ? (
                      <Skeleton className="h-3 w-20" />
                    ) : (
                      profile?.name
                    )}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {profile?.sector.name} ({profile?.sector.acronym})
                  </p>
                  {/* Mostrar cargo se for Admin */}
                  {profile?.roles.includes("admin") && (
                    <span className="text-[10px] text-primary font-bold mt-1">
                      ADMINISTRADOR
                    </span>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/perfil")}>
                Configurações
              </DropdownMenuItem>
              <DropdownMenuItem>Suporte</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Conteúdo com Scroll Próprio */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
