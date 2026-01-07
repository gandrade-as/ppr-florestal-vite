import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useCreateUser } from "@/hooks/useUserProfile";
import { useSectors } from "@/hooks/useSector";
import { User, Briefcase, Mail, Shield } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CreateUserSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateUserSheet({ isOpen, onClose }: CreateUserSheetProps) {
  const { mutate: createUser, isPending } = useCreateUser();
  const { data: sectors, isLoading: isLoadingSectors } = useSectors();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      role: "",
      sectorId: "",
    },
  });

  // Resetar formulário ao abrir
  useEffect(() => {
    if (isOpen) reset();
  }, [isOpen, reset]);

  const onSubmit = (data: any) => {
    createUser(
      {
        name: data.name,
        email: data.email,
        roles: [data.role], // Array de roles conforme o schema
        sector_id: data.sectorId,
        // Campos opcionais/padrão
        avatarUrl: `https://ui-avatars.com/api/?name=${data.name}&background=random`,
      },
      {
        onSuccess: () => {
          onClose();
          reset();
        },
      }
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:w-125 p-0 flex flex-col bg-slate-50/50">
        <SheetHeader className="px-6 py-6 bg-background border-b shadow-sm">
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Novo Usuário
          </SheetTitle>
          <SheetDescription>
            Cadastre um novo colaborador no sistema.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          <form
            id="create-user-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {/* Nome */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Nome Completo <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  placeholder="Ex: Ana Souza"
                  {...register("name", { required: "O nome é obrigatório" })}
                  className="pl-9 bg-background"
                />
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
              {errors.name && (
                <span className="text-xs text-red-500">
                  {errors.name.message as string}
                </span>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label>
                E-mail Corporativo <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type="email"
                  placeholder="ana.souza@empresa.com"
                  {...register("email", { required: "O e-mail é obrigatório" })}
                  className="pl-9 bg-background"
                />
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
              {errors.email && (
                <span className="text-xs text-red-500">
                  {errors.email.message as string}
                </span>
              )}
            </div>

            {/* Setor */}
            <div className="space-y-2">
              <Label>
                Setor de Lotação <span className="text-red-500">*</span>
              </Label>
              <Select
                onValueChange={(v) => setValue("sectorId", v)}
                value={watch("sectorId")}
              >
                <SelectTrigger className="bg-background pl-9 relative">
                  <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <SelectValue
                    placeholder={
                      isLoadingSectors ? "Carregando..." : "Selecione o setor"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {sectors?.map((sector) => (
                    <SelectItem key={sector.id} value={sector.id}>
                      {sector.name} ({sector.acronym})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                type="hidden"
                {...register("sectorId", { required: "Selecione um setor" })}
              />
              {errors.sectorId && (
                <span className="text-xs text-red-500">
                  {errors.sectorId.message as string}
                </span>
              )}
            </div>

            {/* Cargo (Role) */}
            <div className="space-y-2">
              <Label>
                Nível de Acesso (Cargo) <span className="text-red-500">*</span>
              </Label>
              <Select
                onValueChange={(v) => setValue("role", v)}
                value={watch("role")}
              >
                <SelectTrigger className="bg-background pl-9 relative">
                  <Shield className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Selecione o perfil de acesso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="colaborador">
                    Colaborador (Acesso Básico)
                  </SelectItem>
                  <SelectItem value="avaliador">
                    Avaliador (Auditoria)
                  </SelectItem>
                  <SelectItem value="gestor">
                    Gestor (Gerencia Setor)
                  </SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
              <input
                type="hidden"
                {...register("role", { required: "Selecione um cargo" })}
              />
              {errors.role && (
                <span className="text-xs text-red-500">
                  {errors.role.message as string}
                </span>
              )}
            </div>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-700">
              <strong>Nota:</strong> O usuário precisará criar uma senha no
              primeiro acesso ou através do fluxo de recuperação, já que o login
              é gerenciado externamente.
            </div>
          </form>
        </ScrollArea>

        <SheetFooter className="p-6 border-t bg-background">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isPending}>
            {isPending ? "Criando..." : "Criar Usuário"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
