// src/types/user.ts

export interface Developer {
  id?: string;
  uid?: string;
  fullName: string;
  profession: string;
  github: string;
  linkedin: string;
  location: string;
  bio: string;
  skills: string[];
  photoURL?: string;
  followers?: string[];
  following?: string[];
  available?: boolean;
}

export interface UserData extends Developer {
  uid: string;
  email?: string;
}

export interface SimpleUser {
  id?: string;
  uid?: string;
  fullName: string;
  photoURL?: string;
  profession?: string;
}
