"use client";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { NoteLinkPreview } from "@/types/note";
import { Button } from "@/components/ui/button";

interface LinkPreviewProps {
  preview: NoteLinkPreview;
  onRemove?: (id: string) => void;
}

export function LinkPreview({ preview, onRemove }: LinkPreviewProps) {
  const handleClick = () => {
    window.open(preview.url, "_blank", "noopener,noreferrer");
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  return (
    <div className="group relative my-4 border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 bg-card">
      <div
        onClick={handleClick}
        className="flex gap-4 p-4 cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {preview.image && (
          <div className="flex-shrink-0 w-24 h-24 rounded-md overflow-hidden bg-muted">
            <img
              src={preview.image}
              alt={preview.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm line-clamp-2 mb-1 text-foreground">
            {preview.title}
          </h3>
          {preview.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {preview.description}
            </p>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {preview.favicon && (
              <img
                src={preview.favicon}
                alt=""
                className="w-4 h-4"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            )}
            <span className="truncate">
              {preview.siteName || getDomain(preview.url)}
            </span>
          </div>
        </div>
      </div>
      {onRemove && (
        <Button
          variant="destructive"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(preview.id);
          }}
        >
          <XMarkIcon className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
