"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useOthers, useSelf, useStatus, useRoom } from "@liveblocks/react/suspense";
import Image from "next/image";
import { useCollection } from "react-firebase-hooks/firestore";
import { collectionGroup, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import InviteUserButton from "./InviteUserButton";
import { Plus } from "lucide-react";

export default function SidebarPresence() {
  const others = useOthers();
  const currentUser = useSelf();
  const status = useStatus();
  const room = useRoom();
  
  const [usersInRoom] = useCollection(
    query(collectionGroup(db, "rooms"), where("roomId", "==", room.id))
  );

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const portalTarget = document.getElementById("sidebar-presence-portal");
  if (!portalTarget) return null;

  const renderStatusDot = (isOnline: boolean, isCurrentUser: boolean = false) => {
    let colorClass = isOnline ? "bg-green-500" : "bg-red-500";
    let title = isOnline ? "Connected" : "Offline";

    if (isCurrentUser) {
      colorClass = status === 'connected' ? 'bg-green-500' : 
                   status === 'reconnecting' ? 'bg-yellow-500' : 'bg-red-500';
      title = `Connection Status: ${status}`;
    }

    return (
      <div 
        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-neutral-950 ${colorClass}`}
        title={title}
      />
    );
  };

  // We want to list all users who have access to this room, using Firebase as the source of truth
  const allUsers = usersInRoom?.docs.map(doc => doc.data()) || [];
  
  // Create a map of connected users by email for easy lookup
  const onlineUsersByEmail = new Map();
  others.forEach(other => {
    if (other.info?.email) {
      onlineUsersByEmail.set(other.info.email, other);
    }
  });

  return createPortal(
    <div className="border-t border-neutral-200 dark:border-neutral-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">People</h3>
        {allUsers.length <= 1 && (
          <InviteUserButton 
            triggerContent={
              <button className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors group">
                <Plus className="w-4 h-4 text-neutral-500 group-hover:text-black dark:group-hover:text-white" />
              </button>
            } 
          />
        )}
      </div>
      
      <div className="flex flex-col gap-3 max-h-[30vh] overflow-y-auto pr-2">
        {currentUser && currentUser.info && (
          <div className="flex items-center gap-3">
            <div className="relative">
              {currentUser.info.avatar ? (
                <Image
                  src={currentUser.info.avatar}
                  alt={currentUser.info.name || "You"}
                  width={32}
                  height={32}
                  className="rounded-full w-8 h-8 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                  {currentUser.info.name?.charAt(0) || "U"}
                </div>
              )}
              {renderStatusDot(true, true)}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-none truncate w-32">{currentUser.info.name}</span>
              <span className="text-xs text-neutral-500 mt-1">You</span>
            </div>
          </div>
        )}

        {allUsers.map((firebaseUser, index) => {
          const email = firebaseUser.userId;
          // Skip if this is the current user (already rendered)
          if (currentUser?.info?.email === email) return null;

          const onlineUser = onlineUsersByEmail.get(email);
          const isOnline = !!onlineUser;
          
          // Use Liveblocks info if online, otherwise fallback to just the email display
          const displayName = isOnline ? onlineUser.info?.name : email.split('@')[0];
          const displayAvatar = isOnline ? onlineUser.info?.avatar : null;
          const role = firebaseUser.role || "Viewer";

          return (
            <div key={`${email}-${index}`} className="flex items-center gap-3 opacity-90 hover:opacity-100 transition-opacity">
              <div className="relative shrink-0">
                {displayAvatar ? (
                  <Image
                    src={displayAvatar}
                    alt={displayName || "User"}
                    width={32}
                    height={32}
                    className="rounded-full w-8 h-8 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">
                    {displayName?.charAt(0).toUpperCase() || "A"}
                  </div>
                )}
                {renderStatusDot(isOnline, false)}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium leading-none truncate w-full" title={email}>
                  {displayName}
                </span>
                <span className="text-xs text-neutral-500 mt-1 capitalize">{role}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>,
    portalTarget
  );
}
