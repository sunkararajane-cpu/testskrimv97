const fs = require('fs');
let code = fs.readFileSync('src/components/MessageBubble.tsx', 'utf-8');

code = code.replace(
  '<div className="relative w-full aspect-square overflow-hidden">',
  `<div className="relative w-full aspect-square overflow-hidden cursor-zoom-in"
                   onClick={(e) => {
                     e.stopPropagation();
                     window.dispatchEvent(new CustomEvent('open-media-viewer', { 
                       detail: { 
                         type: 'post_photo', 
                         photoUrl: message.postThumbnail,
                         time: message.time,
                         sender: message.sender,
                         postCaption: message.postCaption,
                         postUser: message.postUser
                       }
                     }));
                   }}>`
);

fs.writeFileSync('src/components/MessageBubble.tsx', code);
console.log("Patched MessageBubble");
