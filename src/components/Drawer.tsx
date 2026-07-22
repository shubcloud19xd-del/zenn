"use client";
import React, { useEffect, useState } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import NewDocumentButton from "./NewDocumentButton";
import { useUser } from "@clerk/nextjs";
import { collection, query, where, documentId, onSnapshot, limit, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import { DocumentData } from "firebase-admin/firestore";
import { CiFileOn } from "react-icons/ci";
import { Link } from "lucide-react";
import { cn } from "../lib/utils";
import { ROLES, Role } from "../lib/roles";
import { Sidebar } from "./ui/sidebar";
import { chunk } from "../lib/chunk";

interface RoomDocument extends DocumentData {
  userId: string;
  role: Role;
  createdAt: string;
  roomId: string;
}

export function Drawer({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [groupedData, setGroupedData] = useState<{
    owner: RoomDocument[];
    editor: RoomDocument[];
  }>({ owner: [], editor: [] });
  const [data, loading] = useCollection(
    user &&
      query(
        collection(db, "users", user.emailAddresses[0].emailAddress, "rooms"),
        orderBy("createdAt", "desc"),
        limit(20)
      )
  );

  const [titles, setTitles] = useState<Record<string, string>>({});

  // Changes everytime Data gets updated
  useEffect(() => {
    if (!data) return;
    const grouped = data?.docs.reduce<{
      owner: RoomDocument[];
      editor: RoomDocument[];
    }>(
      (acc, curr) => {
        const roomData = curr.data() as RoomDocument;
        if (roomData.role === ROLES.OWNER) {
          acc.owner.push({
            id: curr.id,
            ...roomData,
          });
        } else {
          acc.editor.push({
            id: curr.id,
            ...roomData,
          });
        }
        return acc;
      },
      {
        owner: [],
        editor: [],
      }
    );
    const getSortTime = (dateVal: any) => {
      if (!dateVal) return 0;
      if (dateVal.seconds) return dateVal.seconds * 1000;
      if (typeof dateVal.toDate === 'function') return dateVal.toDate().getTime();
      return new Date(dateVal).getTime();
    };

    grouped.owner.sort((a, b) => getSortTime(b.createdAt) - getSortTime(a.createdAt));
    grouped.editor.sort((a, b) => getSortTime(b.createdAt) - getSortTime(a.createdAt));

    setGroupedData(grouped);

    // 🔒 Batch listeners for titles (Firebase limits 'in' to 30)
    const roomIds = data.docs.map((doc) => doc.id);
    if (roomIds.length === 0) return;

    const unsubs = chunk(roomIds, 30).map((chunkIds) => {
      const q = query(collection(db, "documents"), where(documentId(), "in", chunkIds));
      return onSnapshot(q, (snap) => {
        setTitles((prev) => {
          const next = { ...prev };
          snap.docs.forEach((d) => {
            next[d.id] = d.data().title;
          });
          return next;
        });
      });
    });

    return () => unsubs.forEach((unsub) => unsub());
  }, [data]);

  return (
    <div
      className={cn(
        "flex bg-gray-100 dark:bg-black flex-1 w-full",
        "h-full overflow-hidden relative"
      )}
    >
      {/* Sidebar overlays content — always hover-to-expand */}
      <Sidebar
        links={[
          ...groupedData.owner.map((doc, i) => ({
            label: titles[doc.roomId] === undefined ? "Loading..." : titles[doc.roomId] || "Untitled Document",
            href: `/dashboard/doc/${doc.roomId}`,
            icon: <CiFileOn className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
            roomId: doc.roomId,
            isShared: false,
          })),
          ...groupedData.editor.map((doc, i) => ({
            label: titles[doc.roomId] === undefined ? "Loading..." : titles[doc.roomId] || "Untitled Document",
            href: `/dashboard/doc/${doc.roomId}`,
            icon: <Link className="text-neutral-700 dark:text-neutral-200 h-4 w-4 flex-shrink-0" />,
            roomId: doc.roomId,
            isShared: true,
          })),
        ]}
      />

      {/* Main content — fills 100% width, sidebar overlays on top */}
      <div className="flex-1 flex flex-col overflow-hidden w-full dark:bg-black">
        {children}
      </div>
    </div>
  );
}