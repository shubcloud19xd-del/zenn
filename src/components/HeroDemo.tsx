"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { MousePointer2 } from "lucide-react";

const users = [
  {
    id: 1,
    name: "Dexter",
    avatar: "/images/toji.jpg",
  },
  {
    id: 2,
    name: "Luma",
    avatar: "/images/Paxton.jpg",
    message: "Can we adjust the color?",
  },
  {
    id: 3,
    name: "XD",
    avatar: "/images/jw.jpg",
    message: "Great Idea!",
  },
  {
    id: 4,
    name: "KAT",
    avatar: "/images/gap.jpg",
  },
];

const colors = [
  {
    foreground: "text-emerald-800",
    background: "bg-emerald-50",
    pointer: "text-emerald-500",
  },
  {
    foreground: "text-rose-800",
    background: "bg-rose-50",
    pointer: "text-rose-500",
  },
  {
    foreground: "text-sky-800",
    background: "bg-sky-50",
    pointer: "text-sky-500",
  },
  {
    foreground: "text-[#8a7213]",
    background: "bg-[#fff9e6]",
    pointer: "text-[#FFD93D]",
  },
];

// Helper function to generate random position within a quadrant
const getRandomPosition = (qx: number, qy: number) => ({
  x: Math.floor(Math.random() * 30) + (qx * 40) + 10, // keeps within 10-40 or 50-80
  y: Math.floor(Math.random() * 30) + (qy * 40) + 10,
});

export default function HeroDemo() {
  const [user1Position, setUser1Position] = useState({ x: 20, y: 30 });
  const [user2Position, setUser2Position] = useState({ x: 60, y: 20 });
  const [user3Position, setUser3Position] = useState({ x: 30, y: 70 });
  const [user4Position, setUser4Position] = useState({ x: 70, y: 60 });

  const userPositions = [user1Position, user2Position, user3Position, user4Position];

  useEffect(() => {
    const i1 = setInterval(() => setUser1Position(getRandomPosition(0, 0)), 3000);
    const i2 = setInterval(() => setUser2Position(getRandomPosition(1, 0)), 4000);
    const i3 = setInterval(() => setUser3Position(getRandomPosition(0, 1)), 2500);
    const i4 = setInterval(() => setUser4Position(getRandomPosition(1, 1)), 3500);
    return () => {
      clearInterval(i1);
      clearInterval(i2);
      clearInterval(i3);
      clearInterval(i4);
    };
  }, []);

  const usersWithPositions = users.map((user, index) => ({
    ...user,
    position: userPositions[index],
  }));

  return (
    <div className="relative w-full h-full min-h-[400px] md:min-h-[600px] bg-white dark:bg-black rounded-lg border dark:border-neutral-800 bg-[radial-gradient(var(--color-secondary),transparent_1px)] [background-size:16px_16px] overflow-hidden shadow-2xl">
      {/* Editor Screenshot */}
      <div className="absolute inset-0">
        <Image
          src="/images/lp-ss-1.png"
          width={1920}
          height={1080}
          className="w-full h-full object-cover object-top"
          alt="ZenNotes Screenshot"
        />
      </div>



      {/* Live Cursors */}
      {usersWithPositions.map((user, index) => (
        <motion.div
          key={user.id}
          className="absolute z-50 pointer-events-none"
          animate={{
            left: `${user.position.x}%`,
            top: `${user.position.y}%`,
          }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        >
          {/* Lucide MousePointer Cursor */}
          <MousePointer2
            className={cn("w-6 h-6 drop-shadow-md", colors[index % colors.length].pointer)}
            fill="currentColor"
          />
          <div
            className={cn(
              "mt-1 ml-3 px-3 py-1.5 rounded-full rounded-tl-none shadow-lg border text-xs font-semibold whitespace-nowrap flex items-center gap-2",
              colors[index % colors.length].background,
              colors[index % colors.length].foreground,
              "border-" + colors[index % colors.length].pointer.replace('text-', '')
            )}
          >
            <Image
              alt={user.name}
              className="w-4 h-4 rounded-full"
              height={16}
              src={user.avatar}
              unoptimized
              width={16}
            />
            {user.name}
          </div>
          {user.message && (
            <div className={cn(
              "mt-2 ml-3 px-3 py-2 rounded-lg rounded-tl-none shadow-lg border text-xs font-medium max-w-[200px]",
              colors[index % colors.length].background,
              colors[index % colors.length].foreground
            )}>
              {user.message}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
