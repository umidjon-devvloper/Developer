const fs = require('fs');

const content = fs.readFileSync('src/app/(root)/cv/CVClient.tsx', 'utf8');

// Find CVPreview start
const startIdx = content.indexOf('const CVPreview = memo(');
const endIdx = content.indexOf('CVPreview.displayName = "CVPreview";');

const cvPreviewContent = content.slice(startIdx, endIdx);

let divCount = 0;
let motionCount = 0;

const lines = cvPreviewContent.split('\n');
lines.forEach((line, i) => {
    const divOpenMatch = line.match(/<div(\s|>)/g);
    const divCloseMatch = line.match(/<\/div>/g);
    const motionOpenMatch = line.match(/<motion\.div(\s|>)/g);
    const motionCloseMatch = line.match(/<\/motion\.div>/g);

    if (divOpenMatch) divCount += divOpenMatch.length;
    if (divCloseMatch) divCount -= divCloseMatch.length;
    if (motionOpenMatch) motionCount += motionOpenMatch.length;
    if (motionCloseMatch) motionCount -= motionCloseMatch.length;

    const divSelfCloseMatch = line.match(/<div[^>]*\/>/g);
    if(divSelfCloseMatch) {
       // self closing tag matched by `<div` so let's subtract 1
       divCount -= divSelfCloseMatch.length;
    }
});

console.log('Open divs left:', divCount);
console.log('Open motions left:', motionCount);
