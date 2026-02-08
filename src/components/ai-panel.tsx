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
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>You do not have permission to use the AI Studio.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a description for the UI.' });
      return;
    }
    setIsLoading(true);
    setGeneratedCode('');
    try {
      const result = await generateUIFromDescription({ description });
      setGeneratedCode(result.uiCode);
      toast({ title: 'UI Generated!', description: 'The AI has generated your component code.' });
    } catch (error) {
      console.error('UI Generation failed:', error);
      toast({ variant: 'destructive', title: 'Generation Failed', description: 'An error occurred while generating the UI.' });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    toast({ title: 'Copied to Clipboard!' });
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      <Card className="lg:w-1/3 flex-shrink-0 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wand2 /> AI UI Generator</CardTitle>
          <CardDescription>Describe the UI you want to build, and the AI will generate the React/TypeScript code.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4">
          <Textarea
            placeholder="e.g., A user profile card with an avatar, name, and a 'View Profile' button."
            className="flex-1 text-base"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button onClick={handleGenerate} disabled={isLoading} size="lg">
            {isLoading ? <CircleDotDashed className="mr-2 h-5 w-5 animate-spin" /> : <Wand2 className="mr-2 h-5 w-5" />}
            {isLoading ? 'Generating...' : 'Generate UI'}
          </Button>
        </CardContent>
      </Card>
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Generated Code</CardTitle>
          <CardDescription>The generated component code will appear here. Copy and use it in your project.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 relative min-h-0">
          <ScrollArea className="h-full w-full rounded-md border bg-background">
             {generatedCode && (
              <Button size="sm" variant="ghost" className="absolute top-3 right-3 z-10" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            )}
            <pre className="p-4 text-sm whitespace-pre-wrap">
              <code>{isLoading ? 'Generating code, please wait...' : (generatedCode || 'Code will be displayed here.')}</code>
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
