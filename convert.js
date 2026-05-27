const fs = require('fs');
let html = fs.readFileSync('lovable_index.html', 'utf8');

// Extract body content
let bodyStart = html.indexOf('<div class="min-h-screen');
let bodyEnd = html.lastIndexOf('</body>');
if (bodyStart === -1 || bodyEnd === -1) {
    console.log('Could not find boundaries');
    process.exit(1);
}
let body = html.substring(bodyStart, bodyEnd);

// Convert HTML to JSX
body = body.replace(/class=/g, 'className=')
           .replace(/<!--.*?-->/g, '')
           .replace(/<img(.*?)\/?>/g, (match, p1) => {
               if(p1.endsWith('/')) return `<img${p1}>`;
               return `<img${p1} />`;
           })
           .replace(/<br>/g, '<br />')
           .replace(/<circle([^>]*?)\/?>/g, (match, p1) => p1.endsWith('/') ? match : `<circle${p1} />`)
           .replace(/<path([^>]*?)\/?>/g, (match, p1) => p1.endsWith('/') ? match : `<path${p1} />`)
           .replace(/<rect([^>]*?)\/?>/g, (match, p1) => p1.endsWith('/') ? match : `<rect${p1} />`)
           .replace(/<line([^>]*?)\/?>/g, (match, p1) => p1.endsWith('/') ? match : `<line${p1} />`)
           .replace(/<polyline([^>]*?)\/?>/g, (match, p1) => p1.endsWith('/') ? match : `<polyline${p1} />`)
           .replace(/stroke-width/g, 'strokeWidth')
           .replace(/stroke-linecap/g, 'strokeLinecap')
           .replace(/stroke-linejoin/g, 'strokeLinejoin')
           .replace(/charSet/g, 'charSet')
           .replace(/style="([^"]*)"/g, (match, style) => {
               let obj = {};
               style.split(';').forEach(rule => {
                   if (!rule.trim()) return;
                   let [key, val] = rule.split(':');
                   let camelKey = key.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
                   obj[camelKey] = val.trim();
               });
               return `style={{${Object.entries(obj).map(([k, v]) => `${k}: "${v}"`).join(', ')}}}`;
           });

let jsx = `import Link from 'next/link';

export default function LandingPage() {
  return (
    <>
      ${body}
    </>
  );
}
`;

fs.writeFileSync('app/landing-page.jsx', jsx);
console.log('Conversion successful');
