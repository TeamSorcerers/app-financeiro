/**
 * Configurações de gateways para a aplicação.
 * Define a URL base para as requisições à API.
 * Utiliza variáveis de ambiente para configurar o subdiretório e a URL base da API.
 */
export default Object.freeze({
  /**
   * Retorna a URL base para a aplicação.
   * @returns {string} A URL base para a aplicação, combinando o subdiretório e a URL base da API.
   */
  ROOT () {
    const subfolder = process.env.NEXT_PUBLIC_APP_SUBFOLDER ?? "";
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

    return `/${subfolder}${apiBase}`.replace(/\/+/ug, "/"); // Remove barras duplicadas
  },

  /**
   * Rotas de Autenticação
   * @returns {string} A URL base para autenticação.
   */
  AUTH () {
    return `${this.ROOT()}/auth`;
  },

  /**
   * [POST] /auth/signup
   * @returns {string} A URL base para cadastro.
   */
  SIGNUP () {
    return `${this.AUTH()}/signup`;
  },

  GET_ALL_TRANSACTIONS () {
    return `${this.ROOT()}/transactions`;
  },

  /**
   * [POST] /transactions
   * @returns {string} A URL base para criar uma nova transação.
   */
  CREATE_TRANSACTION () {
    return this.GET_ALL_TRANSACTIONS();
  },

  /**
   * [GET] /group/me
   * @returns {string} A URL base para obter informações sobre o grupo do usuário.
   */
  GROUP_ME () {
    return `${this.ROOT()}/group/me`;
  },
});
