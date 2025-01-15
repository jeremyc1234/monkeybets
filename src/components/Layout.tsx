import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Plus, LogOut } from 'lucide-react';
import { useAuth } from '../stores/auth';
import BananaLoader from './BananaLoader'; // Import BananaLoader

export default function Layout() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-yellow-50 z-50">
      <div className="relative">
        {/* Header Section */}
        <nav
          className="shadow-lg z-50"
          style={{
            backgroundImage: `url('/icon/HeaderLog.svg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            height: '4.5rem',
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="flex items-center">
                  {/* Add logo and logo_text side-by-side */}
                  <img
                    src="/icon/logo.svg"
                    alt="MonkeyBets Logo"
                    className="h-12 w-12 mr-2"
                  />
                  <img
                    src="/icon/logo_text.svg"
                    alt="MonkeyBets Text Logo"
                    className="h-14"
                  />
                </Link>
              </div>
              <div className="flex items-center space-x-4 ml-4">
                <Link
                  to="/create"
                  className="inline-flex items-center"
                >
                  <img
                    src="/icon/new_prop.svg"
                    alt="Create Bets"
                    className="h-14"
                  />
                  <span className="absolute inset-0 bg-yellow-300 rounded-full scale-0 transition-transform duration-300 ease-in-out hover:scale-100"></span>
                </Link>
                <button
                  onClick={signOut}
                  className="inline-flex items-center"
                >
                  <img
                    src="/icon/sign_out.svg"
                    alt="Sign Out"
                    className="h-14"
                  />
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* BananaLoader below the header */}
        <div className="relative z-0">
          <BananaLoader />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
