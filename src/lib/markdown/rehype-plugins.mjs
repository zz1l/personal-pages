// ---------------------------------------------------------------------------
// rehype-plugins.mjs
// - rehypeCallouts: converts "> [!NOTE] ..." blockquotes into styled callouts.
// - rehypeLineNumbers: marks every code block for CSS counter-based line
//   numbers (works with rehype-pretty-code's line spans).
// ---------------------------------------------------------------------------

const CALLOUT_RE = /^\[!(NOTE|TIP|INFO|WARNING|DANGER|IMPORTANT|EXAMPLE|ABSTRACT)\]\s*([\s\S]*)$/i;

const CALLOUT_TITLES = {
  note: 'Note',
  tip: 'Tip',
  info: 'Info',
  warning: 'Warning',
  danger: 'Danger',
  important: 'Important',
  example: 'Example',
  abstract: 'Abstract',
};

function textContent(node) {
  if (!node) return '';
  if (node.type === 'text') return node.value;
  if (!node.children) return '';
  return node.children.map(textContent).join('');
}

/** Removes the leading "[!TYPE]" token from the first text node of a node. */
function stripMarker(node) {
  if (node.type === 'text') {
    node.value = node.value.replace(/^\[![A-Za-z]+\]\s*/, '');
    return;
  }
  (node.children || []).forEach(stripMarker);
}

function hasText(node) {
  return textContent(node).trim().length > 0;
}

export function rehypeCallouts() {
  return (tree) => {
    transform(tree);
  };

  function transform(node) {
    if (!node.children) return;
    const children = [];
    for (const child of node.children) {
      children.push(convert(child));
    }
    node.children = children;
    node.children.forEach(transform);
  }

  function convert(node) {
    if (!node || node.tagName !== 'blockquote') return node;
    const paragraphs = (node.children || []).filter((c) => c && c.tagName === 'p');
    const firstP = paragraphs[0];
    if (!firstP) return node;

    const match = CALLOUT_RE.exec(textContent(firstP).trim());
    if (!match) return node;

    const type = match[1].toLowerCase();
    stripMarker(firstP);

    const aside = {
      type: 'element',
      tagName: 'aside',
      properties: { className: ['callout', 'callout-' + type] },
      children: [
        {
          type: 'element',
          tagName: 'div',
          properties: { className: ['callout-title'] },
          children: [{ type: 'text', value: CALLOUT_TITLES[type] ?? type }],
        },
      ],
    };

    if (hasText(firstP)) aside.children.push(firstP);
    for (const child of node.children || []) {
      if (child !== firstP) aside.children.push(child);
    }
    return aside;
  }
}

export function rehypeLineNumbers() {
  return (tree) => {
    walk(tree);
  };

  function walk(node) {
    if (node.tagName === 'pre') {
      const code = (node.children || []).find((c) => c && c.tagName === 'code');
      if (code) {
        if (!code.properties) code.properties = {};
        code.properties['data-line-numbers'] = '';
      }
    }
    (node.children || []).forEach(walk);
  }
}
