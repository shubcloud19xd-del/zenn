// Core component that receives mouse positions and renders pointer and content

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export const FollowPointer = ({
  x,
  y,
  title,
  color,
}: {
  x: number;
  y: number;
  title?: string | React.ReactNode;
  color: string;
}) => {
  return (
    <AnimatePresence>
      <motion.div
        className="absolute flex flex-col items-start gap-1"
        style={{
          top: 0,
          left: 0,
          zIndex: 500,
          pointerEvents: "none",
        }}
        initial={{
          scale: 0.8,
          opacity: 0.7,
          x: x,
          y: y,
        }}
        animate={{
          scale: 1,
          opacity: 1,
          x: x,
          y: y,
          transition: {
            type: "spring",
            stiffness: 400,
            damping: 28,
            mass: 0.5,
          },
        }}
        exit={{
          scale: 0.7,
          opacity: 0,
        }}
      >
        <div 
          className="w-6 h-6 rounded-full shadow-lg flex items-center justify-center -ml-3 -mt-3"
          style={{
             boxShadow: `0 0 12px 2px ${color}80`,
             backgroundColor: `${color}30`
          }}
        >
          <svg
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="1"
            viewBox="0 0 24 24"
            className={`h-4 w-4 text-[${color}] transform -rotate-[70deg] stroke-[${color}] drop-shadow-lg`}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M19.082 4.182a.5.5 0 0 1 .103.557L12.528 21.467a.5.5 0 0 1-.917-.007L9.57 16.694 2.803 13.652a.5.5 0 0 1-.006-.916l14.728-6.657a.5.5 0 0 1 .556.103z" fill="#fff" />
          </svg>
        </div>
        
        <motion.div
          style={{
            backgroundColor: color,
            boxShadow: `0 0 8px 2px ${color}80`,
          }}
          className={
            "px-3 py-1.5 text-white whitespace-nowrap min-w-max text-sm rounded-full font-semibold shadow-lg border border-white/20 ml-2"
          }
        >
          {title}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};