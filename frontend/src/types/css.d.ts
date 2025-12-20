// CSS module type declarations
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.css?inline' {
  const content: string;
  export default content;
}

// For side-effect CSS imports (globals.css)
declare module './globals.css';
declare module '../globals.css';
declare module '../../globals.css';