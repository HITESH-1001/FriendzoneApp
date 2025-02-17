import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, UserX, UserPlus, Clock, MessageCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import Chat from '../components/Chat';

interface Friend {
  id: string;
  username: string;
  full_name: string;
  interests: string[];
  status: string;
}

interface PendingRequest {
  id: string;
  username: string;
  full_name: string;
  friendship_id: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null); // Track selected chat friend

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchPendingRequests();
    }
  }, [user]);

  const fetchFriends = async () => {
    try {
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select(`
          friend_id,
          status,
          profiles!friendships_friend_id_fkey (
            id,
            username,
            full_name,
            interests
          )
        `)
        .eq('user_id', user?.id)
        .eq('status', 'accepted');

      if (friendshipsError) throw friendshipsError;

      const friends = friendships.map((friendship) => ({
        id: friendship.profiles.id,
        username: friendship.profiles.username,
        full_name: friendship.profiles.full_name,
        interests: friendship.profiles.interests,
        status: friendship.status,
      }));

      setFriends(friends);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch friends');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const { data: requests, error } = await supabase
        .from('friendships')
        .select(`
          id,
          user_id,
          profiles!friendships_user_id_fkey (
            id,
            username,
            full_name
          )
        `)
        .eq('friend_id', user?.id)
        .eq('status', 'pending');

      if (error) throw error;

      setPendingRequests(
        requests.map((request) => ({
          id: request.profiles.id,
          username: request.profiles.username,
          full_name: request.profiles.full_name,
          friendship_id: request.id,
        }))
      );
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch pending requests');
    }
  };

  const handleFriendRequest = async (friendship_id: string, action: 'accept' | 'decline') => {
    try {
      if (action === 'accept') {
        const { error } = await supabase
          .from('friendships')
          .update({ status: 'accepted' })
          .eq('id', friendship_id);

        if (error) throw error;

        const acceptedFriend = pendingRequests.find((req) => req.friendship_id === friendship_id);
        if (acceptedFriend) {
          setFriends((prevFriends) => [
            ...prevFriends,
            { ...acceptedFriend, interests: [], status: 'accepted' },
          ]);
        }

        toast.success('Friend request accepted!');
      } else {
        const { error } = await supabase.from('friendships').delete().eq('id', friendship_id);
        if (error) throw error;
        toast.success('Friend request declined.');
      }

      setPendingRequests((prevRequests) => prevRequests.filter((req) => req.friendship_id !== friendship_id));
    } catch (error: any) {
      toast.error(error.message || 'Failed to process request');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Pending Requests Section */}
        {pendingRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center mb-6">
              <Clock className="h-8 w-8 text-yellow-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-900">Pending Friend Requests</h2>
            </div>

            <div className="grid gap-4">
              {pendingRequests.map((request) => (
                <motion.div
                  key={request.friendship_id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-between bg-gray-50 rounded-lg p-4"
                >
                  <div className="flex items-center">
                    <Users className="h-6 w-6 text-yellow-600" />
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold">{request.full_name}</h3>
                      <p className="text-sm text-gray-500">@{request.username}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFriendRequest(request.friendship_id, 'accept')}
                      className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      <UserCheck className="h-4 w-4" /> Accept
                    </button>
                    <button
                      onClick={() => handleFriendRequest(request.friendship_id, 'decline')}
                      className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      <UserX className="h-4 w-4" /> Decline
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Friends List Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Your Friends</h1>
            </div>
            <Link to="/add-friend" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
              <UserPlus className="h-4 w-4" /> Add Friends
            </Link>
          </div>

          {loading ? (
            <p className="text-center text-gray-600">Loading friends...</p>
          ) : friends.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {friends.map((friend) => (
                <motion.div key={friend.id} className="bg-gray-50 rounded-lg p-6 shadow-sm flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{friend.full_name}</h3>
                    <p className="text-sm text-gray-500">@{friend.username}</p>
                  </div>
                  <button onClick={() => setSelectedFriend(friend)} className="bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600">
                    <MessageCircle className="h-5 w-5" /> Chat
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">No friends yet.</p>
          )}
        </motion.div>

        {/* Chat Section */}
        {selectedFriend && (
          <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-xl w-80">
            <div className="flex justify-between items-center p-4 bg-indigo-500 text-white rounded-t-xl">
              <h3 className="text-lg font-semibold">{selectedFriend.full_name}</h3>
              <button onClick={() => setSelectedFriend(null)}><XCircle className="h-6 w-6" /></button>
            </div>
            <Chat friend={selectedFriend} onClose={() => setSelectedFriend(null)} />
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;


