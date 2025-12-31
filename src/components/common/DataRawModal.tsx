import toast from 'react-hot-toast';
import React from 'react';
import { X, Copy, Code } from 'lucide-react';
import { useState } from 'react';

interface DataRawModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: unknown; // generic raw data support
  title?: string;
}

export default function DataRawModal({ isOpen, onClose, data, title = 'Raw Data' }: DataRawModalProps) {
  if (!isOpen) return null;

  const rawJson = JSON.stringify(data, null, 2) || '';
  const [viewMode, setViewMode] = useState<'formatted' | 'json'>('formatted');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(viewMode === 'json' ? rawJson : JSON.stringify(data));
      toast.success('Copied raw data to clipboard');
    } catch (error) {
      toast.error('Failed to copy');
      console.error('Copy error:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
        
              <div className="max-h-[60vh] overflow-auto bg-gray-50 p-4 rounded border border-gray-200 text-sm text-gray-800">
                {renderFormattedData(data)}
              </div>
           
          </div>
        </div>
      </div>
    </div>
  );
}

function renderFormattedData(value: unknown, depth = 0, seen = new Set()): React.ReactNode {
  if (value === null) return <span className="text-gray-500">null</span>;
  if (value === undefined) return <span className="text-gray-500">undefined</span>;

  if (typeof value === 'object') {
    // prevent circular refs
    if (seen.has(value)) return <span className="text-gray-500">[Circular]</span>;
    seen.add(value);

    if (Array.isArray(value)) {
      return (
        <ul className="space-y-2">
          {value.map((item, i) => (
            <li key={i} className="pl-4">
              <div className="text-xs text-gray-500">[{i}]</div>
              <div className="pl-2">{renderFormattedData(item, depth + 1, seen)}</div>
            </li>
          ))}
        </ul>
      );
    }

    // object
    const entries = Object.entries(value as Record<string, unknown>);
    return (
      <dl className="divide-y divide-gray-100">
        {entries.map(([key, val]) => (
          <div key={key} className="py-2 grid grid-cols-3 gap-4 items-start">
            <dt className="text-sm font-medium text-gray-600 col-span-1">{key}</dt>
            <dd className="text-sm text-gray-800 col-span-2">{renderFormattedData(val, depth + 1, seen)}</dd>
          </div>
        ))}
      </dl>
    );
  }

  // primitives
  if (typeof value === 'string') return <span className="text-gray-800">{value}</span>;
  if (typeof value === 'number') return <span className="text-gray-800">{value}</span>;
  if (typeof value === 'boolean') return <span className="text-gray-800">{String(value)}</span>;

  // Fallback
  return <span className="text-gray-800">{String(value)}</span>;
}
