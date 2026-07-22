"use client";

import React, { createContext, useContext, useState } from "react";

type ViewMode = "editor" | "whiteboard";

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isDocumentOpen: boolean;
  setIsDocumentOpen: (open: boolean) => void;
}

const ViewModeContext = createContext<ViewModeContextType>({
  viewMode: "editor",
  setViewMode: () => {},
  isDocumentOpen: false,
  setIsDocumentOpen: () => {},
});

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>("editor");
  const [isDocumentOpen, setIsDocumentOpen] = useState(false);

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode, isDocumentOpen, setIsDocumentOpen }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  return useContext(ViewModeContext);
}
