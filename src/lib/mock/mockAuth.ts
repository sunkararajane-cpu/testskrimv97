import { mockUsers } from './mockData';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getMockUsers = () => {
  try {
      const users = JSON.parse(localStorage.getItem('mock_db_users') || '[]');
      if (Array.isArray(users) && users.length > 0) return users;
  } catch(e) {}
  
  const defaultUsers = [
      { email: "chaiwala_sharma@gmail.com", password: "mypass123", username: "bappu_bhai", id: "user_1" },
      { email: "john@test.com", password: "hello123", username: "john", id: "user_2" },
      { email: "any@email.com", password: "any6chars", username: "any", id: "user_3" },
  ];
  localStorage.setItem('mock_db_users', JSON.stringify(defaultUsers));
  return defaultUsers;
}

export const mockLogin = async (identifier: string, password: string) => {
  await delay(1000);
  if (!identifier) {
    throw new Error("Please enter your email or phone number");
  }
  
  const isEmail = identifier.includes('@');
  // Removing strict email checks so phone numbers can pass
  
  if (!password) {
    throw new Error("Please enter your password");
  }
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }
  if (password === identifier) {
    throw new Error("Password cannot be the same as your email/phone");
  }
  
  const users = getMockUsers();
  const user = users.find(u => (u.email === identifier || u.phone === identifier) && u.password === password);
  if (!user) {
    throw new Error("Incorrect credentials");
  }

  const authUser = { id: user.id, email: user.email, username: user.username, displayName: user.username, avatar: "https://i.pravatar.cc/150?img=1" };
  localStorage.setItem("skrimchat_user", JSON.stringify(authUser));
  return authUser;
};

export const mockSignup = async (email: string, password: string, username: string, fullName?: string, phone?: string) => {
  await delay(1000);
  if (!email) throw new Error("Please enter your email");
  if (!email.includes('@') || !email.includes('.')) throw new Error("Please enter a valid email address");
  if (!password) throw new Error("Please enter your password");
  if (password.length < 6) throw new Error("Password must be at least 6 characters");
  if (password === email) throw new Error("Password cannot be the same as your email");
  if (!username) throw new Error("Please enter a username");
  
  const users = getMockUsers();
  if (users.find(u => u.email === email)) {
    throw new Error("Email already registered");
  }

  const newUser = { email, password, username, fullName, phone, id: `user_${Date.now()}` };
  users.push(newUser);
  localStorage.setItem('mock_db_users', JSON.stringify(users));

  const authUser = { id: newUser.id, email, username, displayName: fullName || username, avatar: "https://i.pravatar.cc/150?img=1" };
  // We don't save to skrimchat_user here, we wait for OTP!
  return authUser;
};

export const mockLogout = async () => {
  await delay(500);
  localStorage.removeItem("skrimchat_user");
  return true;
};

export const mockGoogleSignIn = async () => {
  await delay(800);
  const user = { ...mockUsers[1], email: "google.user@example.com" };
  localStorage.setItem("skrimchat_user", JSON.stringify(user));
  return user;
};

export const mockOTPSend = async (phone: string) => {
  await delay(1000);
  return { success: true, message: "OTP sent" };
};

export const mockOTPVerify = async (otp: string, pendingUser?: any) => {
  await delay(1000);
  if (otp.length === 6) {
    const userToSave = pendingUser || { ...mockUsers[2], phone: "Verified" };
    localStorage.setItem("skrimchat_user", JSON.stringify(userToSave));
    return userToSave;
  }
  throw new Error("Please enter complete 6-digit code");
};
