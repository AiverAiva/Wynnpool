"use client";

import { useState, useEffect } from 'react';
import ItemDisplay from '@/components/item-display';

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

  return (
    <div className="min-h-screen bg-gray-800 flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl text-white font-bold mb-6">Wynncraft Item Display</h1>

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
          {loading ? 'Loading...' : 'Fetch Item'}
        </button>
      </form>

      {/* Error message if any */}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Show item display if demoData is valid */}
      {demoData && !loading && !error && (
        <div className="w-full max-w-md bg-gray-900 rounded-lg overflow-hidden shadow-xl transform transition-all hover:scale-105 duration-300">
          <ItemDisplay data={demoData} />
        </div>
      )}
    </div>
  );
}
