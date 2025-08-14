'use client';

import { useState, useCallback } from 'react';
import { CanvasState, HistoryState } from '@/types';

const MAX_HISTORY_SIZE = 25;

export const useCanvasHistory = (initialState: CanvasState) => {
  const [history, setHistory] = useState<HistoryState>({
    states: [initialState],
    currentIndex: 0,
  });
  const [isUndoRedo, setIsUndoRedo] = useState(false);

  const addToHistory = useCallback((state: CanvasState) => {
    // console.log('addToHistory', state);
    setIsUndoRedo(false); // Not an undo/redo operation
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
    setIsUndoRedo(true); // This is an undo/redo operation
    setHistory(prev => ({
      ...prev,
      currentIndex: Math.max(0, prev.currentIndex - 1),
    }));
  }, []);

  const redo = useCallback(() => {
    setIsUndoRedo(true); // This is an undo/redo operation
    setHistory(prev => ({
      ...prev,
      currentIndex: Math.min(prev.states.length - 1, prev.currentIndex + 1),
    }));
  }, []);

  const resetHistory = useCallback((newInitialState: CanvasState) => {
    setIsUndoRedo(true);
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
    isUndoRedo,
  };
};