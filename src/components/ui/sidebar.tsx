"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { createNewDocument } from "../../../actions/actions";
import { useViewMode } from "../../lib/ViewModeContext";
import SpinnerComp from "./SpinnerComp";

interface SidebarLink {
  label: string;
  href: string;
  icon?: React.ReactNode;
  roomId?: string;
  isShared?: boolean;
}

interface SidebarProps {
  links: SidebarLink[];
}

import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { Edit2, Trash2, Plus } from "lucide-react";
import DeleteDocumentButton from "../DeleteDocumentButton";

function SidebarLinkItem({ link, open }: { link: SidebarLink; open: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const pathname = usePathname();
  const isActive = pathname === link.href;

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditValue(link.label);
    setIsEditing(true);
  };

  const handleSave = async (e?: React.FocusEvent | React.KeyboardEvent) => {
    if (e && 'key' in e && e.key !== 'Enter') return;
    
    setIsEditing(false);
    if (editValue.trim() && editValue !== link.label && link.roomId) {
      await updateDoc(doc(db, "documents", link.roomId), {
        title: editValue,
      });
    }
  };

  return (
    <Link
      href={link.href}
      className={`group flex items-center justify-between px-2 py-2 rounded transition-colors duration-200 ${
        isActive 
          ? "bg-neutral-200 dark:bg-purple-900/40 text-black dark:text-purple-100 font-medium" 
          : "hover:bg-neutral-100 dark:hover:bg-purple-950 text-neutral-700 dark:text-neutral-300"
      }`}
    >
      <div className="flex items-center gap-2 overflow-hidden flex-1">
        {link.icon && <span className="shrink-0">{link.icon}</span>}
        {open && (
          isEditing ? (
            <input
              type="text"
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleSave}
              onClick={(e) => e.preventDefault()}
              className="flex-1 bg-white dark:bg-neutral-900 border dark:border-neutral-700 rounded px-1 py-0.5 text-sm w-full outline-none"
            />
          ) : (
            <span className="truncate">{link.label}</span>
          )
        )}
      </div>
      {open && !isEditing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleEdit}
            className="p-1 hover:bg-neutral-300 dark:hover:bg-purple-800 rounded"
          >
            <Edit2 className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
          </button>
          <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <DeleteDocumentButton 
              roomId={link.roomId} 
              triggerContent={
                <button className="p-1 hover:bg-red-200 dark:hover:bg-red-900 rounded">
                  <Trash2 className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                </button>
              } 
            />
          </div>
        </div>
      )}
    </Link>
  );
}

export const Sidebar: React.FC<SidebarProps> = ({ links }) => {
  const [hovered, setHovered] = useState(false);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const { viewMode } = useViewMode();
  const isWhiteboard = viewMode === "whiteboard";
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Don't close sidebar if a dialog/modal is open — clicking inside the
      // portal (e.g. "Yes, Delete it") fires mousedown outside sidebarRef,
      // which would unmount DeleteDocumentButton before the click handler fires.
      if (document.querySelector('[role="dialog"]')) return;
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setHovered(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleCreateDocument = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCreating(true);
    try {
      const docId = await createNewDocument();
      toast.success(isWhiteboard ? "Whiteboard created successfully" : "Document created successfully");
      router.push(`/dashboard/doc/${docId}`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const filteredLinks = links.filter(link =>
    link.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside
      ref={sidebarRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setHovered(true)}
      className={`relative shrink-0 h-full z-30 flex flex-col overflow-hidden transition-all duration-300 border-r ${
        hovered
          ? "w-64 bg-neutral-100 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 shadow-xl"
          : "w-12 bg-neutral-100/80 dark:bg-neutral-950/80 border-transparent"
      }`}
    >
      {/* Collapsed: show just icons */}
      {!hovered && (
        <nav className="flex-1 px-1.5 py-2 overflow-hidden">
          {filteredLinks.map(link => (
            <SidebarLinkItem key={link.href} link={link} open={false} />
          ))}
        </nav>
      )}

      {/* Expanded: show full sidebar */}
      {hovered && (
        <>
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-lg font-bold">Notes</span>
            <button 
              onClick={handleCreateDocument}
              disabled={isCreating}
              className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md transition-colors"
              title="New Document"
            >
              {isCreating ? <SpinnerComp twclasses="!w-4 !h-4" /> : <Plus className="w-5 h-5 text-neutral-500 hover:text-black dark:hover:text-white" />}
            </button>
          </div>

          <div className="px-4 py-2">
            <input
              type="text"
              placeholder="Search notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <nav className="flex-1 px-2 py-2 overflow-y-auto">
            {filteredLinks.length === 0 ? (
              <div className="text-neutral-500 px-2 py-2">No notes found.</div>
            ) : (
              filteredLinks.map(link => (
                <SidebarLinkItem key={link.href} link={link} open={true} />
              ))
            )}
          </nav>
        </>
      )}

      <div id="sidebar-presence-portal" className={hovered ? "block" : "hidden"} />
    </aside>
  );
};
