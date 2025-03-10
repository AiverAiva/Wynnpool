import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

type DiffType = 'added' | 'removed' | 'changed' | 'unchanged';

interface DiffResult {
  key: string;
  type: DiffType;
  path: string[];
  before?: any;
  after?: any;
  children?: DiffResult[];
}

interface ItemDiffViewerProps {
  before: any;
  after: any;
  excludeKeys?: string[];
}

export function ItemDiffViewer({ before, after, excludeKeys = ['_id', 'timestamp', 'status'] }: ItemDiffViewerProps) {
  // Find differences between two objects
  const findDifferences = (before: any, after: any, path: string[] = []): DiffResult[] => {
    const results: DiffResult[] = [];
    
    // Handle null or undefined values
    if (before === null || before === undefined) {
      if (after === null || after === undefined) {
        return results;
      }
      return [{ key: path[path.length - 1] || 'root', type: 'added', path, after }];
    }
    
    if (after === null || after === undefined) {
      return [{ key: path[path.length - 1] || 'root', type: 'removed', path, before }];
    }
    
    // If types are different, consider it a change
    if (typeof before !== typeof after) {
      return [{ key: path[path.length - 1] || 'root', type: 'changed', path, before, after }];
    }
    
    // If primitive values, compare directly
    if (typeof before !== 'object') {
      if (before === after) {
        return [];
      }
      return [{ key: path[path.length - 1] || 'root', type: 'changed', path, before, after }];
    }
    
    // If arrays, compare items
    if (Array.isArray(before) && Array.isArray(after)) {
      // For simplicity, just check if arrays are different
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        return [{ key: path[path.length - 1] || 'root', type: 'changed', path, before, after }];
      }
      return [];
    }
    
    // For objects, compare each property
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
    
    for (const key of allKeys) {
      // Skip excluded keys
      if (excludeKeys.includes(key)) continue;
      
      const newPath = [...path, key];
      
      if (!(key in before)) {
        results.push({ key, type: 'added', path: newPath, after: after[key] });
      } else if (!(key in after)) {
        results.push({ key, type: 'removed', path: newPath, before: before[key] });
      } else {
        const childDiffs = findDifferences(before[key], after[key], newPath);
        if (childDiffs.length > 0) {
          // If the key is an object with nested differences
          if (typeof before[key] === 'object' && before[key] !== null && 
              typeof after[key] === 'object' && after[key] !== null) {
            results.push({
              key,
              type: 'changed',
              path: newPath,
              before: before[key],
              after: after[key],
              children: childDiffs
            });
          } else {
            // For primitive values with differences
            results.push(...childDiffs);
          }
        }
      }
    }
    
    return results;
  };

  const differences = findDifferences(before, after);

  // Render a diff item
  const renderDiffItem = (diff: DiffResult, index: number) => {
    const lastKey = diff.path[diff.path.length - 1];
    const displayPath = diff.path.join('.');
    
    // Format values for display
    const formatValue = (value: any): string => {
      if (value === null || value === undefined) return 'null';
      if (typeof value === 'object') {
        if (Object.keys(value).length === 0) return '{}';
        if ('min' in value && 'raw' in value && 'max' in value) {
          return `${value.min} / ${value.raw} / ${value.max}`;
        }
        return JSON.stringify(value);
      }
      return String(value);
    };

    const getBadgeColor = (type: DiffType) => {
      switch (type) {
        case 'added': return 'bg-green-500 text-white';
        case 'removed': return 'bg-red-500 text-white';
        case 'changed': return 'bg-yellow-500 text-black';
        default: return 'bg-gray-500 text-white';
      }
    };

    return (
      <div key={index} className="mb-2 p-2 border rounded">
        <div className="flex items-center gap-2">
          <Badge className={getBadgeColor(diff.type)}>
            {diff.type.charAt(0).toUpperCase() + diff.type.slice(1)}
          </Badge>
          <span className="font-medium">{lastKey}</span>
          <span className="text-xs text-gray-500">{displayPath}</span>
        </div>
        
        {diff.type === 'changed' && (
          <div className="mt-1 grid grid-cols-2 gap-2">
            <div className="p-1 bg-red-500/20 rounded">
              <div className="text-xs text-gray-700">Before:</div>
              <div className="text-sm text-red-700">{formatValue(diff.before)}</div>
            </div>
            <div className="p-1 bg-green-500/20 rounded">
              <div className="text-xs text-gray-700">After:</div>
              <div className="text-sm text-green-700">{formatValue(diff.after)}</div>
            </div>
          </div>
        )}
        
        {diff.type === 'added' && (
          <div className="mt-1 p-1 bg-green-500/20 rounded">
            <div className="text-xs text-gray-700">Added:</div>
            <div className="text-sm text-green-700">{formatValue(diff.after)}</div>
          </div>
        )}
        
        {diff.type === 'removed' && (
          <div className="mt-1 p-1 bg-red-500/20 rounded">
            <div className="text-xs text-gray-700">Removed:</div>
            <div className="text-sm text-red-700">{formatValue(diff.before)}</div>
          </div>
        )}
        
        {diff.children && diff.children.length > 0 && (
          <div className="mt-2 pl-4 border-l-2 border-gray-300">
            {diff.children.map((child, childIndex) => renderDiffItem(child, childIndex))}
          </div>
        )}
      </div>
    );
  };

  // Group differences by category
  const categorizedDiffs = {
    requirements: differences.filter(d => d.path[0] === 'requirements'),
    identifications: differences.filter(d => d.path[0] === 'identifications'),
    base: differences.filter(d => d.path[0] === 'base'),
    other: differences.filter(d => !['requirements', 'identifications', 'base'].includes(d.path[0]))
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-3">Changes to {after.itemName || before.itemName}</h3>
        
        <ScrollArea className="h-[400px] pr-4">
          {Object.entries(categorizedDiffs).map(([category, diffs]) => 
            diffs.length > 0 && (
              <div key={category} className="mb-4">
                <h4 className="text-md font-medium capitalize mb-2">{category}</h4>
                {diffs.map((diff, index) => renderDiffItem(diff, index))}
              </div>
            )
          )}
          
          {differences.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              No differences found
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}