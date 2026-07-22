"use client";
import {
  ClientSideSuspense,
  RoomProvider as RoomProviderWrapper,
} from "@liveblocks/react";
import LiveCursorProvider from "./LiveCursorProvider";

function RoomProvider({
  children,
  roomId,
}: Readonly<{
  children: React.ReactNode;
  roomId: string;
}>) {
  return (
    <div className="w-full h-full flex justify-center overflow-hidden max-w-full">
      <RoomProviderWrapper key={roomId} id={roomId} initialPresence={{ cursor: null }}>
        <ClientSideSuspense fallback={
          <div className="flex-1 w-full h-full min-h-[60vh] flex flex-col pt-24 px-8 md:px-16 animate-pulse">
            <div className="w-1/3 max-w-sm h-8 bg-neutral-200 dark:bg-neutral-800/50 rounded-md mb-6"></div>
            <div className="w-3/4 h-4 bg-neutral-100 dark:bg-neutral-900/50 rounded-md mb-3"></div>
            <div className="w-2/3 h-4 bg-neutral-100 dark:bg-neutral-900/50 rounded-md mb-3"></div>
            <div className="w-1/2 h-4 bg-neutral-100 dark:bg-neutral-900/50 rounded-md"></div>
          </div>
        }>
          <LiveCursorProvider>{children}</LiveCursorProvider>
        </ClientSideSuspense>
      </RoomProviderWrapper>
    </div>
  );
}

export default RoomProvider;
