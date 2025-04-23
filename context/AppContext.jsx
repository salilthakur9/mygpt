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
  const { user } = useUser();
  const { getToken } = useAuth();

  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);

  const createNewChat = async () => {
    try {
      if (!user) return null;

      const token = await getToken();
      const { data } = await axios.post(
        "/api/chat/create",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success && data.data) {
        return data.data;
      } else {
        toast.error(data.message || "Failed to create new chat");
        return null;
      }
    } catch (error) {
      toast.error(error.message);
      return null;
    }
  };

  const fetchUsersChats = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/chat/get", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success) {
        let chatList = data.data;

        if (chatList.length === 0) {
          const newChat = await createNewChat();
          if (newChat) {
            chatList = [newChat];
          } else {
            return; // Stop if no chat is created
          }
        }

        chatList.sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );
        setChats(chatList);
        setSelectedChat(chatList[0]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUsersChats();
    }
  }, [user]);

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
