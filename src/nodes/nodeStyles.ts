// Dynamic CSS injection for node colors
// Generated from nodeDefinitions to avoid duplication

import { nodeDefinitions } from './nodeDefinitions';

/**
 * Injects CSS variables and classes for node colors based on nodeDefinitions.
 * Call this once at app startup (in main.tsx).
 */
export function injectNodeStyles(): void {
  // Check if already injected
  if (document.getElementById('zyklus-node-colors')) {
    return;
  }

  // Generate CSS variables for :root
  const cssVariables = Object.entries(nodeDefinitions)
    .map(([type, def]) => `  --${type}: ${def.color};`)
    .join('\n');

  // Generate CSS classes for each node type
  const cssClasses = Object.keys(nodeDefinitions)
    .map((type) => `.${type} { --node-color: var(--${type}); }`)
    .join('\n');

  const styles = `
/* Auto-generated node colors from nodeDefinitions */
:root {
${cssVariables}
}

${cssClasses}
`;

  const styleEl = document.createElement('style');
  styleEl.id = 'zyklus-node-colors';
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}
