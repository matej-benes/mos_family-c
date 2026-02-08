export type UserRole = "superadmin" | "starší" | "mladší";

export type User = {
  id: string;
  name: string;
  pin: string;
  role: UserRole;
  deviceIds?: string[];
  bedtime?: string; // HH:mm format
  avatarUrl: string;
  dataAiHint: string;
  approvals?: {
    apps: string[];
    contacts: string[];
  };
};

export type GameState = "hraje_se" | "nehraje_se";

export type ActiveApp = null | "admin" | "ai" | "calling";

export type CallStatus = 'pending' | 'answered' | 'declined' | 'ended' | 'none';

export interface Call {
  id: string;
  callerId: string;
  calleeId: string;
  callerName: string;
  status: CallStatus;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
}
