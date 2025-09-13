import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      let users = JSON.parse(localStorage.getItem('vida_smart_users'));

      if (!users) {
        users = [];
      }

      const adminExists = users.some(u => u.email === 'admin@vidasmart.com');

      if (!adminExists) {
        const adminUser = {
          id: 'admin_user',
          email: 'admin@vidasmart.com',
          password: 'admin123',
          role: 'admin',
          name: 'Admin'
        };
        users.push(adminUser);
        localStorage.setItem('vida_smart_users', JSON.stringify(users));
      }

      const savedUser = localStorage.getItem('vida_smart_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Failed to initialize auth:", error);
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (email, password) => {
    const users = JSON.parse(localStorage.getItem('vida_smart_users') || '[]');
    const foundUser = users.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('vida_smart_user', JSON.stringify(foundUser));
      return { success: true, user: foundUser };
    }
    
    return { success: false, error: 'Credenciais inválidas' };
  };

  const register = (userData) => {
    const users = JSON.parse(localStorage.getItem('vida_smart_users') || '[]');
    const existingUser = users.find(u => u.email === userData.email);
    
    if (existingUser) {
      return { success: false, error: 'Email já cadastrado' };
    }
    
    const newUser = {
      id: `user_id_${Date.now()}`,
      ...userData,
      role: 'client',
      plan: 'trial',
      createdAt: new Date().toISOString(),
      profile: {
        startWeight: 80,
        currentWeight: 80,
        targetWeight: 75,
        height: 175,
        age: 30,
        gender: 'male',
        activityLevel: 'sedentary'
      },
      progress: {
        points: 50,
        level: 1,
        achievements: [],
      }
    };
    
    users.push(newUser);
    localStorage.setItem('vida_smart_users', JSON.stringify(users));
    setUser(newUser);
    localStorage.setItem('vida_smart_user', JSON.stringify(newUser));
    
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vida_smart_user');
  };

  const updateUser = (updates) => {
    if (!user) return;
  
    const updatedUser = {
      ...user,
      ...updates,
      profile: {
        ...user.profile,
        ...(updates.profile || {}),
      },
      progress: {
        ...user.progress,
        ...(updates.progress || {}),
      }
    };
    
    // Remove nested objects from top-level updates object to avoid duplication
    delete updatedUser.profile;
    delete updatedUser.progress;

    setUser(updatedUser);
    localStorage.setItem('vida_smart_user', JSON.stringify(updatedUser));
    
    const users = JSON.parse(localStorage.getItem('vida_smart_users') || '[]');
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex] = updatedUser;
      localStorage.setItem('vida_smart_users', JSON.stringify(users));
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};