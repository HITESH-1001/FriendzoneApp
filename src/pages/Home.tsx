import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Heart, UserPlus, Share2 } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Connect with Friends on FriendZone
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Find and connect with people who share your interests
          </p>
          
          <div className="flex justify-center space-x-4 mb-12">
            <Link
              to="/register"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium text-lg transition-colors"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="bg-white hover:bg-gray-50 text-indigo-600 px-8 py-3 rounded-lg font-medium text-lg transition-colors border border-indigo-600"
            >
              Sign In
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16"
        >
          <div className="bg-white p-6 rounded-xl shadow-md">
            <Users className="h-12 w-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Find Friends</h3>
            <p className="text-gray-600">
              Discover people with similar interests and hobbies
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <Heart className="h-12 w-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Share Interests</h3>
            <p className="text-gray-600">
              Connect based on mutual interests and activities
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <Share2 className="h-12 w-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Stay Connected</h3>
            <p className="text-gray-600">
              Keep in touch with your friends and make new connections
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;