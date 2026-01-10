// app/context/AuthContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService, User as ApiUser, LoginCredentials, RegisterData } from '../services/api';

// Update the User interface
interface User {
  id: string;
  email?: string;
  phone?: string;
  full_name: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: string;
  provider?: string;
  is_verified?: boolean;
  is_active?: boolean;
  createdAt?: string;
  shippingAddress?: {
    address: string;
    city: string;
    district: string;
    khoroo: string;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<{ success: boolean; user?: User; token?: string }>;
  loginWithFacebook: (accessToken: string, userId: string, email?: string, name?: string) => Promise<{ success: boolean; user?: User; token?: string }>;
  refreshToken: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to convert API user to app user
const convertApiUserToUser = (apiUser: ApiUser): User => ({
  id: apiUser.id.toString(),
  email: apiUser.email,
  phone: apiUser.phone,
  full_name: apiUser.full_name,
  firstName: apiUser.firstName || apiUser.full_name?.split(' ')[0],
  lastName: apiUser.lastName || apiUser.full_name?.split(' ').slice(1).join(' '),
  avatar: apiUser.avatar,
  role: apiUser.role,
  provider: apiUser.provider,
  is_verified: apiUser.is_verified,
  is_active: apiUser.is_active,
  createdAt: apiUser.created_at,
  shippingAddress: apiUser.shippingAddress
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          // Verify token by fetching current user
          const response = await apiService.getCurrentUser();
          // Handle both response formats: { success: true, user: ... } or { data: User }
          const user = response.user || (response.success !== false ? response.data : null);
          if (user) {
            const userData = convertApiUserToUser(user);
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          } else if (response.success === false) {
            // Explicit failure, clear storage
            clearAuthStorage();
          } else {
            // No user data but no explicit failure - might be old API format
            // Try to restore from localStorage
            try {
              const userData = JSON.parse(storedUser);
              setUser(userData);
            } catch (parseError) {
              console.error('Failed to parse stored user:', parseError);
              clearAuthStorage();
            }
          }
        } catch (error: any) {
          console.error('Auth check failed:', error);
          
          // Only clear auth if it's a 401 (Unauthorized) or 403 (Forbidden) error
          // For other errors (network, server issues), keep user logged in with stored data
          const isUnauthorized = error?.status === 401 || 
                                 error?.status === 403 ||
                                 error?.message?.includes('401') || 
                                 error?.message?.includes('403') ||
                                 error?.message?.includes('Unauthorized') ||
                                 error?.message?.includes('Forbidden');
          
          if (isUnauthorized) {
            // Token is invalid - try to refresh if we have a refresh token
            const storedRefreshToken = localStorage.getItem('refresh_token');
            if (storedRefreshToken) {
              try {
                const refreshResponse = await apiService.refreshToken(storedRefreshToken);
                if (refreshResponse.success && refreshResponse.token) {
                  localStorage.setItem('token', refreshResponse.token);
                  if (refreshResponse.data?.refresh_token) {
                    localStorage.setItem('refresh_token', refreshResponse.data.refresh_token);
                  }
                  // Update user data if provided, otherwise restore from storage
                  if (refreshResponse.user) {
                    const userData = convertApiUserToUser(refreshResponse.user);
                    localStorage.setItem('user', JSON.stringify(userData));
                    setUser(userData);
                  } else {
                    const userData = JSON.parse(storedUser);
                    setUser(userData);
                  }
                } else {
                  throw new Error('Token refresh failed');
                }
              } catch (refreshError) {
                // Refresh failed, clear storage
                console.error('Token refresh failed:', refreshError);
                clearAuthStorage();
              }
            } else {
              // No refresh token, clear storage
              clearAuthStorage();
            }
          } else {
            // Network or other error - restore user from localStorage to keep them logged in
            try {
              const userData = JSON.parse(storedUser);
              setUser(userData);
            } catch (parseError) {
              console.error('Failed to parse stored user:', parseError);
              clearAuthStorage();
            }
          }
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const clearAuthStorage = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await apiService.login(credentials);
      
      if (response.success && response.token && response.user) {
        const userData = convertApiUserToUser(response.user);
        
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        if (response.data?.refresh_token) {
          localStorage.setItem('refresh_token', response.data.refresh_token);
        }
        
        setUser(userData);
      } else {
        throw new Error(response.message || 'Нэвтрэхэд алдаа гарлаа');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Нэвтрэхэд алдаа гарлаа');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await apiService.register(data);
      
      if (response.success && response.token && response.user) {
        const userData = convertApiUserToUser(response.user);
        
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        if (response.data?.refresh_token) {
          localStorage.setItem('refresh_token', response.data.refresh_token);
        }
        
        setUser(userData);
      } else {
        throw new Error(response.message || 'Бүртгүүлэхэд алдаа гарлаа');
      }
    } catch (error: any) {
      console.error('Register error:', error);
      throw new Error(error.message || 'Бүртгүүлэхэд алдаа гарлаа');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      clearAuthStorage();
    }
  };

 // app/context/AuthContext.tsx - Updated loginWithGoogle function
 const loginWithGoogle = async (): Promise<{ success: boolean; user?: User; token?: string }> => {
  try {
    console.log('🔄 Starting Google OAuth...');
    
    // Always use your backend API to get the auth URL
    const response = await apiService.getGoogleAuthUrl();
    console.log('Backend response:', response);
    
    const authUrl = response.data?.auth_url || (response as any).auth_url;
    
    if (!response.success || !authUrl) {
      throw new Error(response.message || 'Failed to get Google auth URL');
    }
    
    console.log('✅ Google auth URL received:', authUrl);
    
    // Create a unique ID for this authentication session
    const authSessionId = `google_auth_${Date.now()}`;
    
    // Open popup
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const popup = window.open(
      authUrl,
      authSessionId,
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
    );

    if (!popup) {
      throw new Error('Popup was blocked by the browser. Please allow popups for this site.');
    }

    return new Promise((resolve, reject) => {
      let timeout: NodeJS.Timeout;
      let pollInterval: NodeJS.Timeout;
      
      // Method 1: Poll for popup closure (fallback method)
      const pollPopup = () => {
        if (!popup || popup.closed) {
          clearInterval(pollInterval);
          clearTimeout(timeout);
          
          // Check if we have auth data in localStorage (set by callback page)
          const authData = localStorage.getItem('google_auth_data');
          if (authData) {
            try {
              const { token, refresh_token, user } = JSON.parse(authData);
              localStorage.removeItem('google_auth_data');
              
              if (token && user) {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                if (refresh_token) {
                  localStorage.setItem('refresh_token', refresh_token);
                }
                
                const userData = convertApiUserToUser(user);
                setUser(userData);
                
                resolve({ 
                  success: true, 
                  user: userData, 
                  token 
                });
              } else {
                reject(new Error('Invalid auth data'));
              }
            } catch (error) {
              reject(new Error('Failed to parse auth data'));
            }
          } else {
            reject(new Error('Authentication cancelled or failed'));
          }
        }
      };
      
      // Start polling
      pollInterval = setInterval(pollPopup, 500);
      
      // Method 2: Listen for postMessage
      const messageHandler = (event: MessageEvent) => {
        // Accept messages from all origins for development, but check data structure
        if (event.data && event.data.type) {
          console.log('Received message:', event.data.type, 'from origin:', event.origin);
          
          if (event.data.type === 'google_auth_success') {
            clearInterval(pollInterval);
            clearTimeout(timeout);
            window.removeEventListener('message', messageHandler);
            
            const { token, refresh_token, user } = event.data;
            
            if (token && user) {
              localStorage.setItem('token', token);
              localStorage.setItem('user', JSON.stringify(user));
              if (refresh_token) {
                localStorage.setItem('refresh_token', refresh_token);
              }
              
              const userData = convertApiUserToUser(user);
              setUser(userData);
              
              // Try to close popup
              try {
                if (popup && !popup.closed) {
                  popup.close();
                }
              } catch (e) {
                console.warn('Could not close popup:', e);
              }
              
              resolve({ 
                success: true, 
                user: userData, 
                token 
              });
            } else {
              reject(new Error('Invalid auth data received'));
            }
          } else if (event.data.type === 'google_auth_error') {
            clearInterval(pollInterval);
            clearTimeout(timeout);
            window.removeEventListener('message', messageHandler);
            
            // Try to close popup
            try {
              if (popup && !popup.closed) {
                popup.close();
              }
            } catch (e) {
              console.warn('Could not close popup:', e);
            }
            
            reject(new Error(event.data.message || 'Authentication failed'));
          }
        }
      };
      
      window.addEventListener('message', messageHandler);
      
      // Timeout after 120 seconds
      timeout = setTimeout(() => {
        clearInterval(pollInterval);
        window.removeEventListener('message', messageHandler);
        
        if (popup && !popup.closed) {
          try {
            popup.close();
          } catch (e) {
            console.warn('Could not close popup on timeout:', e);
          }
        }
        
        reject(new Error('Authentication timeout'));
      }, 120000);
      
    });
    
  } catch (error: any) {
    console.error('Google login error:', error);
    return { 
      success: false, 
      user: undefined, 
      token: undefined 
    };
  }
};
  
  const loginWithFacebook = async (
    accessToken: string, 
    userId: string, 
    email?: string, 
    name?: string
  ): Promise<{ success: boolean; user?: User; token?: string }> => {
    try {
      const response = await apiService.facebookLogin({
        accessToken,
        userId,
        email,
        name
      });

      if (response.success && response.token && response.user) {
        const userData = convertApiUserToUser(response.user);
        
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        return { 
          success: true, 
          user: userData, 
          token: response.token 
        };
      } else {
        throw new Error(response.message || 'Facebook authentication failed');
      }
    } catch (error: any) {
      console.error('Facebook login error:', error);
      return { 
        success: false, 
        user: undefined, 
        token: undefined 
      };
    }
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token found');
      }

      const response = await apiService.refreshToken(refreshToken);
      
      if (response.success && response.token) {
        localStorage.setItem('token', response.token);
        
        if (response.data?.refresh_token) {
          localStorage.setItem('refresh_token', response.data.refresh_token);
        }
        
        // Update user data if provided
        if (response.user) {
          const userData = convertApiUserToUser(response.user);
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
        }
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Refresh token error:', error);
      clearAuthStorage();
      throw error;
    }
  };

  const updateUserProfile = async (data: Partial<User>) => {
    try {
      const response = await apiService.updateProfile(data);
      
      // Handle both response formats: { success: true, data: ... } or { user: ... }
      if (response.success && response.data) {
        const updatedUser = { ...user!, ...data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else if (response.user) {
        // Backend returns { message: '...', user: ... }
        const userData = convertApiUserToUser(response.user);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      } else if (response.success !== false) {
        // If no explicit failure, update with provided data
        const updatedUser = { ...user!, ...data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const response = await apiService.changePassword(currentPassword, newPassword);
      
      if (!response.success) {
        throw new Error(response.message || 'Password change failed');
      }
    } catch (error: any) {
      console.error('Change password error:', error);
      throw error;
    }
  };

  // Auto-refresh token when about to expire
  useEffect(() => {
    const checkTokenExpiry = () => {
      const token = localStorage.getItem('token');
      if (!token || !user) return;

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiryTime = payload.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const timeUntilExpiry = expiryTime - currentTime;

        // Refresh token if it expires in less than 5 minutes
        if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
          refreshToken().catch(console.error);
        }
      } catch (error) {
        console.error('Token expiry check error:', error);
      }
    };

    // Check every minute
    const interval = setInterval(checkTokenExpiry, 60000);
    checkTokenExpiry(); // Initial check

    return () => clearInterval(interval);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        loginWithGoogle,
        loginWithFacebook,
        refreshToken,
        updateUserProfile,
        changePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};