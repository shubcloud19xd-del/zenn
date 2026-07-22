"use client";

import React from "react";
import NewDocumentButton from "../../components/NewDocumentButton";
import { FileText, PenTool } from "lucide-react";
import { motion } from "framer-motion";
import { useViewMode } from "../../lib/ViewModeContext";

function DashboardPage() {
  const { viewMode } = useViewMode();
  const isWhiteboard = viewMode === "whiteboard";

  return (
    <div className="w-full h-full min-h-[80vh] flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center max-w-md text-center space-y-8"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full" />
          <div className="relative w-24 h-24 bg-white dark:bg-black rounded-[2rem] flex items-center justify-center shadow-xl border border-gray-200 dark:border-gray-800 transition-colors duration-300">
            {isWhiteboard ? (
              <PenTool className="w-10 h-10 text-primary" strokeWidth={1.5} />
            ) : (
              <FileText className="w-10 h-10 text-primary" strokeWidth={1.5} />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-tt-travels font-bold tracking-tight text-gray-900 dark:text-white transition-colors duration-300">
            Welcome to <span className="text-primary">Zen{isWhiteboard ? "Board" : "Notes"}</span>
          </h1>
          <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 font-light leading-relaxed">
            Create a new {isWhiteboard ? "whiteboard" : "document"} to start collaborating, or select an existing one from the sidebar.
          </p>
        </div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full pt-2"
        >
          <NewDocumentButton />
        </motion.div>
      </motion.div>
    </div>
  );
}

export default DashboardPage;
