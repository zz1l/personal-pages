// ---------------------------------------------------------------------------
// remark-mermaid.mjs
// Converts ```mermaid fenced blocks into <div class="mermaid"> placeholders.
// The actual rendering happens client-side, lazily: the global app script
// only imports mermaid.js when a .mermaid element exists on the page, keeping
// the heavy dependency out of the main bundle.
// ---------------------------------------------------------------------------

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function walk(nodes) {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type === 'code' && node.lang === 'mermaid') {
      nodes[i] = {
        type: 'html',
        value: '<div class="mermaid">' + escapeHtml(node.value) + '</div>',
      };
    } else if (node.children) {
      walk(node.children);
    }
  }
}

export function remarkMermaid() {
  return (tree) => {
    walk(tree.children);
  };
}


