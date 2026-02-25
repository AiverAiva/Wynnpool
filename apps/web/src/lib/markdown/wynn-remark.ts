/**
 * Custom remark plugin to support `-#` markdown syntax
 * This syntax creates a small, muted text line
 * 
 * Example usage:
 * `-# This is a muted small text with **bold**`
 * 
 * Will be rendered as a small, muted paragraph with formatting preserved
 */

import type { Plugin } from 'unified';
import type { Root, Paragraph } from 'mdast';
import { visit } from 'unist-util-visit';

/**
 * Remark plugin to enable `-#` syntax for muted text
 * 
 * This plugin converts paragraphs that start with `-#` into custom wynnMuted nodes
 * which are then rendered as small, muted text, preserving markdown formatting.
 */
export function remarkWynnMuted(): Plugin<[any?], Root> {
  return function (tree: Root) {
    // Collect all the changes we need to make
    const changes: Array<{ index: number; parent: any; mutedNode: any }> = [];
    
    // We need to process the tree to find paragraphs that start with `-#`
    visit(tree, 'paragraph', (node: Paragraph, index, parent) => {
      if (!node.children || !parent) return;

      // Check if the first child is a text node starting with `-#`
      const firstChild = node.children[0];
      if (firstChild?.type === 'text' && firstChild.value.startsWith('-#')) {
        // Create a muted node that preserves all the original children
        // This way, **bold**, *italic*, links, etc. are all preserved
        // But we need to remove the `-#` prefix from the first text node
        const children = [...node.children];
        
        // Remove `-#` prefix from the first text node
        if (children[0]?.type === 'text') {
          const remainingText = children[0].value.slice(2); // Remove `-#`
          if (remainingText) {
            children[0].value = remainingText;
          } else {
            // If only `-#` was there, remove the text node entirely
            children.shift();
          }
        }
        
        const mutedNode = {
          type: 'wynnMuted',
          children
        };

        changes.push({ index: index as number, parent, mutedNode });
      }
    });

    // Apply changes from the end to the beginning to avoid index issues
    for (let i = changes.length - 1; i >= 0; i--) {
      const { index, parent, mutedNode } = changes[i];
      
      // Replace the paragraph with the muted node
      parent.children.splice(index, 1, mutedNode);
    }
  };
}