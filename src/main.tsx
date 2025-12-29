import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"

// createRoot(document.getElementById("root")!).render(
//   <StrictMode>
//     <App />
//   </StrictMode>
// )

// Função para preparar o ambiente
async function enableMocking() {
  // Só roda se estiver em modo de desenvolvimento (DEV)
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    
    // Inicia o worker e silencia logs desnecessários no console
    return worker.start({
      onUnhandledRequest: 'bypass', // Se a rota não for mockada, deixa passar para a internet real (ex: Firebase)
    })
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
