"use client";

import type { ReactNode } from 'react';
import { createContext, useCallback, useEffect, useState, useMemo, useRef } from 'react';
import type { User, UserRole, GameState, ActiveApp, Call, CallStatus, Settings } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where, onSnapshot, updateDoc, addDoc, getDoc, collectionGroup, writeBatch } from 'firebase/firestore';

// Configuration for the RTCPeerConnection
const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

interface MikyosContextType {
  currentUser: User | null;
  deviceUser: User | null;
  deviceId: string | null;
  users: User[];
  gameState: GameState;
  activeApp: ActiveApp;
  isLocked: boolean;
  lockMessage: string;
  login: (pin: string) => void;
  logout: () => void;
  setActiveApp: (app: ActiveApp) => void;
  toggleGameMode: () => void;
  setBedtime: (userId: string, time: string) => void;
  updateUserApprovals: (userId: string, approvals: { apps: string[]; contacts: string[] }, toastOptions?: { title: string; description: string } | null) => void;
  setManualLock: (userId: string, message: string) => void;
  clearManualLock: (userId: string) => void;
  approveContactInPerson: (requesterId: string, targetContactId: string, approverId: string, approverPin: string) => Promise<boolean>;
  // WebRTC calling state and functions
  startCall: (calleeId: string) => void;
  answerCall: () => void;
  hangUp: () => void;
  incomingCall: Call | null;
  activeCall: Call | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  // Wallpaper
  wallpaperUrl?: string;
  setWallpaper: (url: string) => void;
}

export const MikyosContext = createContext<MikyosContextType | undefined>(undefined);

export function MikyosProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [deviceUser, setDeviceUser] = useState<User | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [activeApp, setActiveApp] = useState<ActiveApp>(null);
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [lockMessage, setLockMessage] = useState<string>('');
  const { toast } = useToast();
  const firestore = useFirestore();

  // WebRTC State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);


  const usersCollection = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const { data: usersData, isLoading: usersLoading } = useCollection<User>(usersCollection);

  const gameStateDoc = useMemoFirebase(() => firestore ? doc(firestore, 'gameState', 'global') : null, [firestore]);
  const { data: gameStateData, isLoading: gameStateLoading } = useDoc<{mode: GameState}>(gameStateDoc);

  const settingsDoc = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
  const { data: settingsData } = useDoc<Settings>(settingsDoc);

  const users = useMemo(() => usersData || [], [usersData]);
  const gameState = useMemo(() => gameStateData?.mode || 'nehraje_se', [gameStateData]);
  const wallpaperUrl = useMemo(() => settingsData?.wallpaperUrl, [settingsData]);


  useEffect(() => {
    const getOrSetDeviceId = (): string => {
      let id = localStorage.getItem('mikyos-deviceId');
      if (!id) {
          // A simple UUID generator
          id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
          });
          localStorage.setItem('mikyos-deviceId', id);
      }
      return id;
    };
    setDeviceId(getOrSetDeviceId());
  }, []);

  useEffect(() => {
    if (deviceId && users.length > 0) {
      const userForDevice = users.find(u => u.deviceIds && u.deviceIds.includes(deviceId));
      setDeviceUser(userForDevice || null);
    } else {
      setDeviceUser(null);
    }
  }, [deviceId, users]);
  
  // Listen for incoming calls
  useEffect(() => {
    if (!firestore || !currentUser) return;

    const q = query(
      collection(firestore, 'calls'),
      where('calleeId', '==', currentUser.id),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const callDoc = snapshot.docs[0];
        setIncomingCall({ id: callDoc.id, ...callDoc.data() } as Call);
      } else {
        setIncomingCall(null);
      }
    });

    return () => unsubscribe();
  }, [firestore, currentUser]);

  // Listen for active call updates (answer, hangup)
  useEffect(() => {
    if (!firestore || !activeCall) return;

    const unsub = onSnapshot(doc(firestore, 'calls', activeCall.id), (doc) => {
        const callData = doc.data() as Call;
        if(callData.status === 'ended' || callData.status === 'declined'){
            hangUp(true); // cleanup call
        }
    });

    return unsub;
  }, [firestore, activeCall])

  const setupPeerConnection = useCallback((callId: string) => {
    if (!firestore) return null;

    const pc = new RTCPeerConnection(servers);

    // Push tracks from local stream to peer connection
    localStream?.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
    });

    // Pull tracks from remote stream, add to remote stream
    const remote = new MediaStream();
    setRemoteStream(remote);
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        remote.addTrack(track);
      });
    };

    // Listen for ICE candidates and add them to Firestore
    const callerCandidatesCollection = collection(firestore, 'calls', callId, 'callerCandidates');
    const calleeCandidatesCollection = collection(firestore, 'calls', callId, 'calleeCandidates');
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        if(activeCall?.callerId === currentUser?.id) {
          addDocumentNonBlocking(callerCandidatesCollection, event.candidate.toJSON());
        } else {
          addDocumentNonBlocking(calleeCandidatesCollection, event.candidate.toJSON());
        }
      }
    };
    
    return pc;
  }, [localStream, firestore, activeCall, currentUser]);


  const startCall = useCallback(async (calleeId: string) => {
    if (!firestore || !currentUser) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);

      const callDocRef = await addDoc(collection(firestore, 'calls'), {
        callerId: currentUser.id,
        calleeId: calleeId,
        callerName: currentUser.name,
        status: 'pending',
      });
      
      const callData: Call = { id: callDocRef.id, callerId: currentUser.id, calleeId: calleeId, callerName: currentUser.name, status: 'pending' };
      setActiveCall(callData);

      peerConnection.current = setupPeerConnection(callDocRef.id);
      if(!peerConnection.current) return;
      
      const offerDescription = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offerDescription);

      const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type,
      };

      await updateDoc(callDocRef, { offer });

      // Listen for answer and ICE candidates from callee
      onSnapshot(doc(firestore, 'calls', callDocRef.id), (snapshot) => {
        const data = snapshot.data();
        if (!peerConnection.current?.currentRemoteDescription && data?.answer) {
          const answerDescription = new RTCSessionDescription(data.answer);
          peerConnection.current?.setRemoteDescription(answerDescription);
        }
      });
      
      const calleeCandidatesCollection = collection(firestore, 'calls', callDocRef.id, 'calleeCandidates');
      onSnapshot(calleeCandidatesCollection, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            peerConnection.current?.addIceCandidate(candidate);
          }
        });
      });


    } catch (error) {
      console.error('Could not start call:', error);
      toast({ variant: 'destructive', title: 'Chyba hovoru', description: 'Nepodařilo se získat přístup ke kameře nebo mikrofonu.' });
    }
  }, [firestore, currentUser, setupPeerConnection, toast]);

  const answerCall = useCallback(async () => {
    if (!firestore || !incomingCall) return;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);

        const callId = incomingCall.id;
        peerConnection.current = setupPeerConnection(callId);
        if(!peerConnection.current) return;

        const callDocRef = doc(firestore, 'calls', callId);
        const callData = (await getDoc(callDocRef)).data() as Call;

        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(callData.offer!));

        const answerDescription = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answerDescription);

        const answer = {
            type: answerDescription.type,
            sdp: answerDescription.sdp,
        };

        await updateDoc(callDocRef, { answer, status: 'answered' });
        
        setActiveCall({ id: callId, ...incomingCall });
        setIncomingCall(null);

        // Listen for ICE candidates from caller
        const callerCandidatesCollection = collection(firestore, 'calls', callId, 'callerCandidates');
        onSnapshot(callerCandidatesCollection, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    peerConnection.current?.addIceCandidate(candidate);
                }
            });
        });

    } catch (error) {
        console.error("Could not answer call: ", error);
        toast({ variant: 'destructive', title: 'Chyba hovoru', description: 'Nepodařilo se přijmout hovor.' });
    }
  }, [firestore, incomingCall, setupPeerConnection, toast]);

  const hangUp = useCallback(async (isRemoteHangup = false) => {
    if (peerConnection.current) {
        peerConnection.current.getTransceivers().forEach(transceiver => {
            transceiver.stop();
        });
        peerConnection.current.close();
        peerConnection.current = null;
    }
    
    localStream?.getTracks().forEach(track => track.stop());
    remoteStream?.getTracks().forEach(track => track.stop());

    setLocalStream(null);
    setRemoteStream(null);
    
    if (activeCall && !isRemoteHangup) {
      const callDocRef = doc(firestore, 'calls', activeCall.id);
      await updateDoc(callDocRef, { status: 'ended' });
    }
    
    if (incomingCall && !activeCall) {
        const callDocRef = doc(firestore, 'calls', incomingCall.id);
        await updateDoc(callDocRef, { status: 'declined' });
    }

    setActiveCall(null);
    setIncomingCall(null);
  }, [localStream, remoteStream, activeCall, incomingCall, firestore]);
  

  const checkLockState = useCallback(() => {
    if (!currentUser) {
      setIsLocked(true);
      setLockMessage('Pro pokračování se prosím přihlaste.');
      return;
    }
    
    if (['superadmin', 'starší'].includes(currentUser.role)) {
      setIsLocked(false);
      return;
    }

    if (currentUser.isManuallyLocked) {
      setIsLocked(true);
      setLockMessage(currentUser.manualLockMessage || 'Aplikace byla uzamčena administrátorem.');
      return;
    }

    if (gameState === 'nehraje_se') {
      setIsLocked(true);
      setLockMessage('Hra není aktivní. Počkejte prosím na Super Admina.');
      return;
    }

    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    
    if (currentUser.bedtime) {
      const [bedtimeHours, bedtimeMinutes] = currentUser.bedtime.split(':').map(Number);
      
      // Simple bedtime check: locks from bedtime until 6 AM.
      if (
        (currentHours > bedtimeHours || (currentHours === bedtimeHours && currentMinutes >= bedtimeMinutes)) 
        || currentHours < 6
      ) {
        setIsLocked(true);
        setLockMessage('Je po tvé večerce! Systém je zamčený až do rána.');
        return;
      }
    }

    setIsLocked(false);
    setLockMessage('');
  }, [currentUser, gameState]);

  useEffect(() => {
    checkLockState();
    // Re-check every minute
    const interval = setInterval(checkLockState, 60000);
    return () => clearInterval(interval);
  }, [checkLockState]);

  // Update current user details if they change in the database
  useEffect(() => {
    if (currentUser) {
        const liveUser = users.find(u => u.id === currentUser.id);
        if (liveUser) {
            setCurrentUser(liveUser);
        }
    }
  }, [users, currentUser]);


  const login = (pin: string) => {
    if (deviceUser && deviceUser.pin === pin) {
      setCurrentUser(deviceUser);
      setActiveApp(null);
      toast({ title: `Vítej, ${deviceUser.name}!`, description: "Jsi přihlášen." });
    } else if (!deviceUser) {
        toast({ variant: 'destructive', title: "Přihlášení selhalo", description: "Toto zařízení není přiřazeno žádnému uživateli." });
    } else {
        toast({ variant: 'destructive', title: "Přihlášení selhalo", description: "Neplatný PIN." });
    }
  };

  const logout = () => {
    toast({ title: "Odhlášeno", description: "Byli jste odhlášeni." });
    setCurrentUser(null);
    setActiveApp(null);
    hangUp();
  };

  const setBedtime = (userId: string, time: string) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', userId);
    updateDocumentNonBlocking(userDocRef, { bedtime: time });
    toast({ title: "Večerka aktualizována", description: `Požadavek na změnu večerky pro uživatele byl odeslán.` });
  };
  
  const updateUserApprovals = (userId: string, approvals: { apps: string[]; contacts: string[] }, toastOptions?: { title: string; description: string } | null) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', userId);
    updateDocumentNonBlocking(userDocRef, { approvals });

    if (toastOptions === null) return; // Suppress toast if null is passed

    toast(toastOptions || { title: "Schválení aktualizováno", description: "Seznam schválených položek byl upraven." });
  };

  const approveContactInPerson = async (requesterId: string, targetContactId: string, approverId: string, approverPin: string): Promise<boolean> => {
    const approver = users.find(u => u.id === approverId);
    if (!approver || approver.role !== 'starší' || approver.pin !== approverPin) {
      toast({ variant: 'destructive', title: 'Ověření selhalo', description: 'Neplatný PIN nebo oprávnění má pouze role "starší".' });
      return false;
    }

    const requester = users.find(u => u.id === requesterId);
    if (!requester) {
        console.error("Requester not found in approveContactInPerson");
        return false;
    }
    
    const userToApprove = users.find(u => u.id === targetContactId);
    if (!userToApprove) {
        console.error("Target contact not found in approveContactInPerson");
        return false;
    }

    const currentApprovals = requester.approvals || { apps: [], contacts: [] };
    if (currentApprovals.contacts.includes(targetContactId)) {
        return true; // Already approved
    }

    const newApprovals = {
      ...currentApprovals,
      contacts: [...currentApprovals.contacts, targetContactId],
    };

    const successToast = {
        title: 'Kontakt schválen!',
        description: `${requester.name} může nyní psát s ${userToApprove.name}.`
    };
    
    updateUserApprovals(requesterId, newApprovals, successToast);
    return true;
  };

  const toggleGameMode = () => {
    if (!currentUser || !['superadmin', 'starší'].includes(currentUser.role) || !firestore) {
      toast({ variant: 'destructive', title: "Oprávnění odepřeno", description: "Pro změnu herního režimu nemáte oprávnění." });
      return;
    }
    const newState = gameState === 'hraje_se' ? 'nehraje_se' : 'hraje_se';
    const gameStateRef = doc(firestore, 'gameState', 'global');
    setDocumentNonBlocking(gameStateRef, { mode: newState }, { merge: true });
    toast({ title: "Herní režim změněn", description: `Hra je nyní ${newState.replace('_', ' ')}.` });
  }

  const setWallpaper = (url: string) => {
    if (!currentUser || !['superadmin', 'starší'].includes(currentUser.role) || !firestore) {
      toast({ variant: 'destructive', title: "Oprávnění odepřeno", description: "Pro změnu tapety nemáte oprávnění." });
      return;
    }
    const settingsRef = doc(firestore, 'settings', 'global');
    setDocumentNonBlocking(settingsRef, { wallpaperUrl: url }, { merge: true });
    toast({ title: url ? "Tapeta nastavena" : "Tapeta odstraněna" });
  };

  const setManualLock = (userId: string, message: string) => {
    if (!firestore || !message) return;
    const userDocRef = doc(firestore, 'users', userId);
    updateDocumentNonBlocking(userDocRef, { isManuallyLocked: true, manualLockMessage: message });
    toast({ title: "Uživatel uzamčen", description: "Uživatel byl manuálně uzamčen." });
  };

  const clearManualLock = (userId: string) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', userId);
    updateDocumentNonBlocking(userDocRef, { isManuallyLocked: false, manualLockMessage: '' });
    toast({ title: "Uživatel odemčen", description: "Uživatel byl odemčen." });
  };

  const value = {
    currentUser,
    users,
    deviceUser,
    deviceId,
    gameState,
    activeApp,
    isLocked,
    lockMessage,
    login,
    logout,
    setActiveApp,
    toggleGameMode,
    setBedtime,
    updateUserApprovals,
    startCall,
    answerCall,
    hangUp,
    incomingCall,
    activeCall,
    localStream,
    remoteStream,
    wallpaperUrl,
    setWallpaper,
    setManualLock,
    clearManualLock,
    approveContactInPerson,
  };

  return <MikyosContext.Provider value={value}>{children}</MikyosContext.Provider>;
}
