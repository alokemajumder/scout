import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, LocalUser, SocialUser, SignupCredentials } from '@/lib/types/user';

// Simple JSON file-based storage for development
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize files if they don't exist
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, '[]');
}

if (!fs.existsSync(SESSIONS_FILE)) {
  fs.writeFileSync(SESSIONS_FILE, '[]');
}

interface SessionRecord {
  sessionId: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

class SimpleUserRepository {
  
  private readUsers(): User[] {
    try {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading users:', error);
      return [];
    }
  }

  private writeUsers(users: User[]): void {
    try {
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (error) {
      console.error('Error writing users:', error);
    }
  }

  private readSessions(): SessionRecord[] {
    try {
      const data = fs.readFileSync(SESSIONS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading sessions:', error);
      return [];
    }
  }

  private writeSessions(sessions: SessionRecord[]): void {
    try {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
    } catch (error) {
      console.error('Error writing sessions:', error);
    }
  }

  async findById(id: string): Promise<User | null> {
    const users = this.readUsers();
    return users.find(user => user.id === id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const users = this.readUsers();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async findByProviderId(provider: string, providerId: string): Promise<User | null> {
    const users = this.readUsers();
    return users.find(user => user.provider === provider && user.providerId === providerId) || null;
  }

  async createLocalUser(credentials: SignupCredentials): Promise<LocalUser> {
    const users = this.readUsers();
    
    // Check if user already exists
    const existingUser = users.find(u => u.email.toLowerCase() === credentials.email.toLowerCase());
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(credentials.password, saltRounds);

    const user: LocalUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: credentials.email.toLowerCase(),
      name: credentials.name,
      provider: 'local',
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isEmailVerified: false,
      preferences: {
        currency: 'INR',
        language: 'en',
        notifications: true
      }
    };

    users.push(user);
    this.writeUsers(users);
    return user;
  }

  async createSocialUser(socialData: {
    email: string;
    name: string;
    avatar?: string;
    provider: 'google' | 'facebook' | 'apple' | 'twitter';
    providerId: string;
  }): Promise<SocialUser> {
    const users = this.readUsers();
    
    const user: SocialUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: socialData.email.toLowerCase(),
      name: socialData.name,
      avatar: socialData.avatar,
      provider: socialData.provider,
      providerId: socialData.providerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isEmailVerified: true, // Social accounts are pre-verified
      preferences: {
        currency: 'INR',
        language: 'en',
        notifications: true
      }
    };

    users.push(user);
    this.writeUsers(users);
    return user;
  }

  async linkSocialAccount(userId: string, provider: string, providerId: string): Promise<void> {
    const users = this.readUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    users[userIndex] = {
      ...users[userIndex],
      providerId,
      updatedAt: new Date().toISOString()
    };

    this.writeUsers(users);
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const users = this.readUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.writeUsers(users);
    return users[userIndex];
  }

  async deleteUser(userId: string): Promise<void> {
    const users = this.readUsers();
    const filteredUsers = users.filter(u => u.id !== userId);
    this.writeUsers(filteredUsers);
  }

  async createSession(userId: string, expiresAt: Date): Promise<string> {
    const sessions = this.readSessions();
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    const session: SessionRecord = {
      sessionId,
      userId,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString()
    };

    sessions.push(session);
    this.writeSessions(sessions);
    return sessionId;
  }

  async findSession(sessionId: string): Promise<SessionRecord | null> {
    const sessions = this.readSessions();
    return sessions.find(s => s.sessionId === sessionId) || null;
  }

  async deleteSession(sessionId: string): Promise<void> {
    const sessions = this.readSessions();
    const filteredSessions = sessions.filter(s => s.sessionId !== sessionId);
    this.writeSessions(filteredSessions);
  }

  async cleanExpiredSessions(): Promise<void> {
    const sessions = this.readSessions();
    const now = new Date();
    
    const activeSessions = sessions.filter(session => 
      new Date(session.expiresAt) >= now
    );

    this.writeSessions(activeSessions);
  }
}

export const userRepository = new SimpleUserRepository();

// Clean up expired sessions every hour
if (typeof window === 'undefined') {
  setInterval(() => {
    userRepository.cleanExpiredSessions().catch(console.error);
  }, 60 * 60 * 1000);
}