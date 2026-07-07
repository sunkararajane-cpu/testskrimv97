const fs = require('fs');
let code = fs.readFileSync('src/screens/ChatThreadScreen.tsx', 'utf-8');

code = code.replace(
  `               {mediaViewer.type === 'photo' && (`,
  `               {mediaViewer.type === 'post_photo' && (
                 <TransformWrapper>
                   <TransformComponent wrapperClass="!w-screen !h-screen flex items-center justify-center relative">
                     <img 
                       src={mediaViewer.photoUrl} 
                       alt="Pulse Preview" 
                       className="max-w-full max-h-[85vh] object-contain select-none cursor-zoom-in" 
                     />
                   </TransformComponent>
                 </TransformWrapper>
               )}
               {mediaViewer.type === 'photo' && (`
);

fs.writeFileSync('src/screens/ChatThreadScreen.tsx', code);
console.log("Patched ChatThreadScreen");
