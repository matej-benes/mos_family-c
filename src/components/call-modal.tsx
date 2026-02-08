"use client";

import { useEffect, useRef } from 'react';
import { useMikyos } from '@/hooks/use-mikyos';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, PhoneCall, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';


function VideoPlayer({ stream, muted = false, isLocal = false }: { stream: MediaStream | null, muted?: boolean, isLocal?: boolean }) {
    const videoRef = useRef<HTMLVideoElement>(null);
  
    useEffect(() => {
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      }
    }, [stream]);
  
    return (
      <div className={cn("relative aspect-video w-full overflow-hidden rounded-lg bg-slate-800", isLocal && "w-48 absolute bottom-4 right-4 z-20 border-2 border-white")}>
        <video ref={videoRef} muted={muted} autoPlay playsInline className="h-full w-full object-cover"></video>
      </div>
    );
}


export function CallModal() {
  const { incomingCall, activeCall, answerCall, hangUp, localStream, remoteStream } = useMikyos();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const call = activeCall || incomingCall;
  if (!call) return null;

  const isIncoming = !!incomingCall && !activeCall;
  const isOutgoing = !!activeCall && activeCall.status === 'pending';
  const isInCall = !!activeCall && activeCall.status === 'answered';


  const toggleMute = () => {
    if(localStream){
        localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
        setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if(localStream){
        localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
        setIsVideoOff(!isVideoOff);
    }
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <Card className="w-[90vw] h-[90vh] max-w-4xl max-h-[800px] flex flex-col shadow-2xl">
        <CardHeader className="text-center">
            <CardTitle className="text-2xl">
                {isIncoming && `Příchozí hovor od ${call.callerName}`}
                {isOutgoing && `Volám uživateli...`}
                {isInCall && 'Hovor probíhá'}
            </CardTitle>
            <CardDescription>{isOutgoing && 'Čekání na přijetí...'}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center gap-4 relative">
            { (isIncoming || isOutgoing) && (
                 <div className="flex flex-col items-center gap-4 animate-pulse">
                    <Avatar className="w-24 h-24">
                        {/* You might want to fetch the caller's avatar */}
                        <AvatarFallback className="text-4xl">{call.callerName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="text-xl font-bold">{call.callerName}</p>
                 </div>
            )}
            { isInCall && (
                <>
                    <VideoPlayer stream={remoteStream} />
                    <VideoPlayer stream={localStream} muted isLocal/>
                </>
            )}

        </CardContent>
        <CardFooter className="flex justify-center items-center gap-4 p-6 bg-slate-100/5">
            {isIncoming && (
                <>
                    <Button onClick={answerCall} size="lg" className="bg-green-600 hover:bg-green-700 rounded-full w-16 h-16">
                        <PhoneCall className="w-7 h-7" />
                    </Button>
                     <Button onClick={() => hangUp()} size="lg" variant="destructive" className="rounded-full w-16 h-16">
                        <PhoneOff className="w-7 h-7" />
                    </Button>
                </>
            )}
            { (isOutgoing || isInCall) && (
                <>
                  {isInCall && (
                     <>
                        <Button onClick={toggleMute} size="lg" variant={isMuted ? 'secondary' : 'outline'} className="rounded-full w-16 h-16">
                            {isMuted ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                        </Button>
                        <Button onClick={toggleVideo} size="lg" variant={isVideoOff ? 'secondary' : 'outline'} className="rounded-full w-16 h-16">
                            {isVideoOff ? <VideoOff className="w-7 h-7" /> : <Video className="w-7 h-7" />}
                        </Button>
                     </>
                  )}
                  <Button onClick={() => hangUp()} size="lg" variant="destructive" className="rounded-full w-16 h-16">
                    <PhoneOff className="w-7 h-7" />
                  </Button>
                </>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}
