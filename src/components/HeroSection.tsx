"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import HeroDemo from "./HeroDemo";
import { useTheme } from "next-themes";
import { flushSync } from "react-dom";

gsap.registerPlugin(useGSAP);

function HeroSection() {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const svgRef = useRef<SVGPathElement>(null);
  const starRef = useRef<SVGSVGElement>(null);
  const starTween = useRef<gsap.core.Tween | null>(null);
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);
  const isTransitioningTheme = useRef(false);
  const isClickActivated = useRef(false);
  const { resolvedTheme, setTheme } = useTheme();

  useGSAP(() => {
    if (headlineRef.current) {
      const words = headlineRef.current.querySelectorAll("span.word");
      gsap.fromTo(words,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, delay: 0.2, ease: "back.out(1.7)" }
      );
    }

    if (svgRef.current) {
      gsap.to(svgRef.current, {
        strokeDashoffset: 0,
        duration: 1.5,
        ease: "power2.out",
        delay: 1.2
      });
    }

    if (starRef.current) {
      starTween.current = gsap.to(starRef.current, {
        rotation: 360,
        duration: 6,
        repeat: -1,
        ease: "linear"
      });
    }
  }, { scope: headlineRef });

  const triggerThemeTransition = (x: number, y: number) => {
    // @ts-ignore
    if (!document.startViewTransition) {
      setTheme("light");
      return;
    }
    
    document.documentElement.classList.add("theme-transitioning");

    // @ts-ignore
    const transition = document.startViewTransition(() => {
      // Instantly toggle the DOM class to bypass React's heavy synchronous re-render.
      // This eliminates the main-thread freeze and keeps the star spinning perfectly smooth!
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      document.documentElement.style.colorScheme = "light";
    });

    transition.ready.then(() => {
      // Begin the smooth deceleration precisely when the transition is fully ready to paint
      if (starTween.current) {
        gsap.to(starTween.current, { timeScale: 1, duration: 4, ease: "power2.out" });
      }

      const radius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`
          ]
        },
        {
          duration: 1000,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)"
        }
      );
      
      // Remove the lock slightly before the 1000ms animation finishes (e.g., at 850ms) 
      // so the scrollbar changes exactly as the wave touches it.
      setTimeout(() => {
        document.documentElement.classList.remove("theme-transitioning");
      }, 850);
    });

    // Quietly sync React state once the animation is completely finished
    // @ts-ignore
    transition.finished.then(() => {
      setTheme("light");
    });
  };

  const startStarAnimation = (clientX: number, clientY: number) => {
    if (resolvedTheme !== "dark") return;
    if (hoverTimer.current) return;

    gsap.to(".star-wrapper", { scale: 1.8, duration: 0.4, ease: "back.out(2)" });
    
    if (starTween.current) {
      gsap.to(starTween.current, { timeScale: 15, duration: 4, ease: "power2.in" });
    }

    hoverTimer.current = setTimeout(() => {
      isTransitioningTheme.current = true;
      requestAnimationFrame(() => triggerThemeTransition(clientX, clientY));
      setTimeout(() => {
        isTransitioningTheme.current = false;
        isClickActivated.current = false;
        
        // Reset the star to its normal state after the animation finishes
        gsap.to(".star-wrapper", { scale: 1, duration: 0.4, ease: "back.out(2)" });
        if (starTween.current) {
          gsap.to(starTween.current, { timeScale: 1, duration: 4, ease: "power2.out" });
        }
        hoverTimer.current = null;
      }, 1200);
    }, 4000);
  };

  const handleStarEnter = (e: React.MouseEvent) => {
    if (isClickActivated.current) return;
    startStarAnimation(e.clientX, e.clientY);
  };

  const handleStarLeave = () => {
    if (isTransitioningTheme.current || isClickActivated.current) return;

    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    
    gsap.to(".star-wrapper", { scale: 1, duration: 0.4, ease: "back.out(2)" });
    
    if (starTween.current) {
      gsap.to(starTween.current, { timeScale: 1, duration: 4, ease: "power2.out" });
    }
  };

  const handleStarClick = (e: React.MouseEvent | React.TouchEvent) => {
    isClickActivated.current = true;
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    startStarAnimation(clientX, clientY);
  };

  return (
    <>
      <div
        className="relative flex flex-col items-center justify-center"
        id="hero-section"
      >
        <div
          className="flex flex-col flex-1 w-full h-fit md:min-h-screen gap-8 text-center max-w-screen"
        >
          <div className="absolute inset-0 -z-10 pointer-events-none hidden dark:block">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="w-full h-full bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 animate-gradient-move"
              style={{ filter: "blur(80px)", transform: "translateZ(0)", willChange: "transform" }}
            />
          </div>
          <div className="flex items-center justify-center gap-2 flex-col z-[5] px-4 md:px-8 lg:px-16 mt-32 md:mt-40">
            <h1
              ref={headlineRef}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium leading-tight md:leading-snug text-center relative select-none"
            >
              {"Where your ideas actually".split(" ").map((word, index) => {
                if (word === "ideas") {
                  return (
                    <span key={`l1-${index}`} className="opacity-0 inline-block mr-[0.3em] word relative z-10">
                      <span 
                        className="relative inline-block cursor-pointer group"
                        onMouseEnter={handleStarEnter}
                        onMouseLeave={handleStarLeave}
                        onClick={handleStarClick}
                        onTouchStart={handleStarClick}
                      >
                        <span className="star-wrapper absolute left-1/2 -translate-x-1/2 -top-[0.05em] w-[0.4em] h-[0.4em] origin-center z-20 pointer-events-none">
                          <svg
                            ref={starRef}
                            className="w-full h-full text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                          </svg>
                        </span>
                        <span className="relative z-10">ı</span>
                      </span>
                      deas
                    </span>
                  );
                }
                return (
                  <span key={`l1-${index}`} className="opacity-0 inline-block mr-[0.3em] word relative z-10">
                    {word}
                  </span>
                );
              })}
              <br />
              <span className="relative inline-block whitespace-nowrap">
                {"take shape".split(" ").map((word, index) => (
                  <span key={`l2-${index}`} className="opacity-0 inline-block mr-[0.3em] word relative z-10">
                    {word}
                  </span>
                ))}
                <svg
                  className="absolute -bottom-3 left-0 w-full h-6 pointer-events-none overflow-visible z-0"
                  viewBox="0 0 200 20"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="svgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="50%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                  <path
                    ref={svgRef}
                    d="M 5 15 Q 50 5 100 12 T 195 10"
                    fill="none"
                    stroke="url(#svgGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    style={{ strokeDasharray: 250, strokeDashoffset: 250 }}
                  />
                </svg>
              </span>
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
              className="mt-4 text-base sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed"
            >
              Blends writing, drawing, and real-time collaboration<br />
              into a single canvas with AI built into every step
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.6 }}
              className="relative flex items-center justify-center flex-1 mt-24 md:mt-32 lg:mt-48 overflow-hidden rounded-lg shadow-lg w-full max-w-[1200px]"
            >
              <HeroDemo />

              <AnimatedAIMessage />
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}

export default HeroSection;

function AnimatedAIMessage() {
  const messages = [
    "AI is organizing your notes...",
    "Collaboration in real-time...",
    "Smart suggestions incoming...",
    "Summarizing your ideas..."
  ];
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-white/80 dark:bg-black/80 rounded-full shadow-lg text-lg font-semibold text-blue-600 dark:text-pink-400"
    >
      {messages[index]}
    </motion.div>
  );
}