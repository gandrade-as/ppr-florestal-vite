import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase/client"; // Usando o alias configurado anteriormente

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // O onAuthStateChanged retorna uma função de "unsubscribe"
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Opcional: Aqui você pode pegar o token para enviar ao seu backend pronto
        currentUser.getIdToken().then((token) => {
          console.log("Token para Backend:", token);
          // Salvar em interceptors do axios ou storage se necessário
        });
      }
    });

    // Cleanup function: Vital para o Vite HMR não criar múltiplos listeners
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
