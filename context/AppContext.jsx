"use client";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

export const AppContext = createContext();

export const useAppContext = () => {
  return useContext(AppContext);
};

export const AppContextProvider = ({ children }) => {
  const { user, isLoaded: userLoaded } = useUser();
  const { getToken, isLoaded: tokenLoaded } = useAuth();

  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);

  // Ensure both user and token are loaded before proceeding with any API requests
  const isReady = userLoaded && tokenLoaded && user;

  const createNewChat = async () => {
    if (!isReady) {
      console.log("❌ User or token not ready");
      toast.error("User not authenticated or session not loaded.");
      return null;
    }

    try {
      const token = await getToken();
      console.log("🔐 Creating a new chat with token:", token);

      const { data } = await axios.post(
        "/api/chat/create",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("📝 Response from /api/chat/create:", data);

      if (data.success && data.data) {
        console.log("✅ New chat created:", data.data);
        return data.data;
      } else {
        console.log("❌ Chat creation failed. Message:", data.message);
        toast.error(data.message || "Failed to create new chat");
        return null;
      }
    } catch (error) {
      console.error("🚨 Error during chat creation:", error.message);
      toast.error(error.message || "An error occurred while creating a chat.");
      return null;
    }
  };

  const fetchUsersChats = async () => {
    if (!isReady) {
      console.log("❌ User or token not ready");
      toast.error("User not authenticated or session not loaded.");
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        console.log("❌ No token found.");
        toast.error("Failed to acquire token.");
        return;
      }

      console.log("🔐 Token acquired:", token);

      const { data } = await axios.get("/api/chat/get", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("📨 Response from /api/chat/get:", data);

      if (data.success) {
        let chatList = data.data;

        if (!Array.isArray(chatList)) {
          console.log("⚠️ chatList is not an array:", chatList);
          toast.error("Unexpected chat data format.");
          return;
        }

        if (chatList.length === 0) {
          console.log("📭 No chats found. Creating a new one...");
          const newChat = await createNewChat();
          if (newChat) {
            chatList = [newChat];
            console.log("✅ New chat created:", newChat);
          } else {
            console.log("❌ Chat creation failed.");
            toast.error("Failed to create a new chat.");
            return;
          }
        }

        chatList.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        console.log("📊 Sorted chatList:", chatList);

        setChats(chatList);
        setSelectedChat(chatList[0]);
        console.log("🎯 selectedChat set:", chatList[0]);
      } else {
        toast.error(data.message || "Failed to fetch chats.");
      }
    } catch (error) {
      console.error("🚨 fetchUsersChats error:", error.message);
      toast.error(error.message || "An error occurred while fetching chats.");
    }
};


  useEffect(() => {
    if (isReady) {
      console.log("🟢 User is logged in:", user);
      fetchUsersChats();
    } else {
      console.log("🔴 No user detected or session not loaded");
    }
  }, [isReady, user]);

  const value = {
    user,
    chats,
    setChats,
    selectedChat,
    setSelectedChat,
    fetchUsersChats,
    createNewChat,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
