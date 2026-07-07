const fs = require('fs');

const sparkViewer = fs.readFileSync('src/components/SparkViewer.tsx', 'utf-8');
const pulseSheets = fs.readFileSync('src/components/PulseSheets.tsx', 'utf-8');

// Find SOCIAL_PLATFORMS in SparkViewer
const match = sparkViewer.match(/const SOCIAL_PLATFORMS = \[([\s\S]*?)\];/);
if (match) {
  const socialsConst = match[0];
  
  // Insert right before export function PulseSendSheet
  const newPulseSheets = pulseSheets.replace(
    'export function PulseSendSheet',
    socialsConst + '\n\nexport function PulseSendSheet'
  );
  
  fs.writeFileSync('src/components/PulseSheets.tsx', newPulseSheets);
  console.log('Copied SOCIAL_PLATFORMS');
} else {
  console.log('Could not find SOCIAL_PLATFORMS in SparkViewer');
}
