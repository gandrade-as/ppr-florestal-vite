import axios from "axios";
import { auth } from "@/lib/firebase/client"; // Ajuste o import conforme seu arquivo real

// 1. Cria a instância do Axios
// O import.meta.env.VITE_API_URL deve estar no seu .env
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

// 2. Interceptor de Requisição (Antes de enviar)
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;

    if (user) {
      // Pega o token atual (se estiver expirado, o Firebase renova automaticamente aqui)
      const token = await user.getIdToken();

      // Injeta no Header
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Interceptor de Resposta (Opcional, mas recomendado)
// Trata erros globais, como sessão expirada no backend
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Se o backend recusar o token (ex: usuário deletado/banido), deslogamos
      // await auth.signOut();
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
