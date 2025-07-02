import React from 'react';
import { Link } from 'react-router-dom';

/**
 * A simple 404 Not Found page for handling invalid URLs.
 */
export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center">
      <h1 className="text-6xl font-extrabold text-athletiq-navy">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mt-2">Page Not Found</h2>
      <p className="text-gray-500 mt-4">
        Sorry, the page you are looking for does not exist.
      </p>
      <Link
        to="/"
        className="mt-8 px-6 py-3 bg-athletiq-green text-white font-bold rounded-lg hover:bg-green-700"
      >
        Go Back Home
      </Link>
    </div>
  );
}