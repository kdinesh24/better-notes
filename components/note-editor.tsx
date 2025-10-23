"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import type React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Note } from "@/types/note";
import {
  ArrowLeftIcon,
  CodeBracketIcon,
  XMarkIcon,
  ChevronDownIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

interface NoteEditorProps {
  note: Note;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onClose: () => void;
}

interface ContentBlock {
  id: string;
  type: "text" | "code" | "image";
  content: string;
  language?: string;
  imageData?: { id: string; url: string; name: string };
}

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash" },
  { value: "json", label: "JSON" },
  { value: "xml", label: "XML" },
  { value: "yaml", label: "YAML" },
];

export function NoteEditor({ note, onUpdate, onClose }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [focusedBlock, setFocusedBlock] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const blockRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});
  const isInitializedRef = useRef(false);
  const cursorPositionRef = useRef<number>(0);
  const noteIdRef = useRef(note.id);

  const consolidateBlocks = useCallback(
    (blocks: ContentBlock[]): ContentBlock[] => {
      if (blocks.length === 0) {
        return [{ id: "1", type: "text", content: "" }];
      }

      const consolidated: ContentBlock[] = [];

      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];

        if (block.type === "text" && !block.content.trim()) {
          const prevBlock = consolidated[consolidated.length - 1];
          const nextBlock = blocks[i + 1];

          if (
            (prevBlock && prevBlock.type === "text") ||
            (nextBlock && nextBlock.type === "text")
          ) {
            continue;
          }
        }

        consolidated.push(block);
      }

      if (
        consolidated.length === 0 ||
        consolidated.every((block) => block.type !== "text")
      ) {
        consolidated.push({
          id: `text-${Date.now()}`,
          type: "text",
          content: "",
        });
      }

      return consolidated;
    },
    [],
  );

  const parseContentToBlocks = useCallback(
    (content: string): ContentBlock[] => {
      if (!content.trim()) {
        return [{ id: "1", type: "text", content: "" }];
      }

      const parts = content.split(
        /((?:\[CODE:[^\]]*\][\s\S]*?\[\/CODE\])|(?:\[IMAGE:\d+\]))/g,
      );
      const newBlocks: ContentBlock[] = [];
      let blockId = 1;

      parts.forEach((part) => {
        if (!part) return;

        const imageMatch = part.match(/\[IMAGE:(\d+)\]/);
        if (imageMatch) {
          const imageId = imageMatch[1];
          const image = note.images?.find((img) => img.id === imageId);
          if (image) {
            newBlocks.push({
              id: `image-${imageId}`,
              type: "image",
              content: "",
              imageData: image,
            });
          }
          return;
        }

        const codeMatch = part.match(/\[CODE:([^\]]*)\]([\s\S]*?)\[\/CODE\]/);
        if (codeMatch) {
          const [, language, code] = codeMatch;
          newBlocks.push({
            id: `code-${blockId++}`,
            type: "code",
            content: code.trim(),
            language: language || "javascript",
          });
          return;
        }

        if (part.trim()) {
          newBlocks.push({
            id: `text-${blockId++}`,
            type: "text",
            content: part,
          });
        }
      });

      return consolidateBlocks(newBlocks);
    },
    [note.images, consolidateBlocks],
  );

  useEffect(() => {
    if (note.id !== noteIdRef.current) {
      noteIdRef.current = note.id;
      setTitle(note.title);
      setBlocks(parseContentToBlocks(note.content));
      isInitializedRef.current = true;
    } else if (!isInitializedRef.current) {
      setBlocks(parseContentToBlocks(note.content));
      isInitializedRef.current = true;
    }
  }, [note.id, note.title, note.content, parseContentToBlocks]);

  useEffect(() => {
    setTimeout(() => {
      Object.entries(blockRefs.current).forEach(([, textarea]) => {
        if (textarea) {
          handleAutoResize(textarea);
        }
      });
    }, 100);
  }, [blocks.length]);

  const saveContent = useCallback(
    (newBlocks: ContentBlock[]) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        const content = newBlocks
          .map((block) => {
            switch (block.type) {
              case "code":
                return `[CODE:${block.language || "javascript"}]\n${block.content}\n[/CODE]`;
              case "image":
                return block.imageData ? `[IMAGE:${block.imageData.id}]` : "";
              case "text":
              default:
                return block.content;
            }
          })
          .join("\n\n")
          .replace(/\n{3,}/g, "\n\n");

        onUpdate(note.id, { title, content });
      }, 500);
    },
    [note.id, onUpdate, title],
  );

  useEffect(() => {
    if (isInitializedRef.current) {
      saveContent(blocks);
    }
  }, [blocks, saveContent]);

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const savedScrollPosition =
              window.pageYOffset || document.documentElement.scrollTop;

            const reader = new FileReader();
            reader.onload = (event) => {
              const imageUrl = event.target?.result as string;
              const imageId = Date.now().toString();
              const newImage = {
                id: imageId,
                url: imageUrl,
                name: `pasted-image-${imageId}.png`,
              };

              const newImages = [...(note.images || []), newImage];
              onUpdate(note.id, { images: newImages });

              const newImageBlock: ContentBlock = {
                id: `image-${imageId}`,
                type: "image",
                content: "",
                imageData: newImage,
              };

              const newTextBlockId = `text-${Date.now() + 1}`;
              const newTextBlock: ContentBlock = {
                id: newTextBlockId,
                type: "text",
                content: "",
              };

              setBlocks((prev) => {
                if (focusedBlock) {
                  const focusedIndex = prev.findIndex(
                    (block) => block.id === focusedBlock,
                  );
                  if (focusedIndex !== -1) {
                    const focusedBlockData = prev[focusedIndex];
                    const newBlocks = [...prev];

                    if (focusedBlockData.type === "text") {
                      const cursorPos = cursorPositionRef.current;
                      const content = focusedBlockData.content;

                      const beforeCursor = content.substring(0, cursorPos);
                      const afterCursor = content.substring(cursorPos);

                      if (
                        beforeCursor.trim() === "" &&
                        afterCursor.trim() === ""
                      ) {
                        newBlocks.splice(focusedIndex, 1, newImageBlock, {
                          ...newTextBlock,
                          content: afterCursor,
                        });
                      } else if (beforeCursor.trim() === "") {
                        newBlocks.splice(focusedIndex, 1, newImageBlock, {
                          ...newTextBlock,
                          content: afterCursor,
                        });
                      } else if (afterCursor.trim() === "") {
                        newBlocks[focusedIndex] = {
                          ...focusedBlockData,
                          content: beforeCursor,
                        };
                        newBlocks.splice(
                          focusedIndex + 1,
                          0,
                          newImageBlock,
                          newTextBlock,
                        );
                      } else {
                        newBlocks[focusedIndex] = {
                          ...focusedBlockData,
                          content: beforeCursor,
                        };
                        newBlocks.splice(focusedIndex + 1, 0, newImageBlock, {
                          ...newTextBlock,
                          content: afterCursor,
                        });
                      }
                    } else {
                      newBlocks.splice(
                        focusedIndex + 1,
                        0,
                        newImageBlock,
                        newTextBlock,
                      );
                    }
                    return consolidateBlocks(newBlocks);
                  }
                }
                return consolidateBlocks([
                  ...prev,
                  newImageBlock,
                  newTextBlock,
                ]);
              });

              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  window.scrollTo(0, savedScrollPosition);
                  const textarea = blockRefs.current[newTextBlockId];
                  if (textarea) {
                    textarea.focus({ preventScroll: true });
                  }
                });
              });
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    },
    [note.id, note.images, onUpdate, focusedBlock, consolidateBlocks],
  );

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);

  const insertCodeBlock = () => {
    const newBlockId = `code-${Date.now()}`;
    const newTextBlockId = `text-${Date.now() + 1}`;
    const newBlock: ContentBlock = {
      id: newBlockId,
      type: "code",
      content: "",
      language: "javascript",
    };
    const newTextBlock: ContentBlock = {
      id: newTextBlockId,
      type: "text",
      content: "",
    };

    setBlocks((prev) => {
      if (focusedBlock) {
        const focusedIndex = prev.findIndex(
          (block) => block.id === focusedBlock,
        );
        if (focusedIndex !== -1) {
          const focusedBlockData = prev[focusedIndex];
          const newBlocks = [...prev];

          if (
            focusedBlockData.type === "text" &&
            focusedBlockData.content.trim() === ""
          ) {
            newBlocks.splice(focusedIndex, 1, newBlock, newTextBlock);
          } else {
            newBlocks.splice(focusedIndex + 1, 0, newBlock, newTextBlock);
          }
          return consolidateBlocks(newBlocks);
        }
      }
      return consolidateBlocks([...prev, newBlock, newTextBlock]);
    });

    setTimeout(() => {
      const textarea = blockRefs.current[newBlockId];
      if (textarea) {
        textarea.focus();
      }
    }, 100);
  };

  const updateBlock = (blockId: string, updates: Partial<ContentBlock>) => {
    setBlocks((prev) => {
      const updated = prev.map((block) =>
        block.id === blockId ? { ...block, ...updates } : block,
      );
      return consolidateBlocks(updated);
    });
  };

  const removeBlock = (blockId: string) => {
    setBlocks((prev) => {
      const blockIndex = prev.findIndex((block) => block.id === blockId);
      const filtered = prev.filter((block) => block.id !== blockId);
      const consolidated = consolidateBlocks(filtered);

      setTimeout(() => {
        if (blockIndex > 0) {
          const prevBlock = consolidated[blockIndex - 1];
          if (prevBlock && prevBlock.type === "text") {
            const textarea = blockRefs.current[prevBlock.id];
            if (textarea) {
              textarea.focus();
              textarea.setSelectionRange(
                textarea.value.length,
                textarea.value.length,
              );
            }
          }
        }
      }, 100);

      return consolidated;
    });
  };

  const handleTextBlockKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    blockId: string,
  ) => {
    const textarea = e.target as HTMLTextAreaElement;
    const cursorPosition = textarea.selectionStart;
    const currentIndex = blocks.findIndex((b) => b.id === blockId);
    const currentBlock = blocks[currentIndex];

    if (e.key === "Backspace" && cursorPosition === 0) {
      if (currentIndex <= 0) {
        return;
      }

      if (currentBlock.content.trim() === "") {
        e.preventDefault();
        removeBlock(blockId);
        return;
      }

      let mergeIndex = currentIndex - 1;
      let canMerge = false;
      while (mergeIndex >= 0) {
        const potentialPrev = blocks[mergeIndex];
        if (potentialPrev.type === "text") {
          canMerge = true;
          break;
        } else if (
          potentialPrev.type === "code" &&
          !potentialPrev.content.trim()
        ) {
          mergeIndex--;
        } else {
          break;
        }
      }

      if (canMerge && mergeIndex >= 0) {
        e.preventDefault();
        const prevBlock = blocks[mergeIndex];
        const originalLen = prevBlock.content.length;
        const addSpace =
          prevBlock.content &&
          currentBlock.content.trim() !== "" &&
          !prevBlock.content.endsWith(" ") &&
          !prevBlock.content.endsWith("\n");
        let mergedContent = prevBlock.content;
        if (addSpace) {
          mergedContent += " ";
        }
        mergedContent += currentBlock.content;
        const mergedId = prevBlock.id;

        const blocksToRemove = currentIndex - mergeIndex;

        setBlocks((prevBlocks) => {
          const newBlocks = [...prevBlocks];
          newBlocks.splice(mergeIndex + 1, blocksToRemove);
          newBlocks[mergeIndex] = {
            ...newBlocks[mergeIndex],
            content: mergedContent,
          };
          return consolidateBlocks(newBlocks);
        });

        setTimeout(() => {
          const mergedTextarea = blockRefs.current[mergedId];
          if (mergedTextarea) {
            mergedTextarea.focus();
            const pos = originalLen + (addSpace ? 1 : 0);
            mergedTextarea.setSelectionRange(pos, pos);
          }
        }, 50);
        return;
      }
    }

    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      addTextBlock(blockId);
    }
  };

  const addTextBlock = (afterBlockId: string) => {
    const newBlockId = `text-${Date.now()}`;
    const newBlock: ContentBlock = {
      id: newBlockId,
      type: "text",
      content: "",
    };

    setBlocks((prev) => {
      const index = prev.findIndex((block) => block.id === afterBlockId);
      const newBlocks = [...prev];
      newBlocks.splice(index + 1, 0, newBlock);
      return consolidateBlocks(newBlocks);
    });

    setTimeout(() => {
      const textarea = blockRefs.current[newBlockId];
      if (textarea) {
        textarea.focus();
      }
    }, 100);
  };

  const removeImage = (imageId: string) => {
    const newImages = note.images?.filter((img) => img.id !== imageId) || [];
    onUpdate(note.id, { images: newImages });
    setBlocks((prev) => {
      const filtered = prev.filter(
        (block) => !(block.type === "image" && block.imageData?.id === imageId),
      );
      return consolidateBlocks(filtered);
    });
  };

  const handleAutoResize = useCallback((textarea: HTMLTextAreaElement) => {
    const savedScrollPosition = window.scrollY;
    textarea.style.height = "auto";
    textarea.style.height = Math.max(60, textarea.scrollHeight) + "px";
    window.scrollTo(0, savedScrollPosition);
  }, []);

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="transition-all duration-200 hover:bg-accent"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={insertCodeBlock}
          className="transition-all duration-200 hover:bg-accent"
        >
          <CodeBracketIcon className="h-4 w-4 mr-1" />
          Code
        </Button>
        <div className="text-sm text-muted-foreground ml-auto">
          Press Ctrl+V to paste images
        </div>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note title..."
        className="w-full text-3xl font-bold bg-transparent border-none outline-none mb-6 placeholder:text-muted-foreground transition-colors"
      />

      <div className="space-y-4">
        {blocks.map((block, index) => (
          <div key={block.id} className="group">
            {block.type === "text" && (
              <textarea
                ref={(el) => {
                  blockRefs.current[block.id] = el;
                }}
                value={block.content}
                onChange={(e) => {
                  cursorPositionRef.current = e.target.selectionStart;
                  updateBlock(block.id, { content: e.target.value });
                }}
                onFocus={() => setFocusedBlock(block.id)}
                onClick={(e) => {
                  cursorPositionRef.current = (
                    e.target as HTMLTextAreaElement
                  ).selectionStart;
                }}
                onKeyUp={(e) => {
                  cursorPositionRef.current = (
                    e.target as HTMLTextAreaElement
                  ).selectionStart;
                }}
                onKeyDown={(e) => handleTextBlockKeyDown(e, block.id)}
                placeholder={
                  blocks.filter((b) => b.type === "text" && b.content.trim())
                    .length === 0
                    ? "Start writing..."
                    : "Continue writing..."
                }
                className={cn(
                  "w-full min-h-[60px] resize-none border-none outline-none bg-transparent overflow-hidden",
                  "text-base leading-relaxed font-sans",
                  "placeholder:text-muted-foreground",
                  "focus:ring-0 focus:outline-none transition-colors",
                )}
                style={{
                  fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  lineHeight: "1.6",
                  letterSpacing: "0.01em",
                }}
                onInput={(e) =>
                  handleAutoResize(e.target as HTMLTextAreaElement)
                }
              />
            )}

            {block.type === "code" && (
              <div className="relative my-6 group/code">
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 opacity-0 group-hover/code:opacity-100 transition-opacity z-10 dark:border-[#e7e8e8] border-[#191a1c]" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 opacity-0 group-hover/code:opacity-100 transition-opacity z-10 dark:border-[#e7e8e8] border-[#191a1c]" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 opacity-0 group-hover/code:opacity-100 transition-opacity z-10 dark:border-[#e7e8e8] border-[#191a1c]" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 opacity-0 group-hover/code:opacity-100 transition-opacity z-10 dark:border-[#e7e8e8] border-[#191a1c]" />

                  <div
                    className="absolute inset-0 border border-dashed rounded-none opacity-100 group-hover/code:opacity-0 transition-opacity"
                    style={{ borderColor: "#191a1c" }}
                  />

                  <div
                    className="absolute top-0 left-3 right-3 h-px border-t border-dashed opacity-0 group-hover/code:opacity-100 transition-opacity"
                    style={{ borderTopColor: "#3d3e40" }}
                  />
                  <div
                    className="absolute bottom-0 left-3 right-3 h-px border-t border-dashed opacity-0 group-hover/code:opacity-100 transition-opacity"
                    style={{ borderTopColor: "#3d3e40" }}
                  />
                  <div
                    className="absolute left-0 top-3 bottom-3 w-px border-l border-dashed opacity-0 group-hover/code:opacity-100 transition-opacity"
                    style={{ borderLeftColor: "#3d3e40" }}
                  />
                  <div
                    className="absolute right-0 top-3 bottom-3 w-px border-l border-dashed opacity-0 group-hover/code:opacity-100 transition-opacity"
                    style={{ borderLeftColor: "#3d3e40" }}
                  />
                </div>
                <div className="bg-card overflow-hidden transition-all duration-200">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/20">
                    <div className="flex items-center gap-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs font-medium"
                          >
                            {LANGUAGES.find(
                              (lang) =>
                                lang.value === (block.language || "javascript"),
                            )?.label || "JavaScript"}
                            <ChevronDownIcon className="ml-1 h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-40">
                          {LANGUAGES.map((lang) => (
                            <DropdownMenuItem
                              key={lang.value}
                              onClick={() =>
                                updateBlock(block.id, { language: lang.value })
                              }
                              className="text-xs"
                            >
                              {lang.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() =>
                          navigator.clipboard.writeText(block.content)
                        }
                      >
                        <DocumentDuplicateIcon className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeBlock(block.id)}
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <textarea
                    ref={(el) => {
                      blockRefs.current[block.id] = el;
                    }}
                    value={block.content}
                    onChange={(e) =>
                      updateBlock(block.id, { content: e.target.value })
                    }
                    onFocus={() => setFocusedBlock(block.id)}
                    onKeyDown={(e) => {
                      if (e.ctrlKey && e.key === "a") {
                        e.preventDefault();
                        const textarea = e.target as HTMLTextAreaElement;
                        if (textarea) {
                          textarea.select();
                        }
                        return;
                      }
                      if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
                        const textarea = e.target as HTMLTextAreaElement;
                        const cursorPosition = textarea.selectionStart;
                        const content = textarea.value;

                        if (cursorPosition === content.length) {
                          e.preventDefault();
                          const newTextBlockId = `text-${Date.now()}`;
                          const newTextBlock: ContentBlock = {
                            id: newTextBlockId,
                            type: "text",
                            content: "",
                          };

                          setBlocks((prev) => {
                            const currentIndex = prev.findIndex(
                              (b) => b.id === block.id,
                            );
                            const newBlocks = [...prev];
                            newBlocks.splice(currentIndex + 1, 0, newTextBlock);
                            return consolidateBlocks(newBlocks);
                          });

                          setTimeout(() => {
                            const newTextarea =
                              blockRefs.current[newTextBlockId];
                            if (newTextarea) {
                              newTextarea.focus();
                            }
                          }, 50);
                        }
                      }
                    }}
                    placeholder=""
                    className="w-full min-h-[120px] p-4 bg-transparent border-none outline-none resize-none overflow-hidden font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground transition-all duration-200"
                    style={{
                      fontFamily:
                        "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                    }}
                    onInput={(e) => {
                      const savedScrollPosition = window.scrollY;
                      const textarea = e.target as HTMLTextAreaElement;
                      const scrollHeight = textarea.scrollHeight;
                      const newHeight = Math.max(120, scrollHeight);
                      textarea.style.height = "auto";
                      textarea.style.height = newHeight + "px";
                      window.scrollTo(0, savedScrollPosition);
                    }}
                  />
                </div>
              </div>
            )}

            {block.type === "image" && block.imageData && (
              <div className="my-6 group relative inline-block">
                <img
                  src={block.imageData.url || "/placeholder.svg"}
                  alt="Pasted image"
                  className="max-w-full h-auto rounded-lg border shadow-sm transition-all duration-200 hover:shadow-md"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  onClick={() => removeImage(block.imageData!.id)}
                >
                  <XMarkIcon className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
