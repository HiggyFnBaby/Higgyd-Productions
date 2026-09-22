import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      workspaceId?: string;
      email?: string | null;
      name?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    workspaceId?: string;
  }
}
