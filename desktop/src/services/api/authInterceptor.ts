class AuthTokenManager {
  private static instance: AuthTokenManager;
  private token: string | null = null;
  private currentUser: any = null;

  private constructor() {}

  public static getInstance(): AuthTokenManager {
    if (!AuthTokenManager.instance) {
      AuthTokenManager.instance = new AuthTokenManager();
    }
    return AuthTokenManager.instance;
  }

  public setToken(token: string | null) {
    this.token = token;
  }

  public getToken(): string | null {
    return this.token;
  }

  public setUser(user: any) {
    this.currentUser = user;
  }

  public getUser(): any {
    return this.currentUser;
  }

  public clearSession() {
    this.token = null;
    this.currentUser = null;
  }
}

export const authManager = AuthTokenManager.getInstance();
