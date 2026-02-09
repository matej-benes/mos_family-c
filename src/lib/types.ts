export type UserRole = "superadmin" | "starsi" | "mladsi" | "ostatni";

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
  isManuallyLocked?: boolean;
  manualLockMessage?: string;
};

export type Device = {
  id: string;
  lastKnownUserId?: string;
  lastKnownUserName?: string;
  lastUnlinkedTimestamp?: any; // For Firestore serverTimestamp
};

export type GameState = "hraje_se" | "nehraje_se";

export type ActiveApp = null | "admin" | "calling" | "messaging" | "calendar";

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

export type Message = {
  id: string;
  senderId: string;
  text: string;
  timestamp: {
    seconds: number;
    nanoseconds: number;
  } | null;
};

export type Chat = {
  id: string;
  participants: string[];
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: any;
  }
};

export type Settings = {
  id: string;
  wallpaperUrl?: string;
};
