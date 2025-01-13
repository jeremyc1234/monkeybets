import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from '../stores/auth';

interface ChimpProp {
  id: string;
  name: string;
  expiry_date: string;
  creator_id: string;
}

interface Bet {
  id: string;
  prop_id: string;
  prediction: boolean;
  bananas: number;
  chimp_props: ChimpProp;
}

export default function Home() {
  const { user } = useAuth();
  const [createdProps, setCreatedProps] = useState<ChimpProp[]>([]);
  const [activeBets, setActiveBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Fetch created props
        const { data: propsData, error: propsError } = await supabase
          .from('chimp_props')
          .select('*')
          .eq('creator_id', user.id)
          .is('deleted_at', null)
          .is('result', null)
          .order('created_at', { ascending: false });

        if (propsError) throw propsError;
        setCreatedProps(propsData || []);

        // Fetch active bets with their associated props
        const { data: betsData, error: betsError } = await supabase
          .from('bets')
          .select(`
            id,
            prop_id,
            prediction,
            bananas,
            chimp_props (
              id,
              name,
              expiry_date,
              creator_id
            )
          `)
          .eq('monkey_id', user.id)
          .is('chimp_props.result', null)
          .is('chimp_props.deleted_at', null)
          .order('created_at', { ascending: false });

        if (betsError) throw betsError;
        setActiveBets(betsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscriptions
    const propsChannel = supabase
      .channel('props-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chimp_props',
        },
        () => fetchData()
      )
      .subscribe();

    const betsChannel = supabase
      .channel('bets-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bets',
        },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(propsChannel);
      supabase.removeChannel(betsChannel);
    };
  }, [user]);

  if (!user) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-yellow-900 mb-4">Welcome to MonkeyBets</h1>
        <p className="text-gray-600">Please sign in to see your props and wagers.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-yellow-900">Loading your bets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Active Bets Section - Always show this section */}
      <section>
        <h2 className="text-2xl font-bold text-yellow-900 mb-6">Active Banana Wagers</h2>
        {activeBets.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeBets.map((bet) => (
              <Link
                key={bet.id}
                to={`/prop/${bet.prop_id}`}
                className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-yellow-400"
              >
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                  {bet.chimp_props.name}
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    Your Prediction: <span className={bet.prediction ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {bet.prediction ? 'Yes' : 'No'}
                    </span>
                  </p>
                  <p>
                    Bananas Wagered: <span className="font-medium">{bet.bananas}</span>
                  </p>
                  <p>
                    Expires: {format(new Date(bet.chimp_props.expiry_date), 'PPP')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-gray-600">You don't have any active wagers yet.</p>
            <p className="text-sm text-gray-500 mt-2">
              Find an interesting prop to place your first bet!
            </p>
          </div>
        )}
      </section>

      {/* Created Props Section */}
      {createdProps.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-yellow-900 mb-6">Active Chimp Props You've Created</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {createdProps.map((prop) => (
              <Link
                key={prop.id}
                to={`/prop/${prop.id}`}
                className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-green-400"
              >
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">{prop.name}</h3>
                <p className="text-gray-600">
                  Expires: {format(new Date(prop.expiry_date), 'PPP')}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Create Prop CTA - Show only if no props or bets exist */}
      {createdProps.length === 0 && activeBets.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">You don't have any active props or wagers yet.</p>
          <Link
            to="/create"
            className="inline-block mt-4 px-6 py-2 bg-yellow-400 text-yellow-900 rounded-md hover:bg-yellow-300 transition-colors"
          >
            Create a Prop
          </Link>
        </div>
      )}
    </div>
  );
}