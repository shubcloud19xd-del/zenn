"use client";
import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

function AnimatedFeatureAI({ title }) {
  const aiMessages = {
    "Seamless Collaboration": "Live cursors and instant sync enabled!",
    "AI Tools on the GO": "AI is summarizing your notes...",
    "Built on top tech.": "Next.js and Firestore powering real-time magic!",
    "Advanced Block-Based Editor": "Smart blocks for smarter notes!"
  };
  const [show, setShow] = useState(false);
  useEffect(() => {
    let timer;
    if (show) {
      timer = setTimeout(() => setShow(false), 2200);
    }
    return () => clearTimeout(timer);
  }, [show]);
  return (
    <motion.div
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      className="relative"
    >
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.5 }}
          className="absolute left-1/2 -translate-x-1/2 top-0 z-50 px-4 py-2 bg-white/90 dark:bg-black/90 rounded shadow text-blue-600 dark:text-pink-400 text-sm font-semibold"
        >
          {aiMessages[title]}
        </motion.div>
      )}
    </motion.div>
  );
}

export default FeaturesSection;
export function FeaturesSection() {
  const features = useMemo(() => [
    {
      title: "Infinite Whiteboard",
      description:
        "Switch to canvas mode instantly. Sketch diagrams, wireframes, or mind maps with an Excalidraw-powered whiteboard — always just one click away from your notes.",
      skeleton: <SkeletonOne />,
      className:
        "col-span-1 lg:col-span-4 border-b lg:border-r dark:border-neutral-800",
    },
    {
      title: "Your AI Thinking Partner",
      description: (
        <>
          Just type <span className="text-black dark:text-white font-medium">@Light</span> in your notes and ask anything. <span className="text-black dark:text-white font-medium">Light</span> reads your context, answers questions, summarizes ideas, and streams the response right into your document — no tab switching, ever.
        </>
      ),
      skeleton: <SkeletonTwo />,
      className: "border-b col-span-1 lg:col-span-2 dark:border-neutral-800",
    },
    {
      title: "Real-Time Collaboration",
      description:
        "Write together, think together. See your teammates' cursors live, watch edits happen as they type, and leave inline comments — all without ever leaving your note.",
      skeleton: <SkeletonThree />,
      className:
        "col-span-1 lg:col-span-3 lg:border-r  dark:border-neutral-800",
    },
    {
      title: "Advanced Block-Based Editor",
      description:
        "Structure your notes your way — headings, bullet lists, code blocks, and more. Type / to see every block type, or drag to reorder. Your notes, your structure.",
      skeleton: <SkeletonFour />,
      className: "col-span-1 lg:col-span-3 border-b lg:border-none",
    },
  ], []);
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="relative z-20 flex flex-col items-center justify-center py-10 mx-auto lg:py-40 max-w-7xl"
    >
      <div className="px-8">
        <motion.h4
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
          className="max-w-5xl mx-auto text-3xl font-medium tracking-tight text-center text-black lg:text-5xl lg:leading-tight dark:text-white"
        >
          The tools you need to think better.
        </motion.h4>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
          className="max-w-2xl mx-auto my-4 text-sm font-normal text-center lg:text-base text-neutral-500 dark:text-neutral-300"
        >
          ZenNotes AI gives you the perfect primitive for thinking: a powerful block editor for structure, and an infinite canvas for freedom. Real-time multiplayer built right in.
        </motion.p>
      </div>
      <div className="relative max-w-7xl" id="features">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.6 }}
          className="grid grid-cols-1 mt-12 rounded-md lg:grid-cols-6 xl:border dark:border-neutral-800"
        >
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.8 + idx * 0.2 }}
              className={cn(feature.className, "flex flex-col")}
            >
              <FeatureCard className="flex-1">
                <FeatureTitle>{feature.title}</FeatureTitle>
                <FeatureDescription>{feature.description}</FeatureDescription>
                <div className="w-full flex-1">{feature.skeleton}<AnimatedFeatureAI title={feature.title} /></div>
              </FeatureCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

const FeatureCard = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        `p-4 sm:p-8 relative overflow-hidden rounded-md bg-clip-padding backdrop-filter backdrop-blur-3xl bg-white dark:bg-black h-full flex flex-col`,
        className
      )}
    >
      {children}
    </div>
  );
};

const FeatureTitle = ({ children }: { children?: React.ReactNode }) => {
  return (
    <p className="max-w-5xl mx-auto text-xl tracking-tight text-left text-black dark:text-white md:text-2xl md:leading-snug">
      {children}
    </p>
  );
};

const FeatureDescription = ({ children }: { children?: React.ReactNode }) => {
  return (
    <p
      className={cn(
        "text-sm md:text-sm w-full text-left",
        "text-neutral-500 font-normal dark:text-neutral-300 my-2 leading-relaxed"
      )}
    >
      {children}
    </p>
  );
};

export const SkeletonOne = () => {
  return (
    <div className="relative flex h-full gap-10 px-2 py-8">
      <div className="w-full h-full mx-auto group">
        <div className="flex flex-col flex-1 w-full h-full">
          <Image
            src="/images/f2.png"
            alt="header"
            width={1920}
            height={1080}
            className="object-cover object-center w-full h-full rounded-lg shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
};

export const SkeletonThree = () => {
  return (
    <div className="relative flex h-96 gap-10 px-2 py-8">
      <div className="w-full h-full mx-auto group">
        <div className="flex flex-col flex-1 w-full h-full">
          <Image
            src="/images/f7.png"
            alt="header"
            width={1920}
            height={1080}
            className="object-cover object-center w-full h-full rounded-lg shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
};

export const SkeletonTwo = () => {
  return (
    <div className="relative flex h-full gap-10 px-2 py-8">
      <div className="w-full h-full mx-auto group">
        <div className="flex flex-col flex-1 w-full h-full">
          <Image
            src="/images/f6.png"
            alt="header"
            width={1920}
            height={1080}
            className="object-cover object-center w-full h-full rounded-lg shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
};

export const SkeletonFour = () => {
  return (
    <div className="relative flex h-96 gap-10 px-2 py-8">
      <div className="w-[85%] h-full mx-auto group">
        <div className="flex flex-col flex-1 w-full h-full">
          <Image
            src="/images/f5.png"
            alt="header"
            width={1920}
            height={1080}
            className="object-cover object-center w-full h-full rounded-lg shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
};