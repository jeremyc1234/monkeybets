import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Banana } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../stores/auth';

interface ChimpProp {
  id: string;
  name: string;
  expiry_date: string;
  creator_id: string;
  result: boolean | null;
}

export default function SharedPropView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prop, setProp] = useState<ChimpProp | null>(null);
  const [prediction, setPrediction] = useState<boolean | null>(null);
  const [bananas, setBananas] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProp = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from('chimp_props')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        setError('Prop not found');
        return;
      }

      setProp(data);
    };

    fetchProp();
  }, [id]);

  const handleBet = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If user is not logged in, redirect to login with return URL
    if (!user) {
      // Store bet details in session storage
      sessionStorage.setItem('pendingBet', JSON.stringify({
        propId: id,
        prediction,
        bananas
      }));
      // Redirect to login with return URL
      navigate('/login', { state: { from: `/wager/${id}` } });
      return;
    }

    if (!prop || prediction === null || !bananas) {
      return;
    }

    try {
      const { error: betError } = await supabase
        .from('bets')
        .insert([
          {
            prop_id: prop.id,
            prediction,
            bananas: parseInt(bananas, 10),
            monkey_id: user.id,
          },
        ]);

      if (betError) throw betError;
      
      // Clear any stored pending bet
      sessionStorage.removeItem('pendingBet');
      // Redirect to dashboard
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place bet');
    }
  };

  // Check for pending bet on component mount
  useEffect(() => {
    const pendingBet = sessionStorage.getItem('pendingBet');
    if (pendingBet && user) {
      const { prediction: savedPrediction, bananas: savedBananas } = JSON.parse(pendingBet);
      setPrediction(savedPrediction);
      setBananas(savedBananas);
    }
  }, [user]);

  if (error) {
    return (
      <div className="min-h-screen bg-yellow-50 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <Banana className="h-12 w-12 text-yellow-900 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-yellow-900 mb-4">{error}</h1>
          <Link
            to="/"
            className="inline-block px-4 py-2 bg-yellow-400 text-yellow-900 rounded-md hover:bg-yellow-300"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (!prop) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <div className="text-yellow-900">Loading...</div>
      </div>
    );
  }

  const isExpired = new Date(prop.expiry_date) < new Date();

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <Banana className="h-8 w-8 text-yellow-900 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-yellow-900 text-center mb-6">{prop.name}</h1>
        
        <p className="text-gray-600 text-center mb-8">
          Expires: {format(new Date(prop.expiry_date), 'PPP pp')}
        </p>

        {isExpired ? (
          <div className="text-center text-gray-600">
            This prop has expired
          </div>
        ) : (
          <form onSubmit={handleBet} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Prediction
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setPrediction(true)}
                  className={`flex-1 py-2 px-4 rounded-md ${
                    prediction === true
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setPrediction(false)}
                  className={`flex-1 py-2 px-4 rounded-md ${
                    prediction === false
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="bananas" className="block text-sm font-medium text-gray-700">
                Bananas to Wager
              </label>
              <input
                type="number"
                id="bananas"
                min="1"
                value={bananas}
                onChange={(e) => setBananas(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={prediction === null || !bananas}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-yellow-900 bg-yellow-400 hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
            >
              {user ? 'Place Bet' : 'Sign In to Place Bet'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}