const fs = require('fs');
let code = fs.readFileSync('src/screens/PulseScreen.tsx', 'utf-8');

code = code.replace(
  `        {/* Reshare — Skrim Boost icon */}
        <button onClick={() => onShare(post.id, 'reshare')} className="flex items-center gap-1.5 group" title="Reshare Pulse">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-white group-hover:text-[#B026FF] transition-colors" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a9 9 0 1 0 9 9"/>
            <polyline points="16 3 21 3 21 8"/>
            <line x1="12" y1="12" x2="12" y2="8"/>
            <line x1="12" y1="8" x2="10" y2="10"/>
            <line x1="12" y1="8" x2="14" y2="10"/>
          </svg>
          <span className="text-xs text-gray-300">{fmt(post.shares)}</span>
        </button>
        {/* Send — Skrim Beam icon */}
        <button onClick={() => onShare(post.id, 'send')} className="flex items-center gap-1.5 group" title="Send Pulse">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-white group-hover:text-[#00F0FF] transition-colors" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="12" r="1.5" fill="currentColor" stroke="none"/>
            <path d="M9.5 8.5a6 6 0 0 1 0 7"/>
            <path d="M13 6a10 10 0 0 1 0 12"/>
            <path d="M16.5 3.5a14 14 0 0 1 0 17"/>
          </svg>
        </button>`,
  `        {/* Share */}
        <button onClick={() => onShare(post.id, 'send')} className="flex items-center gap-1.5 group" title="Share Pulse">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-white group-hover:text-[#B026FF] transition-colors" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a9 9 0 1 0 9 9"/>
            <polyline points="16 3 21 3 21 8"/>
            <line x1="12" y1="12" x2="12" y2="8"/>
            <line x1="12" y1="8" x2="10" y2="10"/>
            <line x1="12" y1="8" x2="14" y2="10"/>
          </svg>
          <span className="text-xs text-gray-300">{fmt(post.shares)}</span>
        </button>`
);

fs.writeFileSync('src/screens/PulseScreen.tsx', code);
console.log("Updated PostActions");
