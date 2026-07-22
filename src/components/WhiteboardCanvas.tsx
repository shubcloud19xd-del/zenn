"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import * as Y from "yjs";
import { WhiteboardTool } from "./WhiteboardToolbar";
import { useMyPresence, useOthers } from "@liveblocks/react/suspense";
import stringToColor from "../lib/stringToColor";
import FollowPointerCursor from "./FollowPointerCursor";

// ─── Data Model ─────────────────────────────────────────────────────
export interface WhiteboardStroke {
  id: string;
  type: "pen" | "rect" | "circle" | "line" | "text" | "image";
  points?: number[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  base64?: string;
  fontSize?: number;
  color: string;
  strokeWidth: number;
  userId: string;
  timestamp: number;
}

// Global image cache to prevent flickering and memory leaks
const imageCache = new Map<string, HTMLImageElement>();

interface ViewTransform {
  offsetX: number;
  offsetY: number;
  scale: number;
}

interface WhiteboardCanvasProps {
  yStrokes: Y.Array<WhiteboardStroke>;
  activeTool: WhiteboardTool;
  activeColor: string;
  strokeWidth: number;
  darkMode: boolean;
  userId: string;
}

// ─── Helpers ────────────────────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
}

/** Distance from point (px,py) to line segment (x1,y1)→(x2,y2) */
function pointToSegmentDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

/** Hit-test a stroke at canvas coordinates (cx, cy) */
function hitTestStroke(stroke: WhiteboardStroke, cx: number, cy: number): boolean {
  const threshold = (stroke.strokeWidth / 2) + 6;

  switch (stroke.type) {
    case "pen": {
      if (!stroke.points || stroke.points.length < 2) return false;
      for (let i = 0; i < stroke.points.length - 2; i += 2) {
        const dist = pointToSegmentDist(
          cx, cy,
          stroke.points[i], stroke.points[i + 1],
          stroke.points[i + 2], stroke.points[i + 3]
        );
        if (dist < threshold) return true;
      }
      return false;
    }
    case "line": {
      if (stroke.x == null || stroke.y == null || stroke.width == null || stroke.height == null) return false;
      const dist = pointToSegmentDist(cx, cy, stroke.x, stroke.y, stroke.x + stroke.width, stroke.y + stroke.height);
      return dist < threshold;
    }
    case "rect": {
      if (stroke.x == null || stroke.y == null || stroke.width == null || stroke.height == null) return false;
      const sx = Math.min(stroke.x, stroke.x + stroke.width);
      const sy = Math.min(stroke.y, stroke.y + stroke.height);
      const sw = Math.abs(stroke.width);
      const sh = Math.abs(stroke.height);
      // Check if near any of the 4 edges
      const edges: [number, number, number, number][] = [
        [sx, sy, sx + sw, sy],
        [sx + sw, sy, sx + sw, sy + sh],
        [sx + sw, sy + sh, sx, sy + sh],
        [sx, sy + sh, sx, sy],
      ];
      for (const [x1, y1, x2, y2] of edges) {
        if (pointToSegmentDist(cx, cy, x1, y1, x2, y2) < threshold) return true;
      }
      return false;
    }
    case "circle": {
      if (stroke.x == null || stroke.y == null || stroke.radius == null) return false;
      const dist = Math.abs(Math.hypot(cx - stroke.x, cy - stroke.y) - stroke.radius);
      return dist < threshold;
    }
    case "text": {
      if (stroke.x == null || stroke.y == null || !stroke.text) return false;
      const fontSize = stroke.fontSize || 16;
      const textWidth = stroke.text.length * fontSize * 0.6;
      const textHeight = fontSize * 1.2;
      return (
        cx >= stroke.x - 4 &&
        cx <= stroke.x + textWidth + 4 &&
        cy >= stroke.y - textHeight &&
        cy <= stroke.y + 4
      );
    }
    case "image": {
      if (stroke.x == null || stroke.y == null || stroke.width == null || stroke.height == null) return false;
      return (
        cx >= stroke.x &&
        cx <= stroke.x + stroke.width &&
        cy >= stroke.y &&
        cy <= stroke.y + stroke.height
      );
    }
    default:
      return false;
  }
}

// ─── Drawing Functions ──────────────────────────────────────────────

function drawStroke(ctx: CanvasRenderingContext2D, stroke: WhiteboardStroke) {
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineWidth = stroke.strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  switch (stroke.type) {
    case "pen": {
      if (!stroke.points || stroke.points.length < 4) return;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0], stroke.points[1]);
      for (let i = 2; i < stroke.points.length; i += 2) {
        ctx.lineTo(stroke.points[i], stroke.points[i + 1]);
      }
      ctx.stroke();
      break;
    }
    case "line": {
      if (stroke.x == null || stroke.y == null || stroke.width == null || stroke.height == null) return;
      ctx.beginPath();
      ctx.moveTo(stroke.x, stroke.y);
      ctx.lineTo(stroke.x + stroke.width, stroke.y + stroke.height);
      ctx.stroke();
      break;
    }
    case "rect": {
      if (stroke.x == null || stroke.y == null || stroke.width == null || stroke.height == null) return;
      ctx.beginPath();
      ctx.rect(stroke.x, stroke.y, stroke.width, stroke.height);
      ctx.stroke();
      break;
    }
    case "circle": {
      if (stroke.x == null || stroke.y == null || stroke.radius == null) return;
      ctx.beginPath();
      ctx.arc(stroke.x, stroke.y, Math.abs(stroke.radius), 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "text": {
      if (stroke.x == null || stroke.y == null || !stroke.text) return false;
      const fontSize = stroke.fontSize || 16;
      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.fillText(stroke.text, stroke.x, stroke.y);
      break;
    }
    case "image": {
      if (stroke.x == null || stroke.y == null || stroke.width == null || stroke.height == null || !stroke.base64) return;
      let img = imageCache.get(stroke.id);
      if (!img) {
        img = new Image();
        img.src = stroke.base64;
        img.onload = () => {
          // Dispatch event to trigger a re-render once the image loads
          window.dispatchEvent(new Event("whiteboard-render"));
        };
        imageCache.set(stroke.id, img);
      }
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, stroke.x, stroke.y, stroke.width, stroke.height);
      }
      break;
    }
  }
}

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, transform: ViewTransform, darkMode: boolean) {
  const gridSize = 30;
  const color = darkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)";

  ctx.save();
  ctx.fillStyle = color;

  // Calculate grid range in canvas space
  const startX = Math.floor(-transform.offsetX / transform.scale / gridSize) * gridSize;
  const startY = Math.floor(-transform.offsetY / transform.scale / gridSize) * gridSize;
  const endX = startX + (width / transform.scale) + gridSize * 2;
  const endY = startY + (height / transform.scale) + gridSize * 2;

  ctx.beginPath();
  for (let x = startX; x <= endX; x += gridSize) {
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.moveTo(x, y);
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    }
  }
  ctx.fill();
  ctx.restore();
}

// ─── Component ──────────────────────────────────────────────────────

export default function WhiteboardCanvas({
  yStrokes,
  activeTool,
  activeColor,
  strokeWidth,
  darkMode,
  userId,
}: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLDivElement>(null);

  const [transform, setTransform] = useState<ViewTransform>({ offsetX: 0, offsetY: 0, scale: 1 });
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Liveblocks Presence
  const [{ cursor }, updateMyPresence] = useMyPresence();
  const others = useOthers();
  const othersRef = useRef(others);
  othersRef.current = others;

  // Drawing state refs (avoid re-renders during drawing)
  const isDrawing = useRef(false);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const currentPoints = useRef<number[]>([]);
  const drawStart = useRef({ x: 0, y: 0 });
  const previewStroke = useRef<WhiteboardStroke | null>(null);
  const spaceHeld = useRef(false);
  const strokesCache = useRef<WhiteboardStroke[]>([]);

  // ─── Coordinate conversion ─────────────────────────────────
  const screenToCanvas = useCallback((screenX: number, screenY: number): [number, number] => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return [0, 0];
    const t = transformRef.current;
    const cx = (screenX - rect.left - t.offsetX) / t.scale;
    const cy = (screenY - rect.top - t.offsetY) / t.scale;
    return [cx, cy];
  }, []);

  const updateOffscreenCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement("canvas");
    }
    const offCanvas = offscreenCanvasRef.current;
    offCanvas.width = canvas.width;
    offCanvas.height = canvas.height;

    const ctx = offCanvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const t = transformRef.current;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = darkMode ? "#000000" : "#f5f5f5";
    ctx.fillRect(0, 0, w, h);

    ctx.setTransform(dpr * t.scale, 0, 0, dpr * t.scale, dpr * t.offsetX, dpr * t.offsetY);
    drawGrid(ctx, w, h, t, darkMode);

    const strokes = strokesCache.current;
    for (let i = 0; i < strokes.length; i++) {
      drawStroke(ctx, strokes[i]);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, [darkMode]);

  // ─── Full render ───────────────────────────────────────────
  const renderAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const t = transformRef.current;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (offscreenCanvasRef.current) {
      ctx.drawImage(offscreenCanvasRef.current, 0, 0);
    }

    ctx.setTransform(dpr * t.scale, 0, 0, dpr * t.scale, dpr * t.offsetX, dpr * t.offsetY);
    if (previewStroke.current) {
      drawStroke(ctx, previewStroke.current);
    }
    
    othersRef.current.forEach((other) => {
      if (other.presence?.currentStroke) {
        drawStroke(ctx, other.presence.currentStroke as WhiteboardStroke);
      }
    });

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  // ─── Sync strokes cache from Yjs ──────────────────────────
  useEffect(() => {
    const updateCache = () => {
      strokesCache.current = yStrokes.toArray();
      updateOffscreenCanvas();
      renderAll();
    };
    updateCache();
    yStrokes.observe(updateCache);
    return () => yStrokes.unobserve(updateCache);
  }, [yStrokes, updateOffscreenCanvas, renderAll]);

  // ─── Resize canvas ────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !container) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      canvas.style.width = container.clientWidth + "px";
      canvas.style.height = container.clientHeight + "px";
      updateOffscreenCanvas();
      renderAll();
    };

    const observer = new ResizeObserver(() => {
      resize();
    });
    
    observer.observe(container);
    // Also do an initial resize
    resize();

    return () => {
      observer.disconnect();
    };
  }, [updateOffscreenCanvas, renderAll]);

  // Re-render when darkMode or transform changes
  useEffect(() => { 
    updateOffscreenCanvas();
    renderAll(); 
  }, [darkMode, transform, updateOffscreenCanvas, renderAll]);

  // Re-render when other users' presence changes (e.g. they are drawing a stroke)
  useEffect(() => {
    renderAll();
  }, [others, renderAll]);

  // ─── Custom render trigger (for async image loading) ────────
  useEffect(() => {
    const onCustomRender = () => {
      updateOffscreenCanvas();
      renderAll();
    };
    window.addEventListener("whiteboard-render", onCustomRender);
    return () => window.removeEventListener("whiteboard-render", onCustomRender);
  }, [updateOffscreenCanvas, renderAll]);

  // ─── Image Pasting ────────────────────────────────────────
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target?.result as string;
              const img = new Image();
              img.onload = () => {
                const rect = canvasRef.current?.getBoundingClientRect();
                if (!rect) return;
                const t = transformRef.current;
                
                // Paste at the center of the current view
                const cx = (rect.width / 2 - t.offsetX) / t.scale;
                const cy = (rect.height / 2 - t.offsetY) / t.scale;
                
                let w = img.width;
                let h = img.height;
                const maxW = 600;
                if (w > maxW) {
                  h = (maxW / w) * h;
                  w = maxW;
                }

                const stroke: WhiteboardStroke = {
                  id: generateId(),
                  type: "image",
                  x: cx - w / 2,
                  y: cy - h / 2,
                  width: w,
                  height: h,
                  base64,
                  color: "#000",
                  strokeWidth: 1,
                  userId,
                  timestamp: Date.now(),
                };
                yStrokes.push([stroke]);
              };
              img.src = base64;
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [yStrokes, userId]);

  // ─── Keyboard: Space for pan ──────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !spaceHeld.current) {
        spaceHeld.current = true;
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceHeld.current = false;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // ─── Pointer handlers ─────────────────────────────────────

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const [cx, cy] = screenToCanvas(e.clientX, e.clientY);
    updateMyPresence({ cursor: { x: cx, y: cy } });

    // Pan mode: space held, middle button, or pan tool
    if (spaceHeld.current || e.button === 1 || activeTool === "pan") {
      isPanning.current = true;
      panStart.current = { x: e.clientX - transformRef.current.offsetX, y: e.clientY - transformRef.current.offsetY };
      canvas.style.cursor = "grabbing";
      return;
    }

    // Eraser
    if (activeTool === "eraser") {
      const strokes = strokesCache.current;
      for (let i = strokes.length - 1; i >= 0; i--) {
        if (hitTestStroke(strokes[i], cx, cy)) {
          yStrokes.delete(i, 1);
          break;
        }
      }
      return;
    }

    // Text tool
    if (activeTool === "text") {
      showTextInput(cx, cy);
      return;
    }

    // Drawing tools
    isDrawing.current = true;
    drawStart.current = { x: cx, y: cy };
    currentPoints.current = [cx, cy];
    canvas.setPointerCapture(e.pointerId);
  }, [activeTool, screenToCanvas, yStrokes]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const [cx, cy] = screenToCanvas(e.clientX, e.clientY);
    updateMyPresence({ cursor: { x: cx, y: cy } });

    // Panning
    if (isPanning.current) {
      setTransform({
        ...transformRef.current,
        offsetX: e.clientX - panStart.current.x,
        offsetY: e.clientY - panStart.current.y,
      });
      return;
    }

    if (!isDrawing.current) return;

    if (activeTool === "pen") {
      currentPoints.current.push(cx, cy);
      previewStroke.current = {
        id: "preview",
        type: "pen",
        points: [...currentPoints.current],
        color: activeColor,
        strokeWidth,
        userId,
        timestamp: Date.now(),
      };
    } else if (activeTool === "rect") {
      previewStroke.current = {
        id: "preview",
        type: "rect",
        x: drawStart.current.x,
        y: drawStart.current.y,
        width: cx - drawStart.current.x,
        height: cy - drawStart.current.y,
        color: activeColor,
        strokeWidth,
        userId,
        timestamp: Date.now(),
      };
    } else if (activeTool === "circle") {
      const radius = Math.hypot(cx - drawStart.current.x, cy - drawStart.current.y);
      previewStroke.current = {
        id: "preview",
        type: "circle",
        x: drawStart.current.x,
        y: drawStart.current.y,
        radius,
        color: activeColor,
        strokeWidth,
        userId,
        timestamp: Date.now(),
      };
    } else if (activeTool === "line") {
      previewStroke.current = {
        id: "preview",
        type: "line",
        x: drawStart.current.x,
        y: drawStart.current.y,
        width: cx - drawStart.current.x,
        height: cy - drawStart.current.y,
        color: activeColor,
        strokeWidth,
        userId,
        timestamp: Date.now(),
      };
    }

    updateMyPresence({ currentStroke: previewStroke.current });
    renderAll();
  }, [activeTool, activeColor, strokeWidth, userId, screenToCanvas, renderAll, updateMyPresence]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isPanning.current) {
      isPanning.current = false;
      canvas.style.cursor = "";
      return;
    }

    if (!isDrawing.current) return;
    isDrawing.current = false;

    // Commit the preview stroke to Yjs
    if (previewStroke.current) {
      const committed: WhiteboardStroke = {
        ...previewStroke.current,
        id: generateId(),
      };
      yStrokes.push([committed]);
      previewStroke.current = null;
    }

    updateMyPresence({ currentStroke: null });
    canvas.releasePointerCapture(e.pointerId);
  }, [yStrokes, updateMyPresence]);

  const handlePointerLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  // ─── Zoom & Pan (wheel) ──────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      const t = transformRef.current;
      const rect = canvas.getBoundingClientRect();

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (e.ctrlKey || e.metaKey) {
        // Pinch-to-zoom or Ctrl+Scroll
        const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
        // Adjust zoom speed for smoother pinch
        const zoomFactor = Math.exp(-delta * 0.01);
        const newScale = Math.max(0.1, Math.min(5, t.scale * zoomFactor));

        // Zoom toward cursor
        const newOffsetX = mouseX - ((mouseX - t.offsetX) / t.scale) * newScale;
        const newOffsetY = mouseY - ((mouseY - t.offsetY) / t.scale) * newScale;

        setTransform({ offsetX: newOffsetX, offsetY: newOffsetY, scale: newScale });
      } else {
        // Two-finger pan (scroll)
        setTransform({
          offsetX: t.offsetX - e.deltaX,
          offsetY: t.offsetY - e.deltaY,
          scale: t.scale,
        });
      }
    };

    canvas.addEventListener("wheel", handleNativeWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleNativeWheel);
  }, []);

  // ─── Text input overlay ───────────────────────────────────
  const showTextInput = useCallback((cx: number, cy: number) => {
    const container = containerRef.current;
    if (!container) return;

    const t = transformRef.current;
    // Convert canvas coords to screen position relative to container
    const screenX = cx * t.scale + t.offsetX;
    const screenY = cy * t.scale + t.offsetY;

    // Create contenteditable overlay
    const input = document.createElement("div");
    input.contentEditable = "true";
    input.className = "wb-text-input";
    input.style.left = screenX + "px";
    input.style.top = screenY + "px";
    input.style.fontSize = "16px";
    input.style.color = activeColor;
    input.style.minWidth = "40px";
    input.style.minHeight = "24px";

    const commitText = () => {
      const text = input.innerText.trim();
      if (text) {
        const stroke: WhiteboardStroke = {
          id: generateId(),
          type: "text",
          x: cx,
          y: cy,
          text,
          fontSize: 16,
          color: activeColor,
          strokeWidth: 1,
          userId,
          timestamp: Date.now(),
        };
        yStrokes.push([stroke]);
      }
      if (input.parentNode) input.parentNode.removeChild(input);
    };

    input.addEventListener("blur", commitText);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        input.blur();
      }
      if (e.key === "Escape") {
        input.innerText = "";
        input.blur();
      }
    });

    container.appendChild(input);
    // Focus after a tick so the browser registers the element
    requestAnimationFrame(() => input.focus());
  }, [activeColor, userId, yStrokes]);

  // ─── Cursor style ─────────────────────────────────────────
  const getCursor = (): string => {
    if (activeTool === "pan" || spaceHeld.current) return "grab";
    if (activeTool === "eraser") return "crosshair";
    if (activeTool === "text") return "text";
    return "crosshair";
  };

  return (
    <div ref={containerRef} className="wb-canvas-container" style={{ cursor: getCursor() }}>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className="wb-canvas"
      />
      
      {/* Render Live Cursors (Transform-aware) */}
      {others.map(({ connectionId, presence, info }) => {
        if (!presence?.cursor || presence.cursor.x == null || presence.cursor.y == null) return null;

        // Convert canvas coordinates back to screen coordinates for the absolute div
        const screenX = presence.cursor.x * transform.scale + transform.offsetX;
        const screenY = presence.cursor.y * transform.scale + transform.offsetY;

        return (
          <FollowPointerCursor
            key={connectionId}
            info={info as any}
            x={screenX}
            y={screenY}
          />
        );
      })}

    </div>
  );
}
