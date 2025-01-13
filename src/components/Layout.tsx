import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Banana, Plus, LogOut } from 'lucide-react';
import { useAuth } from '../stores/auth';

export default function Layout() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-yellow-50">
      <nav className="bg-yellow-400 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center">
                <Banana className="h-8 w-8 text-yellow-900" />
                <span className="ml-2 text-2xl font-bold text-yellow-900">MonkeyBets</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/create"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-900 bg-yellow-300 hover:bg-yellow-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Prop
              </Link>
              <button
                onClick={signOut}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-900 bg-yellow-300 hover:bg-yellow-200"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}