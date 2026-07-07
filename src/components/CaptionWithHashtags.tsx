import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Renders caption/post text with #hashtags as tappable links to /hashtag/:tag.
 * Shared across Discover, Pulse, and anywhere else captions are displayed,
 * so hashtag linking behaves identically everywhere instead of being
 * reimplemented (or missing) per-screen.
 */
export const CaptionWithHashtags = ({ caption, className }: { caption: string; className?: string }) => {
  const navigate = useNavigate();
  if (!caption) return null;
  return (
    <p className={className}>
      {caption.split(/(#[\w\u0900-\u097F\u0C00-\u0C7F]+)/g).map((part, i) =>
        part.startsWith('#') ? (
          <span
            key={i}
            className="font-bold text-white hover:underline cursor-pointer relative z-20 pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              navigate(`/hashtag/${encodeURIComponent(part)}`);
            }}
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
};
