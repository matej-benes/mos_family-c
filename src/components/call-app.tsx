"use client";

import { useState } from 'react';
import { Bluetooth, Phone, PhoneOff, CircleDotDashed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMikyos } from '@/hooks/use-mikyos';

interface DiscoveredDevice {
  id: string;
  name: string;
  avatarUrl: string;
}

export function CallApp() {
  const { users } = useMikyos();
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredDevice[]>([]);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'in-call'>('idle');
  const [callingDevice, setCallingDevice] = useState<DiscoveredDevice | null>(null);
  const { toast } = useToast();

  const handleScan = async () => {
    setIsScanning(true);
    setDiscoveredDevices([]);
    
    if (!navigator.bluetooth) {
      toast({ variant: 'destructive', title: 'Chyba', description: 'Web Bluetooth není na tomto zařízení podporován.' });
      setIsScanning(false);
      return;
    }
    
    toast({ title: 'Hledám...', description: 'Hledám blízká zařízení pomocí Web Bluetooth.' });

    try {
      // Otevře dialog pro výběr zařízení v prohlížeči.
      // Pro reálnou aplikaci by bylo potřeba filtrovat podle specifické UUID služby.
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
      });

      if (device && device.name) {
        // Pokusíme se najít uživatele podle jména zařízení pro zobrazení avataru
        const matchedUser = users.find(u => u.name.toLowerCase() === device.name?.toLowerCase());
        const discovered: DiscoveredDevice = {
           id: device.id,
           name: device.name,
           avatarUrl: matchedUser ? matchedUser.avatarUrl : `https://picsum.photos/seed/${device.id}/100/100`,
        };
        setDiscoveredDevices([discovered]);
        toast({ title: 'Zařízení nalezeno!', description: `Nalezeno ${device.name}.` });
      } else {
        toast({ title: 'Hledání dokončeno', description: 'Nebylo vybráno žádné zařízení.' });
      }
    } catch (error: any) {
      console.error('Bluetooth scan failed:', error);
      if (error.name === 'NotFoundError') {
         toast({ title: 'Hledání zrušeno', description: 'Nebyl vybrán žádný přístroj.' });
      } else {
         toast({ variant: 'destructive', title: 'Hledání selhalo', description: 'Nelze získat přístup k Bluetooth. Zkontrolujte oprávnění a zapněte Bluetooth.' });
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleInitiateCall = (device: DiscoveredDevice) => {
    // V reálné implementaci WebRTC by zde proběhlo navázání peer-to-peer spojení.
    // To zahrnuje signalizační proces (výměna SDP a ICE kandidátů),
    // který by pro offline aplikaci musel probíhat přes Bluetooth GATT služby.
    // Toto je vysoce komplexní úkol. Pro toto demo hovor pouze simulujeme.
    setCallStatus('calling');
    setCallingDevice(device);
    toast({ title: `Volám ${device.name}...` });

    // Simulace spojení hovoru
    setTimeout(() => {
      setCallStatus('in-call');
      toast({ title: 'Hovor spojen!', description: `Právě mluvíte s ${device.name}.` });
    }, 3000);
  };

  const handleEndCall = () => {
    setCallStatus('idle');
    setCallingDevice(null);
    toast({ title: 'Hovor ukončen' });
  };
  
  if(callStatus === 'calling' || callStatus === 'in-call') {
    return (
       <Card className="h-full flex flex-col items-center justify-center text-center p-6 animate-in fade-in">
        <Avatar className="h-32 w-32 mb-4">
            <AvatarImage src={callingDevice?.avatarUrl} alt={callingDevice?.name} />
            <AvatarFallback>{callingDevice?.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <CardTitle className="text-3xl font-bold mb-2">{callingDevice?.name}</CardTitle>
        <CardDescription className="text-lg mb-6">
            {callStatus === 'calling' ? 'Spojuji...' : 'Spojeno'}
        </CardDescription>
        <Button size="lg" variant="destructive" onClick={handleEndCall} className="rounded-full h-16 w-16 p-0">
            <PhoneOff className="h-8 w-8" />
        </Button>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone /> Offline P2P volání
        </CardTitle>
        <CardDescription>
          Volejte ostatním zařízením přímo bez připojení k internetu. Aplikace využívá Web Bluetooth pro nalezení zařízení. Samotný hovor je simulován.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <Button onClick={handleScan} disabled={isScanning} size="lg">
          {isScanning ? <CircleDotDashed className="mr-2 h-5 w-5 animate-spin" /> : <Bluetooth className="mr-2 h-5 w-5" />}
          {isScanning ? 'Hledám zařízení...' : 'Hledat zařízení v okolí'}
        </Button>
        <div className="flex-1 flex flex-col min-h-0">
          <h3 className="font-semibold mb-2 text-foreground/80">Nalezená zařízení</h3>
          <ScrollArea className="flex-1 border rounded-lg p-2 bg-background">
            {discoveredDevices.length > 0 ? (
              <div className="space-y-2">
                {discoveredDevices.map(device => (
                  <div key={device.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent">
                     <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={device.avatarUrl} alt={device.name} />
                        <AvatarFallback>{device.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{device.name}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleInitiateCall(device)}>
                      <Phone className="h-5 w-5 text-green-500" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>{isScanning ? 'Hledám...' : 'Zatím žádná zařízení nenalezena. Zkuste hledat!'}</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
