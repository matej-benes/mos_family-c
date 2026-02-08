"use client";

import { useState } from 'react';
import { generateUIFromDescription } from '@/ai/flows/generate-ui-from-description';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Wand2, CircleDotDashed, Copy } from 'lucide-react';
import { useMikyos } from '@/hooks/use-mikyos';

export function AiPanel() {
  const { currentUser } = useMikyos();
  const [description, setDescription] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  if (currentUser?.role !== 'superadmin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Přístup odepřen</CardTitle>
          <CardDescription>Nemáte oprávnění používat AI Studio.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast({ variant: 'destructive', title: 'Chyba', description: 'Zadejte prosím popis pro UI.' });
      return;
    }
    setIsLoading(true);
    setGeneratedCode('');
    try {
      const result = await generateUIFromDescription({ description });
      setGeneratedCode(result.uiCode);
      toast({ title: 'UI vygenerováno!', description: 'AI vygenerovala kód vaší komponenty.' });
    } catch (error) {
      console.error('UI Generation failed:', error);
      toast({ variant: 'destructive', title: 'Generování selhalo', description: 'Při generování UI došlo k chybě.' });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    toast({ title: 'Zkopírováno do schránky!' });
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      <Card className="lg:w-1/3 flex-shrink-0 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wand2 /> AI Generátor UI</CardTitle>
          <CardDescription>Popište UI, které chcete vytvořit, a AI vygeneruje kód v React/TypeScript.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4">
          <Textarea
            placeholder="např. Karta profilu uživatele s avatarem, jménem a tlačítkem 'Zobrazit profil'."
            className="flex-1 text-base"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button onClick={handleGenerate} disabled={isLoading} size="lg">
            {isLoading ? <CircleDotDashed className="mr-2 h-5 w-5 animate-spin" /> : <Wand2 className="mr-2 h-5 w-5" />}
            {isLoading ? 'Generuji...' : 'Generovat UI'}
          </Button>
        </CardContent>
      </Card>
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Vygenerovaný kód</CardTitle>
          <CardDescription>Zde se objeví vygenerovaný kód komponenty. Zkopírujte ho a použijte ve svém projektu.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 relative min-h-0">
          <ScrollArea className="h-full w-full rounded-md border bg-background">
             {generatedCode && (
              <Button size="sm" variant="ghost" className="absolute top-3 right-3 z-10" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Kopírovat
              </Button>
            )}
            <pre className="p-4 text-sm whitespace-pre-wrap">
              <code>{isLoading ? 'Generuji kód, čekejte prosím...' : (generatedCode || 'Kód se zobrazí zde.')}</code>
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
