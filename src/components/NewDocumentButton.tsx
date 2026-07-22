"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SpinnerComp from "./ui/SpinnerComp";
import { createNewDocument } from "../../actions/actions";
import React from "react";
import { toast } from "sonner";
import { useViewMode } from "../lib/ViewModeContext";

const NewDocumentButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { viewMode } = useViewMode();
  const isWhiteboard = viewMode === "whiteboard";

  const handleCreateDocument = async () => {
    setIsLoading(true);
    try {
      const docId = await createNewDocument();
      toast.success(isWhiteboard ? "Whiteboard created successfully" : "Document created successfully");
      router.push(`/dashboard/doc/${docId}`);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <div className="p-[1px] relative">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg" />
      <button
        onClick={handleCreateDocument}
        disabled={isLoading}
        className="px-8 py-2 bg-white dark:bg-black rounded-[6px] relative group transition duration-200 text-gray-900 dark:text-white hover:text-white hover:bg-transparent w-full"
      >
        {isLoading ? (
          <SpinnerComp twclasses="!w-4 !h-4" />
        ) : (
          <span>{isWhiteboard ? "New Whiteboard" : "New Document"}</span>
        )}
      </button>
    </div>
  );
};

export default NewDocumentButton;
