import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../stores/auth';
import BananaLoader from '../components/BananaLoader';

export default function CreateProp() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('You must be logged in to create a prop');
      return;
    }

    try {
      const { data, error: insertError } = await supabase
        .from('chimp_props')
        .insert([
          {
            name,
            expiry_date: new Date(expiryDate).toISOString(),
            creator_id: user.id
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;
      if (data) {
        navigate(`/prop/${data.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create prop');
    }
  };

  return (
    <div className="max-w-2xl mx-auto z-20">
      <div className="flex justify-left mt-4 pb-4">
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 text-sm font-medium text-yellow-900 bg-yellow-300 rounded-md shadow-sm hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
        >
          Back to Home
        </button>
      </div>
      <h1 className="text-3xl font-bold text-yellow-900 mb-8">Create New Banana Bet</h1>

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-lg font-medium text-gray-700">
              Prop Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
              placeholder="Will the banana price increase by 20%?"
            />
          </div>

          <div>
            <label htmlFor="expiryDate" className="block text-lg font-medium text-gray-700">
              Expiry Date
            </label>
            <label htmlFor="expiryDescription" className="block text-sm font-medium text-gray-400">
              (You&apos;ll need to come back at this time to let us know if it happened or not!)
            </label>
            <input
              type="datetime-local"
              id="expiryDate"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
              min={new Date().toISOString().slice(0, 16)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-yellow-900 bg-yellow-400 hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            Create Prop
          </button>
        </div>
      </form>

      {/* Banana Bet Description Box */}
      <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mt-6 shadow-sm">
        <h2 className="text-xl font-bold text-yellow-900">What’s a Banana Bet? 🍌</h2>
        <p className="text-yellow-800 mt-2">
          "Ooh ooh ah ah! Welcome to the jungle of fun! A Banana Bet is a playful prop bet where you
          can bet bananas on wacky predictions. A prop bet (short for proposition bet) is a fun
          little wager on anything, like &apos;Will the monkey king eat 10 bananas today?&apos; 🍌.
        </p>
        <p className="text-yellow-800 mt-2">
          To create a Banana Bet, you&apos;ll need a creative name and an expiration date. After all, even
          monkeys need deadlines for their mischief! Swing into action and create your own bet now!"
        </p>

      </div>
    </div>
  );
}
