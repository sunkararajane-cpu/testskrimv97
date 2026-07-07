const fs = require('fs');
let code = fs.readFileSync('src/screens/ChatThreadScreen.tsx', 'utf-8');

code = code.replace(
  `               {mediaViewer.type === 'photo' && mediaViewer.photo.caption && (
                 <div className="text-white mt-2 font-medium">{mediaViewer.photo.caption}</div>
               )}`,
  `               {mediaViewer.type === 'photo' && mediaViewer.photo.caption && (
                 <div className="text-white mt-2 font-medium">{mediaViewer.photo.caption}</div>
               )}
               {mediaViewer.type === 'post_photo' && mediaViewer.postCaption && (
                 <div className="text-white mt-2 font-medium">{mediaViewer.postCaption}</div>
               )}`
);

fs.writeFileSync('src/screens/ChatThreadScreen.tsx', code);
console.log("Patched ChatThreadScreen caption");
