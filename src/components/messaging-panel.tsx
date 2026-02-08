"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { useMikyos } from '@/hooks/use-mikyos';
import type { User, Message } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, ArrowLeft } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { cs } from 'date-fns/locale';

export function MessagingPanel() {
  const { currentUser, users } = useMikyos();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const firestore = useFirestore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const approvedContacts = useMemo(() => {
    if (!currentUser) return [];

    // Older siblings can message anyone
    if (currentUser.role === 'starší') {
      return users.filter(u => u.id !== currentUser.id);
    }

    // Younger siblings can only message contacts from their approval list
    if (!currentUser.approvals?.contacts) return [];
    return users.filter(u => currentUser.approvals!.contacts.includes(u.id));

  }, [currentUser, users]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
    if (!firestore || !currentUser || !selectedUser) {
      setMessages([]);
      setChatId(null);
      return;
    }

    const getOrCreateChat = async () => {
      const participants = [currentUser.id, selectedUser.id].sort();
      const generatedChatId = participants.join('_');
      const chatDocRef = doc(firestore, 'chats', generatedChatId);

      setChatId(generatedChatId);

      const messagesCollectionRef = collection(firestore, 'chats', generatedChatId, 'messages');
      const q = query(messagesCollectionRef, orderBy('timestamp', 'asc'));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const msgs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Message));
        setMessages(msgs);
      }, (error) => {
        console.error("Error fetching messages:", error);
      });

      return unsubscribe;
    };

    const unsubscribePromise = getOrCreateChat();

    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
    };
  }, [selectedUser, currentUser, firestore]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !currentUser || !selectedUser || !chatId || !newMessage.trim()) return;

    const messagesCollectionRef = collection(firestore, 'chats', chatId, 'messages');
    
    await addDoc(messagesCollectionRef, {
      text: newMessage,
      senderId: currentUser.id,
      timestamp: serverTimestamp()
    });

    const chatDocRef = doc(firestore, 'chats', chatId);
    const participants = [currentUser.id, selectedUser.id].sort();
    await setDoc(chatDocRef, { 
      participants,
      lastMessage: {
        text: newMessage,
        senderId: currentUser.id,
        timestamp: serverTimestamp()
      }
    }, { merge: true });

    setNewMessage('');
  };
  
  if (!currentUser) return null;

  if (!selectedUser) {
    return (
       <Card className="h-full flex flex-col">
        <CardHeader>
            <CardTitle>Zprávy</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0">
            <ScrollArea className="h-full -mr-6 pr-6">
                <div className="space-y-2">
                    <h3 className="px-4 text-sm font-semibold text-muted-foreground">Kontakty</h3>
                     {approvedContacts.length > 0 ? approvedContacts.map(user => (
                        <button key={user.id} onClick={() => setSelectedUser(user)} className="flex items-center gap-4 p-3 w-full text-left rounded-lg hover:bg-accent transition-colors">
                             <Avatar>
                                <AvatarImage src={user.avatarUrl} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{user.name}</p>
                                <p className="text-sm text-muted-foreground">Zahájit konverzaci</p>
                            </div>
                        </button>
                    )) : (
                        <p className="text-muted-foreground text-center py-8">Nemáte žádné dostupné kontakty pro zasílání zpráv.</p>
                    )}
                </div>
            </ScrollArea>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center gap-4 border-b p-3">
         <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedUser(null)}>
            <ArrowLeft />
         </Button>
         <Avatar>
            <AvatarImage src={selectedUser.avatarUrl} />
            <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <CardTitle className="p-0 text-xl">{selectedUser.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col min-h-0">
        <ScrollArea className="flex-1 p-4 md:p-6">
            <div className="space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={cn("flex items-end gap-2", msg.senderId === currentUser.id ? "justify-end" : "justify-start")}>
                        {msg.senderId !== currentUser.id && (
                             <Avatar className="h-8 w-8">
                                <AvatarImage src={selectedUser.avatarUrl} />
                                <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        )}
                        <div className={cn("max-w-xs md:max-w-md lg:max-w-lg rounded-2xl px-4 py-2", msg.senderId === currentUser.id ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-secondary rounded-bl-none')}>
                            <p className="text-base break-words">{msg.text}</p>
                            <p className="text-xs opacity-70 mt-1 text-right">
                              {msg.timestamp ? formatDistanceToNow(new Date(msg.timestamp.seconds * 1000), { addSuffix: true, locale: cs }) : 'Odesílání...'}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
        </ScrollArea>
        <form onSubmit={handleSendMessage} className="p-4 border-t bg-background flex items-center gap-2">
            <Input 
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Napište zprávu..."
                className="flex-1"
                autoComplete="off"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                <Send className="h-5 w-5" />
            </Button>
        </form>
      </CardContent>
    </Card>
  );
}
