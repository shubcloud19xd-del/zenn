"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import * as Y from "yjs";
import { useSelf } from "@liveblocks/react/suspense";
import WhiteboardToolbar, { WhiteboardTool } from "./WhiteboardToolbar";
import WhiteboardCanvas, { WhiteboardStroke } from "./WhiteboardCanvas";
import useOwner from "../lib/useOwner";

interface WhiteboardProps {
  doc: Y.Doc;
  provider: any;
  darkMode: boolean;
}

export default function Whiteboard({ doc, provider, darkMode }: WhiteboardProps) {
  const userInfo = useSelf((me) => me.info);
  const isOwner = useOwner();
  const userId = userInfo?.email || "anonymous";

  // Tool state
  const [activeTool, setActiveTool] = useState<WhiteboardTool>("pen");
  const [activeColor, setActiveColor] = useState(darkMode ? "#ffffff" : "#1e1e1e");
  const [strokeWidth, setStrokeWidth] = useState(4);

  // Yjs shared array for strokes
  const [yStrokes, setYStrokes] = useState<Y.Array<WhiteboardStroke> | null>(null);

  // Undo manager
  const undoManagerRef = useRef<Y.UndoManager | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Initialize Yjs array + UndoManager
  useEffect(() => {
    if (!doc) return;

    const strokesArray = doc.getArray<WhiteboardStroke>("whiteboard-strokes");
    setYStrokes(strokesArray);

    // Create UndoManager scoped to this client's transactions
    const clientOrigin = `whiteboard-${userId}-${Date.now()}`;
    const um = new Y.UndoManager(strokesArray, {
      trackedOrigins: new Set([clientOrigin]),
    });

    undoManagerRef.current = um;

    // Wrap yStrokes mutations so they use our origin
    const originalPush = strokesArray.push.bind(strokesArray);
    const originalDelete = strokesArray.delete.bind(strokesArray);

    strokesArray.push = (content: WhiteboardStroke[]) => {
      doc.transact(() => {
        originalPush(content);
      }, clientOrigin);
      return content.length;
    };

    strokesArray.delete = (index: number, length: number) => {
      doc.transact(() => {
        originalDelete(index, length);
      }, clientOrigin);
    };

    // Track undo/redo state
    const updateUndoState = () => {
      setCanUndo(um.undoStack.length > 0);
      setCanRedo(um.redoStack.length > 0);
    };

    um.on("stack-item-added", updateUndoState);
    um.on("stack-item-popped", updateUndoState);
    um.on("stack-cleared", updateUndoState);

    return () => {
      um.destroy();
      undoManagerRef.current = null;
    };
  }, [doc, userId]);

  // Update default color when dark mode changes
  useEffect(() => {
    setActiveColor(darkMode ? "#ffffff" : "#1e1e1e");
  }, [darkMode]);

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    undoManagerRef.current?.undo();
  }, []);

  const handleRedo = useCallback(() => {
    undoManagerRef.current?.redo();
  }, []);

  // Clear all strokes
  const handleClear = useCallback(() => {
    if (!yStrokes) return;
    if (!confirm("Clear the entire whiteboard? This cannot be undone.")) return;
    doc.transact(() => {
      yStrokes.delete(0, yStrokes.length);
    });
  }, [yStrokes, doc]);

  if (!yStrokes) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="wb-container">
      <WhiteboardToolbar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        activeColor={activeColor}
        setActiveColor={setActiveColor}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        canUndo={canUndo}
        canRedo={canRedo}
        isOwner={isOwner}
        darkMode={darkMode}
      />
      <WhiteboardCanvas
        yStrokes={yStrokes}
        activeTool={activeTool}
        activeColor={activeColor}
        strokeWidth={strokeWidth}
        darkMode={darkMode}
        userId={userId}
      />
    </div>
  );
}
