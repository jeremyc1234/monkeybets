import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Share2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../stores/auth';
import BananaLoader from '../components/BananaLoader';

interface ChimpProp {
  id: string;
  name: string;
  expiry_date: string;
  creator_id: string;
  result: boolean | null;
  deleted_at: string | null;
}

interface Bet {
  id: string;
  prop_id: string;
  prediction: boolean;
  bananas: number;
  chimp_props: ChimpProp;
  prop_name: string;  // Add this line
}

// Function to calculate American odds
function calculateAmericanOdds(probability: number): string {
  if (probability === 0) return '+∞';
  if (probability === 1) return '-∞';

  if (probability > 0.5) {
    // Negative odds (favorites)
    return Math.round(-100 * (probability / (1 - probability))).toString();
  } else {
    // Positive odds (underdogs)
    return '+' + Math.round(100 * ((1 - probability) / probability)).toString();
  }
}

export default function Home() {
  const { user } = useAuth();
  const [createdProps, setCreatedProps] = useState<ChimpProp[]>([]);
  const [activeBets, setActiveBets] = useState<Bet[]>([]);
  const [propOdds, setPropOdds] = useState<Record<string, { yesOdds: string, noOdds: string }>>({});
  const [loading, setLoading] = useState(true);
  const [copyTooltip, setCopyTooltip] = useState<Record<string, string>>({});

  const handleCopyLink = async (propId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = `${window.location.origin}/wager/${propId}`;
    await navigator.clipboard.writeText(shareUrl);

    setCopyTooltip(prev => ({ ...prev, [propId]: 'Copied!' }));
    setTimeout(() => {
      setCopyTooltip(prev => ({ ...prev, [propId]: 'Copy Link' }));
    }, 2000);
  };

  const handleDelete = async (propId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm('Are you sure you want to delete this prop?')) return;

    try {
      console.log('Attempting delete with:', { propId, userId: user?.id });

      const { data, error } = await supabase
        .rpc('soft_delete_prop', {
          prop_id: propId,  // Already a string
          user_id: user?.id // Already a string
        });

      console.log('RPC response:', { data, error });

      if (error) throw error;

      // Update local state
      setCreatedProps(prev => prev.filter(prop => prop.id !== propId));
    } catch (error) {
      console.error('Error deleting prop:', error);
      alert('Failed to delete prop');
    }
  };

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
          .order('result', { ascending: true })  // Put non-null results last
          .order('created_at', { ascending: false }); // Then by creation date

        if (propsError) throw propsError;
        setCreatedProps(propsData || []);

        // Initialize copy tooltips
        const initialTooltips: Record<string, string> = {};
        propsData?.forEach(prop => {
          initialTooltips[prop.id] = 'Copy Link';
        });
        setCopyTooltip(initialTooltips);

        // Fetch active bets with their associated props
        const { data: betsData, error: betsError } = await supabase
          .from('bets')
          .select(`
    *,
    chimp_props (*)
  `)
          .eq('monkey_id', user.id)
          .is('chimp_props.result', null)
          .is('chimp_props.deleted_at', null)
          .order('created_at', { ascending: false });

        if (betsError) throw betsError;

        // Transform the data to match our Bet interface with safe handling of null values
        const transformedBetsData = (betsData || []).map(bet => {
          if (!bet.chimp_props) {
            console.error('Missing chimp_props for bet:', bet);
            return {
              ...bet,
              chimp_props: {
                id: bet.prop_id,
                name: `Prop #${bet.prop_id}`,
                expiry_date: new Date().toISOString(),
                creator_id: '',
                result: null,
                deleted_at: null
              }
            };
          }
          return bet;
        });

        setActiveBets(transformedBetsData);
        console.log('Transformed Bets Data:', transformedBetsData);

        // Fetch all bets for odds calculation
        const { data: allBetsData } = await supabase
          .from('bets')
          .select('prop_id, prediction, bananas');

        if (allBetsData) {
          const odds: Record<string, { yesOdds: string, noOdds: string }> = {};

          // Group bets by prop
          const propBets = allBetsData.reduce((acc, bet) => {
            if (!acc[bet.prop_id]) {
              acc[bet.prop_id] = { yes: 0, no: 0 };
            }
            if (bet.prediction) {
              acc[bet.prop_id].yes += bet.bananas;
            } else {
              acc[bet.prop_id].no += bet.bananas;
            }
            return acc;
          }, {} as Record<string, { yes: number, no: number }>);

          // Calculate odds for each prop
          Object.entries(propBets).forEach(([propId, { yes, no }]) => {
            const total = yes + no;
            if (total > 0) {
              const yesProbability = yes / total;
              const noProbability = no / total;
              odds[propId] = {
                yesOdds: calculateAmericanOdds(yesProbability),
                noOdds: calculateAmericanOdds(noProbability)
              };
            } else {
              odds[propId] = { yesOdds: '+100', noOdds: '+100' };
            }
          });

          setPropOdds(odds);
        }
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
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-yellow-900 mb-4">Loading your bets...</div>
        <BananaLoader />
      </div>
    );
  }

  return (
    <div className="relative">
      <BananaLoader /> {/* Add this at the top */}
      <div className="space-y-12 relative z-0">
        {/* Created Props Section - Now shown first */}
        {createdProps.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-yellow-900 mb-6">Banana Props You've Created</h2>
            {createdProps.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 relative z-10">
                {createdProps.map((prop) => (
                  <Link
                    key={prop.id}
                    to={`/prop/${prop.id}`}
                    className={`block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 relative group 
                    ${prop.result !== null
                        ? 'border-green-400 bg-green-50/50'  // Lighter green background
                        : 'border-green-400'
                      }`}
                  >
                    <div className="absolute top-4 right-4">
                      <button
                        onClick={(e) => handleDelete(prop.id, e)}
                        className="text-red-600 hover:text-red-800 relative"
                        title="Delete Prop"
                      >
                        <Trash2 className="h-5 w-5" />
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          Delete Prop
                        </span>
                      </button>
                    </div>
                    <h3 className="text-lg font-semibold text-yellow-900 mb-2 pr-20">{prop.name}</h3>
                    <div className="space-y-2 pb-16">
                      {prop.result !== null && (
                        <p className={`font-medium ${prop.result ? 'text-green-600' : 'text-red-600'}`}>
                          Result: {prop.result ? 'Yes' : 'No'}
                        </p>
                      )}
                      <p className="text-gray-600">
                        Expires: {format(new Date(prop.expiry_date), 'PPP')}
                      </p>
                      {propOdds[prop.id] && (
                        <div className="flex space-x-4 mt-2">
                          <span className="text-green-600 font-medium">
                            Yes: {propOdds[prop.id].yesOdds}
                          </span>
                          <span className="text-red-600 font-medium">
                            No: {propOdds[prop.id].noOdds}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-4 right-4">
                      <button
                        onClick={(e) => handleCopyLink(prop.id, e)}
                        className="flex items-center gap-1 text-yellow-600 hover:text-yellow-800 relative px-2 py-1 rounded-md hover:bg-yellow-50 border border-yellow-600"
                        title={copyTooltip[prop.id]}
                      >
                        <Share2 className="h-5 w-5" />
                        <span className="text-sm">Send to other monkeys</span>
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {copyTooltip[prop.id]}
                        </span>
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <p className="text-gray-600 mb-4">You haven't created any banana bets yet.</p>
                <Link
                  to="/create"
                  className="inline-block px-6 py-2 bg-yellow-400 text-yellow-900 rounded-md hover:bg-yellow-300 transition-colors"
                >
                  Create a Prop
                </Link>
              </div>
            )}
          </section>
        )}

        {/* Active Bets Section */}
        <section>
          <h2 className="text-2xl font-bold text-yellow-900 mb-6">Your Banana Wagers</h2>
          {activeBets.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeBets.map((bet) => (
                <Link
                  key={bet.id}
                  to={`/bet/${bet.prop_id}`}
                  className={`block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 
      ${bet.chimp_props?.deleted_at ? 'border-gray-400 opacity-60' : 'border-yellow-400'}`}
                >
                  {bet.chimp_props?.deleted_at ? (
                    <div className="text-gray-500">
                      <h3 className="text-lg font-semibold mb-2">Deleted: {bet.prop_name}</h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          Your Prediction: <span className={bet.prediction ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {bet.prediction ? 'Yes' : 'No'}
                          </span>
                        </p>
                        <p>Bananas Wagered: <span className="font-medium">{bet.bananas}</span></p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                        {bet.chimp_props?.name || 'Unknown Prop'}
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
                        {bet.chimp_props?.expiry_date && (
                          <p>
                            Expires: {format(new Date(bet.chimp_props.expiry_date), 'PPP')}
                          </p>
                        )}
                        {propOdds[bet.prop_id] && (
                          <p className="font-medium text-yellow-900">
                            Your Odds: {bet.prediction ? propOdds[bet.prop_id].yesOdds : propOdds[bet.prop_id].noOdds}
                          </p>
                        )}
                      </div>
                    </>
                  )}
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
    </div>
  );
}