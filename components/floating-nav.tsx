"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeftIcon,
  CodeBracketIcon,
  EyeIcon,
  PencilIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

interface FloatingNavProps {
  onBack: () => void;
  onInsertCode: () => void;
  onTogglePreview: () => void;
  isPreviewMode: boolean;
}

type Position = "bottom-center" | "bottom-left" | "bottom-right";

export function FloatingNav({
  onBack,
  onInsertCode,
  onTogglePreview,
  isPreviewMode,
}: FloatingNavProps) {
  const [position, setPosition] = useState<Position>("bottom-center");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const positionClasses: Record<Position, string> = {
    "bottom-center": "left-1/2 -translate-x-1/2",
    "bottom-left": "left-2 sm:left-4",
    "bottom-right": "right-2 sm:right-4",
  };

  const navContent = (
    <div
      className={cn(
        "!flex !visible fixed bottom-4 sm:bottom-6 pointer-events-auto z-[999999] max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)]",
        positionClasses[position],
      )}
      style={{
        display: "flex",
        visibility: "visible",
        opacity: 1,
      }}
      data-testid="floating-nav"
    >
      <div
        className="flex items-center gap-1 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-1.5 rounded-full shadow-2xl backdrop-blur-xl bg-white dark:bg-black border border-gray-200/60 dark:border-gray-800/60"
        style={{
          minHeight: "2.5rem",
          minWidth: "fit-content",
        }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-8 w-8 sm:h-8 sm:w-8 rounded-full hover:bg-accent transition-all duration-200 flex-shrink-0 touch-manipulation"
            >
              <ArrowLeftIcon className="h-4 w-4 sm:h-4 sm:w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Back</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onInsertCode}
              className="h-8 w-8 sm:h-8 sm:w-8 rounded-full hover:bg-accent transition-all duration-200 flex-shrink-0 touch-manipulation"
            >
              <CodeBracketIcon className="h-4 w-4 sm:h-4 sm:w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Insert Code Block</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onTogglePreview}
              className="h-8 w-8 sm:h-8 sm:w-8 rounded-full hover:bg-accent transition-all duration-200 flex-shrink-0 touch-manipulation"
            >
              {isPreviewMode ? (
                <PencilIcon className="h-4 w-4 sm:h-4 sm:w-4" />
              ) : (
                <EyeIcon className="h-4 w-4 sm:h-4 sm:w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isPreviewMode ? "Edit Mode" : "Preview Mode"}</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-px h-5 sm:h-5 bg-border/50 mx-0.5 flex-shrink-0" />

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:h-8 sm:w-8 rounded-full hover:bg-accent transition-all duration-200 flex-shrink-0 touch-manipulation"
                >
                  <Cog6ToothIcon className="h-4 w-4 sm:h-4 sm:w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => setPosition("bottom-center")}
              className={cn(
                "cursor-pointer",
                position === "bottom-center" && "bg-accent",
              )}
            >
              Position: Bottom Center
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setPosition("bottom-left")}
              className={cn(
                "cursor-pointer",
                position === "bottom-left" && "bg-accent",
              )}
            >
              Position: Bottom Left
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setPosition("bottom-right")}
              className={cn(
                "cursor-pointer",
                position === "bottom-right" && "bg-accent",
              )}
            >
              Position: Bottom Right
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  if (!mounted) return null;

  return createPortal(navContent, document.body);
}
