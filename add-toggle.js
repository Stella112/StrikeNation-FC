const fs = require('fs');
let jsx = fs.readFileSync('app/landing-page.jsx', 'utf8');

if (!jsx.includes('"use client"')) {
  jsx = '"use client";\nimport { useEffect, useState } from "react";\n' + jsx;
  
  const injectLogic = `export default function LandingPage() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);
  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };
`;
  jsx = jsx.replace('export default function LandingPage() {', injectLogic);
  
  jsx = jsx.replace(
    '<button aria-label="Toggle theme" className="grid size-9 place-items-center rounded-sm border border-border hover:bg-muted">',
    '<button onClick={toggleTheme} aria-label="Toggle theme" className="grid size-9 place-items-center rounded-sm border border-border hover:bg-muted">'
  );
  
  fs.writeFileSync('app/landing-page.jsx', jsx);
  console.log('Toggle added');
} else {
  console.log('Already added');
}
