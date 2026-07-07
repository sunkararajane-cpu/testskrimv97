import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";

export function StealthAvatar({ onClick, className = "w-8 h-8 rounded-full border border-white/10" }: { onClick?: () => void, className?: string }) {
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const tapCount = useRef(0);
  const tapTimer = useRef<NodeJS.Timeout | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const isStealth = localStorage.getItem("veil_stealth_enabled") === "true";
    
    if (!isStealth) {
      if (onClick) onClick();
      else navigate("/identity");
      return;
    }

    tapCount.current += 1;

    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
    }

    if (tapCount.current === 3) {
      tapCount.current = 0;
      window.dispatchEvent(new CustomEvent("veil_stealth_trigger"));
    } else {
      tapTimer.current = setTimeout(() => {
        if (tapCount.current < 3) {
          if (onClick) onClick();
          else navigate("/identity");
        }
        tapCount.current = 0;
      }, 400);
    }
  };

  const getBadgeStyle = () => {
    const notifications = JSON.parse(localStorage.getItem('veil_notifications') || '[]');
    return localStorage.getItem("veil_stealth_enabled") === "true" && notifications.length > 0;
  }

  const [hasBadge, setHasBadge] = React.useState(getBadgeStyle());

  React.useEffect(() => {
     const i = setInterval(() => {
         setHasBadge(getBadgeStyle());
     }, 1000);
     return () => clearInterval(i);
  }, []);

  return (
    <div className="relative group cursor-pointer inline-block" onClick={handleClick}>
      <img
        src={currentUser?.avatar || "https://i.pravatar.cc/150?img=11"}
        alt="Profile"
        className={className}
      />
      {hasBadge && (
        <div className="absolute bottom-0 right-0 w-[6px] h-[6px] bg-[#B026FF] rounded-full animate-[pulse_6s_infinite]" />
      )}
    </div>
  );
}
