"use client";

import { useEffect, useState } from "react";
import { useRoom } from "@liveblocks/react/suspense";
import { useTheme } from "next-themes";
import * as Y from "yjs";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import DocumentTopbar from "./DocumentTopbar";
import dynamic from "next/dynamic";
import { useViewMode } from "../lib/ViewModeContext";
import SidebarPresence from "./SidebarPresence";

const DynamicEditor = dynamic<{ doc: Y.Doc; provider: any; darkMode: boolean }>(
  () => import("./Editor"),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 w-full h-full min-h-[60vh] flex flex-col pt-24 px-8 md:px-16 animate-pulse">
        <div className="w-1/3 max-w-sm h-8 bg-neutral-200 dark:bg-neutral-800/50 rounded-md mb-6"></div>
        <div className="w-3/4 h-4 bg-neutral-100 dark:bg-neutral-900/50 rounded-md mb-3"></div>
        <div className="w-2/3 h-4 bg-neutral-100 dark:bg-neutral-900/50 rounded-md mb-3"></div>
        <div className="w-1/2 h-4 bg-neutral-100 dark:bg-neutral-900/50 rounded-md"></div>
      </div>
    ),
  }
);

const DynamicWhiteboard = dynamic<{ doc: Y.Doc; provider: any; darkMode: boolean }>(
  () => import("./Whiteboard"),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 w-full h-full min-h-[60vh] flex flex-col pt-24 px-8 md:px-16 animate-pulse">
        <div className="w-1/3 max-w-sm h-8 bg-neutral-200 dark:bg-neutral-800/50 rounded-md mb-6"></div>
        <div className="w-3/4 h-4 bg-neutral-100 dark:bg-neutral-900/50 rounded-md mb-3"></div>
        <div className="w-2/3 h-4 bg-neutral-100 dark:bg-neutral-900/50 rounded-md mb-3"></div>
        <div className="w-1/2 h-4 bg-neutral-100 dark:bg-neutral-900/50 rounded-md"></div>
      </div>
    ),
  }
);

function Document({ id }: { id: string }) {
  const room = useRoom();
  const [doc, setDoc] = useState<Y.Doc>();
  const [provider, setProvider] = useState<any>();
  const { resolvedTheme } = useTheme();
  const { viewMode, setIsDocumentOpen } = useViewMode();
  const darkMode = resolvedTheme === "dark";

  // Tell Header that a document is open (so it shows the toggle button)
  useEffect(() => {
    setIsDocumentOpen(true);
    return () => setIsDocumentOpen(false);
  }, [setIsDocumentOpen]);

  useEffect(() => {
    const yDoc = new Y.Doc();
    const yProvider = new LiveblocksYjsProvider(room, yDoc);
    setDoc(yDoc);
    setProvider(yProvider);

    return () => {
      yDoc?.destroy();
      yProvider?.destroy();
    };
  }, [room]);

  return (
    <div className="w-full h-full flex-1 overflow-hidden flex flex-col">
      <SidebarPresence />
      {viewMode === "editor" && (
        <>
          <div className="w-full px-4 lg:px-8 pt-2">
            <DocumentTopbar id={id} />
          </div>
          <hr className="w-full h-px my-2 bg-slate-300 border-0 dark:bg-slate-700" />
        </>
      )}

      {/* Content Area — controlled by navbar toggle */}
      {viewMode === "editor" ? (
        <div
          className="flex-1 w-full overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-2
        [&::-webkit-scrollbar-track]:rounded-full
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-track]:bg-slate-100
        [&::-webkit-scrollbar-thumb]:bg-slate-300
        dark:[&::-webkit-scrollbar-track]:bg-slate-700
        dark:[&::-webkit-scrollbar-thumb]:bg-slate-500"
        >
          <div className="w-full px-4 lg:px-8 xl:px-16">
            {doc && provider && (
              <DynamicEditor doc={doc} provider={provider} darkMode={darkMode} />
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 w-full h-full overflow-hidden relative">
          {doc && provider && (
            <DynamicWhiteboard doc={doc} provider={provider} darkMode={darkMode} />
          )}
        </div>
      )}
    </div>
  );
}

export default Document;