"use client";

import { useState, useMemo } from "react";
import { useMikyos } from "@/hooks/use-mikyos";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { cs } from 'date-fns/locale';
import { PlusCircle, Trash2, Clock, Calendar as CalendarIcon, User, Info } from 'lucide-react';
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";

const eventSchema = z.object({
  title: z.string().min(1, "Název je povinný"),
  description: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

export function CalendarPanel() {
  const { currentUser, users, events, addEvent, deleteEvent } = useMikyos();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: { title: "", description: "", startTime: "", endTime: "" },
  });

  const canManageEvents = currentUser && ['starsi', 'superadmin'].includes(currentUser.role);

  const eventDays = useMemo(() => {
    return events.map(event => parseISO(event.date));
  }, [events]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    return events.filter(event => event.date === formattedDate);
  }, [events, selectedDate]);
  
  if (!currentUser || currentUser.role === 'ostatni') {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center">
          <CardHeader>
            <CardTitle>Přístup odepřen</CardTitle>
            <CardDescription>Pro zobrazení kalendáře nemáte oprávnění.</CardDescription>
          </CardHeader>
        </div>
      </Card>
    );
  }

  const handleAddEvent = (data: EventFormData) => {
    if (!selectedDate) return;
    addEvent({
      ...data,
      date: format(selectedDate, 'yyyy-MM-dd'),
    });
    setIsAddDialogOpen(false);
    form.reset();
  };
  
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
        {/* Left Column: Calendar */}
        <div className="lg:col-span-1 flex flex-col items-center">
          <Card className="w-full">
             <CardContent className="p-2">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="p-0"
                    classNames={{
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
                      day_today: "bg-accent text-accent-foreground",
                    }}
                    modifiers={{ hasEvent: eventDays }}
                    components={{
                        DayContent: ({ date, ...props }) => {
                            const hasEvent = eventDays.some(d => format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
                            return (
                                <div className="relative">
                                    <span>{date.getDate()}</span>
                                    {hasEvent && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full"></div>}
                                </div>
                            );
                        }
                    }}
                    locale={cs}
                />
             </CardContent>
          </Card>
        </div>

        {/* Right Column: Events for the day */}
        <div className="lg:col-span-2 flex flex-col h-full">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-6 w-6" />
                Události pro {selectedDate ? format(selectedDate, 'd. MMMM yyyy', { locale: cs }) : '...'}
              </CardTitle>
              <CardDescription>Seznam událostí pro vybraný den.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
                <ScrollArea className="h-full pr-4 -mr-4">
                  {selectedDayEvents.length > 0 ? (
                    <div className="space-y-4">
                      {selectedDayEvents.map(event => (
                        <div key={event.id} className="p-4 border rounded-lg bg-background/50 relative group">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-bold text-lg">{event.title}</h4>
                              {event.description && <p className="text-muted-foreground mt-1 text-sm">{event.description}</p>}
                            </div>
                            {canManageEvents && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => deleteEvent(event.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <Separator className="my-3" />
                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                            {(event.startTime || event.endTime) && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{event.startTime || 'Celý den'}{event.endTime && ` - ${event.endTime}`}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>Vytvořil(a): {event.createdByName}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <Info className="h-10 w-10 mb-2"/>
                        <p>Pro tento den nejsou naplánovány žádné události.</p>
                    </div>
                  )}
                </ScrollArea>
            </CardContent>
            {canManageEvents && (
              <CardFooter>
                <Button onClick={() => setIsAddDialogOpen(true)} className="w-full md:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Přidat událost
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>

      {/* Add Event Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Přidat novou událost</DialogTitle>
            <DialogDescription>
              Přidejte událost do kalendáře pro den: {selectedDate && format(selectedDate, 'd. MMMM yyyy', { locale: cs })}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddEvent)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Název události</FormLabel>
                    <FormControl>
                      <Input placeholder="Např. Návštěva zubaře" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Popis (nepovinné)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Další podrobnosti o události..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Čas od (nepovinné)</FormLabel>
                      <FormControl><Input type="time" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Čas do (nepovinné)</FormLabel>
                      <FormControl><Input type="time" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Zrušit</Button>
                <Button type="submit">Přidat událost</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
