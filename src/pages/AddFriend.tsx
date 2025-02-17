import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AddFriend = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    try {
      // First, find the user by username
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', username.trim())
        .neq('id', user?.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          toast.error('User not found. Please check the username.');
        } else {
          throw profileError;
        }
        return;
      }

      // Check if friendship already exists
      const { data: existingFriendship, error: checkError } = await supabase
        .from('friendships')
        .select('*')
        .match({
          user_id: user?.id,
          friend_id: profiles.id
        })
        .single();

      if (existingFriendship) {
        toast.error('You have already sent a friend request to this user');
        return;
      }

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      // Send friend request
      const { error: friendshipError } = await supabase
        .from('friendships')
        .insert([
          {
            user_id: user?.id,
            friend_id: profiles.id,
            status: 'pending'
          }
        ]);

      if (friendshipError) throw friendshipError;

      toast.success('Friend request sent successfully!');
      setUsername('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send friend request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center mb-8">
            <UserPlus className="h-8 w-8 text-indigo-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Add a Friend</h1>
          </div>

          <form onSubmit={handleAddFriend} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Enter Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your friend's username"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Sending Request...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  <span>Send Friend Request</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Users className="h-5 w-5" />
              <h2 className="font-medium">How to Add Friends</h2>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 text-sm">
              <li>Ask your friend for their username</li>
              <li>Enter their username in the field above</li>
              <li>Click "Send Friend Request"</li>
              <li>Wait for them to accept your request</li>
            </ol>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AddFriend;