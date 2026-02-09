"use client";

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState } from "react";

export function CalendarPanel() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Card className="h-full flex flex-col items-center justify-center">
      <CardHeader className="text-center">
        <CardTitle>Kalendář</CardTitle>
        <CardDescription>Rodinný kalendář událostí.</CardDescription>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border"
        />
      </CardContent>
    </Card>
  );
}
