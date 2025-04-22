"use client";

import { useState, useEffect } from 'react';
import ItemDisplay from '@/components/item-display';
import { getIdentificationInfo, getRollPercentageString, processIdentification } from '@/lib/itemUtils';

type ProcessedID = {
  name: string;
  percentage: number;
};

type WeightMap = {
  [key: string]: number;
};

export function calculateWeightedScore(
  ids: { name: string; percentage: number }[],
  weightMap: Record<string, number>
): { total: number; detailed: { name: string; score: number }[] } {
  let total = 0;

  const detailed = ids.map((id) => {
    const weight = weightMap[id.name] ?? 0;
    const score = (id.percentage / 100) * weight;
    total += score;
    return { name: id.name, score: parseFloat(score.toFixed(3)) };
  });

  return {
    total: parseFloat(total.toFixed(3)),
    detailed,
  };
}

export interface Weight {
  item_name: string;
  item_id: string;
  weight_name: string;
  weight_id: string;
  type: string;
  author: string;
  timestamp: number;
  identifications: Record<string, number>;
  description: string;
  userId: string;
}

export default function Home() {
  // State for the item input, fetched data, and loading status
  const [inputValue, setInputValue] = useState<string>('');
  const [demoData, setDemoData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Function to handle the API request
  const fetchItemData = async (item: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.wynnpool.com/item/full-decode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ item }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch item data');
      }

      const data = await response.json();
      console.log(data)
      if (data) {
        setDemoData(data); // Save item data to state if the response is valid
      } else {
        throw new Error('Invalid item data');
      }
    } catch (error: any) {
      setError(error.message); // Show error message if something goes wrong
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Handle form submission or input change event
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() !== '') {
      fetchItemData(inputValue);
    }
  };
  if (demoData) console.log(demoData.original.identified)
  return (
    <div className="min-h-screen bg-gray-800 flex flex-col items-center justify-center p-6">
      (beta version)
      <h1 className="text-2xl text-white font-bold mb-6">Wynncraft Item Analyze</h1>


      {/* Input form to enter item */}
      <form onSubmit={handleSubmit} className="mb-6 w-full max-w-md">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          className="w-full p-3 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          placeholder="Enter Wynntils Item String"
        />
        <button
          type="submit"
          className="w-full p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
        >
          {loading ? 'Loading...' : 'Analyze'}
        </button>
      </form>

      {/* Error message if any */}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Show item display if demoData is valid */}
      {demoData?.original.identified && <div>This item is pre-identified</div>}
      {demoData && !loading && !error && !demoData.original.identified && (
        <div className="flex w-fit bg-gray-900 rounded-lg overflow-hidden shadow-xl transform transition-all hover:scale-105 duration-300">
          <ItemDisplay data={demoData} />

          {/* 🧮 Multiple Weight Sets Section */}
          {demoData.weights && demoData.weights.length > 0 && (
            <div className="p-4 space-y-6">
              <h2 className="text-white text-lg font-semibold">Weight Calculations</h2>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                {(() => {
                  const processed = processIdentification(demoData);

                  return demoData.weights.map((weight: Weight) => {
                    const result = calculateWeightedScore(processed, weight.identifications);
                    return (
                      <div key={weight.weight_id} className="bg-gray-800 p-4 rounded-lg shadow">
                        <h3 className="text-blue-400 font-bold mb-2">🏋️ {weight.weight_name} [{getRollPercentageString(result.total * 100)}]</h3>
                        <ul className="text-gray-300 text-sm space-y-1">
                          {Object.entries(weight.identifications).map(([key, value]) => {
                            const truncated = Math.trunc(value * 100);

                            return (
                              <li key={key}>
                                <span className="text-white">{getIdentificationInfo(key)?.displayName}</span>: {truncated.toFixed(2)}%
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
