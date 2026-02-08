export type UserRole = "superadmin" | "starší" | "mladší";

export type User = {
  id: string;
  name: string;
  username: string;
  pin: string;
  role: UserRole;
  bedtime?: string; // HH:mm format
  avatarUrl: string;
  dataAiHint: string;
};

export type GameState = "hraje_se" | "nehraje_se";

export type ActiveApp = null | "admin" | "ai";
