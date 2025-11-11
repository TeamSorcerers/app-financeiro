import { beforeAll } from "@jest/globals";

// Setup global de testes
beforeAll(() => {
  // Configurar ambiente de teste
  if (!process.env.NODE_ENV) {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "test",
      writable: true,
    });
  }
  
});
