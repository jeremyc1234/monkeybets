import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Trash2, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../stores/auth';

interface ChimpProp {
  id: string;
  name: string;
  expiry_date: string;
  creator_id: string;
  result: boolean | null;
}

interface Bet {
  id: string;
  prediction: boolean;
  bananas: number;
  monkey_id: string;
}

export default function PropDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prop, setProp] = useState<ChimpProp | null>(null);
  const [bets, setBets] = useState<Bet[]>([]);
  const [prediction, setPrediction] = useState<boolean | null>(null);
  const [bananas, setBananas] = useState('');
  const [error, setError] = useState('');
  const [shareTooltip, setShareTooltip] = useState('Copy Link');

  useEffect(() => {
    const fetchProp = async () => {
      if (!id) return;

      const { data: propData, error: propError } = await supabase
        .from('chimp_props')
        .select('*')
        .eq('id', id)
        .single();

      if (propError) {
        console.error(propError);
        return;
      }

      setProp(propData);

      const { data: betsData } = await supabase
        .from('bets')
        .select('*, monkey_id')
        .eq('prop_id', id);

      if (betsData) {
        setBets(betsData);
      }
    };

    fetchProp();

    const channel = supabase
      .channel('public:bets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bets' }, fetchProp)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleDelete = async () => {
    if (!prop || !window.confirm('Are you sure you want to delete this prop?')) return;

    const { error } = await supabase
      .from('chimp_props')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', prop.id);

    if (error) {
      setError('Failed to delete prop');
    } else {
      navigate('/');
    }
  };

  const handleBet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prop || prediction === null || !bananas) return;

    try {
      const { error: betError } = await supabase
        .from('bets')
        .insert([
          {
            prop_id: prop.id,
            prediction,
            bananas: parseInt(bananas, 10),
            monkey_id: user?.id,
          },
        ]);

      if (betError) throw betError;
      setBananas('');
      setPrediction(null);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place bet');
    }
  };

  const handleSetResult = async (result: boolean) => {
    if (!prop) return;

    try {
      const { error } = await supabase
        .from('chimp_props')
        .update({ result })
        .eq('id', prop.id);

      if (error) {
        setError('Failed to set result');
      } else {
        // Immediately update local state
        setProp(prev => prev ? { ...prev, result } : null);
      }
    } catch (err) {
      setError('Failed to set result');
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/wager/${id}`;
    await navigator.clipboard.writeText(shareUrl);
    setShareTooltip('Copied!');
    setTimeout(() => setShareTooltip('Copy Link'), 2000);
  };

  if (!prop) return <div>Loading...</div>;

  const isCreator = user?.id === prop.creator_id;
  const isExpired = new Date(prop.expiry_date) < new Date();
  const totalYesBananas = bets.filter(b => b.prediction).reduce((sum, b) => sum + b.bananas, 0);
  const totalNoBananas = bets.filter(b => !b.prediction).reduce((sum, b) => sum + b.bananas, 0);
  const totalBananas = totalYesBananas + totalNoBananas;
  const yesOdds = totalBananas ? (totalNoBananas / totalBananas) + 1 : 2;
  const noOdds = totalBananas ? (totalYesBananas / totalBananas) + 1 : 2;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-yellow-600 hover:text-yellow-800"
            >
              <span>←</span>
              <span>Back to Home</span>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-yellow-900">{prop.name}</h1>
              <p className="text-gray-600 mt-2">
                Expires: {format(new Date(prop.expiry_date), 'PPP pp')}
              </p>
            </div>
          </div>
          <div className="flex space-x-4">
            {isCreator && !isExpired && !prop.result && (
              <button
                onClick={handleDelete}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
            {isCreator && (
              <button
                onClick={handleShare}
                className="flex items-center gap-1 text-yellow-600 hover:text-yellow-800 relative px-2 py-1 rounded-md hover:bg-yellow-50 border border-yellow-600"
                title={shareTooltip}
              >
                <Share2 className="h-5 w-5" />
                <span className="text-sm">Send to other monkeys</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-2">Yes</h3>
            <p className="text-green-800">Odds: {yesOdds.toFixed(2)}x</p>
            <p className="text-green-800">Total Bananas: {totalYesBananas}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-red-900 mb-2">No</h3>
            <p className="text-red-800">Odds: {noOdds.toFixed(2)}x</p>
            <p className="text-red-800">Total Bananas: {totalNoBananas}</p>
          </div>
        </div>

        {isExpired && isCreator && prop.result === null && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Set Result</h3>
            <div className="flex space-x-4">
              <button
                onClick={() => handleSetResult(true)}
                className="flex-1 py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Yes
              </button>
              <button
                onClick={() => handleSetResult(false)}
                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                No
              </button>
            </div>
          </div>
        )}

        {prop.result !== null && (
          <div className={`mb-8 p-6 rounded-lg ${prop.result ? 'bg-green-50' : 'bg-red-50'}`}>
            <h3 className="text-lg font-semibold mb-2">Result</h3>
            <p className={prop.result ? 'text-green-600 font-semibold text-lg' : 'text-red-600 font-semibold text-lg'}>
              {prop.result ? 'Yes' : 'No'}
            </p>
            {/* Add win/loss info for betters */}
            {bets.map(bet => bet.monkey_id === user?.id && (
              <p key={bet.id} className="mt-4">
                {bet.prediction === prop.result ? (
                  <span className="text-green-600">You won! 🎉</span>
                ) : (
                  <span className="text-red-600">Better luck next time! 🍌</span>
                )}
              </p>
            ))}
          </div>
        )}
        {!isCreator && !isExpired && prop.result === null && (
          <form onSubmit={handleBet} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Prediction
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setPrediction(true)}
                  className={`flex-1 py-2 px-4 rounded-md ${prediction === true
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setPrediction(false)}
                  className={`flex-1 py-2 px-4 rounded-md ${prediction === false
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
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={prediction === null || !bananas}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-yellow-900 bg-yellow-400 hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
            >
              Place Bet
            </button>
          </form>
        )}
      </div>
    </div>
  );
}