import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "@/lib/firebase/client";

// Componentes shadcn/ui
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// 1. Schema de Validação (Zod)
// Define as regras antes mesmo de tentar enviar ao Firebase
const loginSchema = z.object({
  email: z.email({ message: "Insira um e-mail válido." }),
  password: z
    .string()
    .min(6, { message: "A senha deve ter no mínimo 6 caracteres." }),
});

// Tipagem inferida automaticamente do schema
type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const [globalError, setGlobalError] = useState<string | null>(null);

  // 2. Configuração do React Hook Form
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // 3. Função de Submit
  const onSubmit = async (data: LoginFormValues) => {
    setGlobalError(null); // Limpa erros anteriores
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      // O AuthContext vai detectar a mudança e o ProtectedRoute redirecionará
      // mas podemos forçar a navegação para garantir fluidez
      navigate("/");
    } catch (error: any) {
      console.error("Erro no login:", error.code);

      // Mapeamento de erros comuns do Firebase para Português
      switch (error.code) {
        case "auth/invalid-credential":
        case "auth/user-not-found":
        case "auth/wrong-password":
          setGlobalError("E-mail ou senha incorretos.");
          break;
        case "auth/too-many-requests":
          setGlobalError(
            "Muitas tentativas falhas. Tente novamente mais tarde."
          );
          break;
        default:
          setGlobalError("Ocorreu um erro inesperado. Tente novamente.");
      }
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Acesso ao Sistema</CardTitle>
          <CardDescription>
            Insira suas credenciais para entrar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Exibe erro global do Firebase se houver */}
              {globalError && (
                <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md">
                  {globalError}
                </div>
              )}

              {/* Campo de E-mail */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campo de Senha */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
