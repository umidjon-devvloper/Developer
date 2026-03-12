// src/types/chat.ts
import { SimpleUser } from "./user";

export interface Message {
  id: string;
  text: string;
  createdAt: any; // Firebase Timestamp or string
  
  // DM specific
  conversationId?: string;
  senderId?: string;
  readStatus?: Record<string, boolean>;
  
  // Community Chat specific
  uid?: string;
  displayName?: string;
  email?: string;
  color?: string;
  photoURL?: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt: any; // Firebase Timestamp
  updatedAt: any;
  participantDetails?: Record<string, SimpleUser>;
  
  // DM specific
  lastSenderUid?: string;
  unread?: Record<string, number>;
  otherUser?: {
    uid: string;
    fullName: string;
    profession: string;
    photoURL?: string;
  };
}
