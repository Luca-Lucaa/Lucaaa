import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

// Angepasste handleError-Funktion für useSnackbar
export const handleError = (error, showSnackbar) => {
  console.error("Fehler:", error);
  if (showSnackbar) {
    const message = error.message || "Ein Fehler ist aufgetreten.";
    showSnackbar(message, "error");
  }
};

export const useMessages = (loggedInUser, selectedUser, withRealtime = true) => {
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState({});

  const fetchMessages = async () => {
    if (!loggedInUser || !selectedUser) return;
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender.eq.${loggedInUser},receiver.eq.${selectedUser}),and(sender.eq.${selectedUser},receiver.eq.${loggedInUser})`
        )
        .order("created_at", { ascending: true });
      if (error) throw error;
      setMessages(data);

      // Zähle ungelesene Nachrichten vom Gesprächspartner
      const unread = data.filter(
        (msg) => msg.sender === selectedUser && !msg.read
      ).length;
      setUnreadCount((prev) => ({ ...prev, [selectedUser]: unread }));
    } catch (error) {
      handleError(error); // Ohne showSnackbar bleibt es bei console.error
    }
  };

  useEffect(() => {
    fetchMessages();
    if (!withRealtime || !loggedInUser) return;

    const subscription = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMessage = payload.new;
          setMessages((prev) => [...prev, newMessage]);
          if (
            newMessage.sender === selectedUser &&
            newMessage.receiver === loggedInUser
          ) {
            setUnreadCount((prev) => ({
              ...prev,
              [selectedUser]: (prev[selectedUser] || 0) + 1,
            }));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) =>
          setMessages((prev) =>
            prev.map((msg) => (msg.id === payload.new.id ? payload.new : msg))
          )
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages" },
        (payload) =>
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id))
      )
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [loggedInUser, selectedUser]);

  const markAsRead = async () => {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ read: true })
        .eq("receiver", loggedInUser)
        .eq("sender", selectedUser)
        .eq("read", false);
      if (error) throw error;
      setUnreadCount((prev) => ({ ...prev, [selectedUser]: 0 }));
      setMessages((prev) =>
        prev.map((msg) =>
          msg.sender === selectedUser && msg.receiver === loggedInUser && !msg.read
            ? { ...msg, read: true }
            : msg
        )
      );
    } catch (error) {
      handleError(error); // Ohne showSnackbar bleibt es bei console.error
    }
  };

  return { messages, unreadCount, fetchMessages, markAsRead };
};

export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

export const formatDate = (date) => {
  if (!date || isNaN(new Date(date).getTime())) return "NaN.NaN.NaN";
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}.${d.getFullYear()}`;
};

export const generateUsername = (owner) => {
  const randomNum = Math.floor(100 + Math.random() * 900);
  switch (owner) {
    case "Scholli":
      return `${randomNum}-telucod-5`;
    case "Jamaica05":
      return `${randomNum}-pricod-4`;
    case "Admin":
      return `${randomNum}-adlucod-0`;
    default:
      return `${randomNum}-siksuk`;
  }
};
