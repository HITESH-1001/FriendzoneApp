

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at: string;
  seen: boolean;
}

const Chat = ({ friend, onClose }: { friend: { id: string; full_name: string }; onClose: () => void }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get authenticated user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error);
        return;
      }
      setCurrentUser(user?.id || null);
    };

    fetchUser();
  }, []);
  useEffect(() => {
    if (!currentUser || !friend.id) return;
  
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${currentUser},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${currentUser})`
        )
        .order("created_at", { ascending: true });
  
      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }
  
      setMessages(data || []);
      scrollToBottom();
    };
  
    fetchMessages();
  
    // ✅ Update "seen" when the receiver opens the chat
    const markMessagesAsSeen = async () => {
      if (!currentUser) return;
  
      const { error } = await supabase
        .from("messages")
        .update({ seen: true })
        .match({ receiver_id: currentUser, seen: false }); // ✅ Only mark unseen messages
  
      if (error) console.error("Error updating seen messages:", error);
      else fetchMessages(); // ✅ Force refresh after updating
    };
  
    markMessagesAsSeen();
  
    // ✅ Subscribe to real-time updates for both "INSERT" & "UPDATE" events
    const subscription = supabase
      .channel("messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages((prev) =>
          prev.some((msg) => msg.id === newMsg.id) ? prev : [...prev, newMsg]
        );
        scrollToBottom();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, async (payload) => {
        const updatedMsg = payload.new as Message;
        setMessages((prev) =>
          prev.map((msg) => (msg.id === updatedMsg.id ? updatedMsg : msg))
        );
  
        // ✅ If the message was marked as "seen", refresh the messages
        // if (updatedMsg.seen) {
        //   fetchMessages();
        // }
      })
      .subscribe();
  
    return () => {
     // supabase.removeChannel(subscription);
      subscription.unsubscribe();
    };
  }, [currentUser, friend.id]);
  
 
  

  // Close chat when the Escape key is pressed
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);



  // const sendMessage = async () => {
  //   if (!newMessage.trim() || !currentUser) return;
  
  //   try {
  //     const { error } = await supabase.from("messages").insert([
  //       {
  //         sender_id: currentUser,
  //         receiver_id: friend.id,
  //         text: newMessage.trim(),
  //         seen: false,
  //       },
  //     ]);
  
  //     if (error) throw error;
  
  //     setNewMessage(""); // Clear input only after message is sent
  //     inputRef.current?.focus(); // Keep input focused
  
  //   } catch (error) {
  //     console.error("Error sending message:", error);
  //   }
  // };
  
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;
  
    const messageToSend = {
      id: crypto.randomUUID(), // temporary id
      sender_id: currentUser,
      receiver_id: friend.id,
      text: newMessage.trim(),
      seen: false,
      created_at: new Date().toISOString(),
    };
  
    // 🔥 Optimistically add to UI
    setMessages((prev) => [...prev, messageToSend]);
  
    setNewMessage("");
    inputRef.current?.focus();
    scrollToBottom();
  
    try {
      const { error } = await supabase.from("messages").insert([messageToSend]);
  
      if (error) throw error;
  
      // Replaced by real-time update anyway, no need to re-fetch
    } catch (error) {
      console.error("Error sending message:", error);
      // Optional: remove the message or show error
    }
  };
  // Handle Enter key press
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  // Scroll to the latest message
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white shadow-lg rounded-lg overflow-hidden flex flex-col">
      {/* Chat Header */}
      <div className="bg-indigo-600 text-white p-3 flex justify-between items-center">
        <span className="font-semibold">{friend.full_name}</span>
        <button
          onClick={onClose}
          className="text-white hover:bg-red-600 p-1 rounded-full"
        >
          ✕
        </button>
      </div>

      {/* Chat Messages */}
      <div className="p-3 h-64 overflow-y-auto flex flex-col space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-2 rounded-lg text-white max-w-[70%] flex flex-col gap-1 ${
              msg.sender_id === currentUser ? "bg-indigo-500 self-end" : "bg-gray-400 self-start"
            }`}
          >
            <span>{msg.text}</span>
            <span className="text-xs text-gray-200 self-end">
            {new Date(msg.created_at).toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })} 
     {msg.sender_id === currentUser ? (msg.seen ? " • Seen" : " • Sent") : ""}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Message Input */}
      <div className="p-3 border-t flex items-center">
        <input
          type="text"
          ref={inputRef}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded-l-lg focus:outline-none"
        />
        <button
          onClick={sendMessage}
          className="bg-indigo-600 text-white px-3 py-2 rounded-r-lg disabled:bg-gray-400"
          disabled={!newMessage.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
