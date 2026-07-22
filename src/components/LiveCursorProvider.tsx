"use client";
import { useMyPresence, useOthers } from "@liveblocks/react/suspense";
import React from "react";
import FollowPointerCursor from "./FollowPointerCursor";
import { useViewMode } from "../lib/ViewModeContext";

function LiveCursorProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [, updateMyPresence] = useMyPresence();
  const others = useOthers();
  const { viewMode } = useViewMode();

  return (
    <div
      className="flex-1 w-full h-full cursor-provider relative"
      onPointerMove={(event) => {
        if (viewMode === "whiteboard") return;
        
        // Update the user cursor position on every pointer move
        const rect = event.currentTarget.getBoundingClientRect();
        updateMyPresence({
          cursor: {
            x: Math.round(event.clientX - rect.left),
            y: Math.round(event.clientY - rect.top),
          },
        });
      }}
      onPointerLeave={() => {
        if (viewMode === "whiteboard") return;
        
        // When the pointer goes out, set cursor to null
        updateMyPresence({
          cursor: null,
        })
      }}
    >
      {viewMode !== "whiteboard" && others.map(({ connectionId, info, presence }) => {
        if (presence.cursor === null) {
          return null;
        }

        return (
          <FollowPointerCursor
            key={connectionId}
            info={info as any}
            x={presence.cursor.x ?? 0}
            y={presence.cursor.y ?? 0}
          />
        );
      })}
      {children}
    </div>
  );
}

export default LiveCursorProvider;
