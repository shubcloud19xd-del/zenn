"use client";

import React, { useState } from "react";
import {
  MousePointer2,
  Pencil,
  Square,
  Circle,
  Minus,
  Type,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Hand,
  Diamond,
  ArrowRight,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

export type WhiteboardTool = "pen" | "rect" | "circle" | "line" | "text" | "eraser" | "pan";

interface WhiteboardToolbarProps {
  activeTool: WhiteboardTool;
  setActiveTool: (tool: WhiteboardTool) => void;
  activeColor: string;
  setActiveColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isOwner: boolean;
  darkMode: boolean;
}

const STROKE_COLORS = [
  "#1e1e1e",
  "#e03131",
  "#2f9e44",
  "#1971c2",
  "#f08c00",
  "#9c36b5",
  "#0c8599",
  "#868e96",
];

const DARK_STROKE_COLORS = [
  "#ffffff",
  "#ff6b6b",
  "#51cf66",
  "#74c0fc",
  "#ffc078",
  "#cc5de8",
  "#66d9e8",
  "#868e96",
];

const STROKE_WIDTHS: { value: number; label: string }[] = [
  { value: 2, label: "Thin" },
  { value: 4, label: "Medium" },
  { value: 8, label: "Bold" },
];

const tools: { id: WhiteboardTool; icon: React.ElementType; label: string; shortcut?: string }[] = [
  { id: "pan", icon: Hand, label: "Hand", shortcut: "H" },
  { id: "pen", icon: Pencil, label: "Draw", shortcut: "P" },
  { id: "line", icon: ArrowRight, label: "Arrow / Line", shortcut: "L" },
  { id: "rect", icon: Square, label: "Rectangle", shortcut: "R" },
  { id: "circle", icon: Circle, label: "Ellipse", shortcut: "O" },
  { id: "text", icon: Type, label: "Text", shortcut: "T" },
  { id: "eraser", icon: Eraser, label: "Eraser", shortcut: "E" },
];

export default function WhiteboardToolbar({
  activeTool,
  setActiveTool,
  activeColor,
  setActiveColor,
  strokeWidth,
  setStrokeWidth,
  onUndo,
  onRedo,
  onClear,
  canUndo,
  canRedo,
  isOwner,
  darkMode,
}: WhiteboardToolbarProps) {
  const colors = darkMode ? DARK_STROKE_COLORS : STROKE_COLORS;

  return (
    <>
      {/* ─── Top Center Toolbar (Excalidraw-style) ─── */}
      <div className="exc-toolbar-top">
        <div className="exc-toolbar-group">
          {/* Color & Props Dropdown */}
          <div className="relative group flex items-center justify-center">
            <button
              className="exc-tool-btn"
              title="Properties"
            >
              <div 
                className="w-4 h-4 rounded-md" 
                style={{ 
                  backgroundColor: activeColor, 
                  boxShadow: darkMode ? 'inset 0 0 0 1px rgba(255,255,255,0.2)' : 'inset 0 0 0 1px rgba(0,0,0,0.2)' 
                }} 
              />
            </button>
            
            {/* Dropdown Menu Wrapper (provides safe hover area) */}
            <div className="absolute top-full left-0 pt-2 hidden group-hover:flex z-50">
              <div className="flex flex-col gap-0 p-3 min-w-[172px] bg-white dark:bg-[#232329] rounded-[10px] shadow-xl border border-black/5 dark:border-white/10 cursor-default">
                {/* Stroke Color */}
                <div className="exc-props-section pt-0">
                <span className="exc-props-label">Stroke</span>
                <div className="exc-color-row">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setActiveColor(color)}
                      className={`exc-color-dot ${activeColor === color ? "exc-color-dot-active" : ""}`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Stroke Width */}
              <div className="exc-props-section">
                <span className="exc-props-label">Stroke width</span>
                <div className="exc-stroke-row">
                  {STROKE_WIDTHS.map((w) => (
                    <button
                      key={w.value}
                      onClick={() => setStrokeWidth(w.value)}
                      className={`exc-stroke-btn ${strokeWidth === w.value ? "exc-stroke-btn-active" : ""}`}
                      title={w.label}
                    >
                      <div
                        className="exc-stroke-preview"
                        style={{ height: Math.max(w.value, 2), width: 20, borderRadius: w.value }}
                      />
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
          </div>

          <div className="w-[1px] h-6 bg-black/10 dark:bg-white/10 mx-1" />

          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`exc-tool-btn ${activeTool === tool.id ? "exc-tool-btn-active" : ""}`}
                title={`${tool.label}${tool.shortcut ? ` — ${tool.shortcut}` : ""}`}
              >
                <Icon className="w-[18px] h-[18px]" />
              </button>
            );
          })}

          <div className="w-[1px] h-6 bg-black/10 dark:bg-white/10 mx-1" />
          
          <button
            onClick={onClear}
            className="exc-tool-btn text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
            title="Clear Whiteboard"
          >
            <Trash2 className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

      {/* ─── Bottom Left: Undo/Redo + Zoom ─── */}
      <div className="exc-bottom-bar">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="exc-action-btn"
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="exc-action-btn"
          title="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>
    </>
  );
}
