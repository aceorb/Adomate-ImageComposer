'use client';

import { useState, useCallback } from 'react';
import { CanvasState, HistoryState } from '@/types';

const MAX_HISTORY_SIZE = 25;

export const useCanvasHistory = (initialState: CanvasState) => {
  const [history, setHistory] = useState<HistoryState>({
    states: [initialState],
    currentIndex: 0,
  });

  const addToHistory = useCallback((state: CanvasState) => {
    console.log('addToHistory', state);
    setHistory(prev => {
      const newStates = [...prev.states.slice(0, prev.currentIndex + 1), state];
      
      // Limit history size
      if (newStates.length > MAX_HISTORY_SIZE) {
        newStates.splice(0, newStates.length - MAX_HISTORY_SIZE);
      }
      
      return {
        states: newStates,
        currentIndex: newStates.length - 1,
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory(prev => ({
      ...prev,
      currentIndex: Math.max(0, prev.currentIndex - 1),
    }));
  }, []);

  const redo = useCallback(() => {
    setHistory(prev => ({
      ...prev,
      currentIndex: Math.min(prev.states.length - 1, prev.currentIndex + 1),
    }));
  }, []);

  const resetHistory = useCallback((newInitialState: CanvasState) => {
    setHistory({
      states: [newInitialState],
      currentIndex: 0,
    });
  }, []);

  const canUndo = history.currentIndex > 0;
  const canRedo = history.currentIndex < history.states.length - 1;
  const currentState = history.states[history.currentIndex];

  return {
    currentState,
    addToHistory,
    undo,
    redo,
    resetHistory,
    canUndo,
    canRedo,
    historyLength: history.states.length,
  };
};