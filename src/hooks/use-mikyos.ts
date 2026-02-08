"use client";

import { useContext } from 'react';
import { MikyosContext } from '@/contexts/mikyos-provider';

export function useMikyos() {
  const context = useContext(MikyosContext);
  if (context === undefined) {
    throw new Error('useMikyos must be used within a MikyosProvider');
  }
  return context;
}
