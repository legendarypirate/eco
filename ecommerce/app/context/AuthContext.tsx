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
    
    try {
      // 1. Try to get Google auth URL from backend
      const response = await apiService.getGoogleAuthUrl();
      console.log('Backend response:', response);
      
      if (response.success && response.data?.auth_url) {
        console.log('✅ Google auth URL received');
        
        // 2. Open Google auth in popup
        const width = 500;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const popup = window.open(
          response.data.auth_url,
          'google_auth',
          `width=${width},height=${height},top=${top},left=${left}`
        );

        if (!popup) {
          throw new Error('Popup blocked. Please allow popups for this site.');
        }

        // 3. Wait for popup using postMessage listener
        return new Promise((resolve, reject) => {
          let timeout: NodeJS.Timeout;
          let interval: NodeJS.Timeout;
          
          // Listen for messages from popup
          const messageHandler = (event: MessageEvent) => {
            // Security: Only accept messages from expected origins
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const apiBaseUrl = apiUrl.replace('/api', '');
            const allowedOrigins = [
              'http://localhost:3000',
              apiBaseUrl,
              window.location.origin
            ];
            
            if (!allowedOrigins.includes(event.origin)) {
              console.warn('Ignoring message from unauthorized origin:', event.origin);
              return;
            }
            
            if (event.data.type === 'google_auth_success') {
              console.log('✅ Google auth success message received');
              
              // Clean up
              window.removeEventListener('message', messageHandler);
              clearTimeout(timeout);
              if (interval) clearInterval(interval);
              
              // Store auth data
              const { token, refresh_token, user } = event.data;
              
              if (token && user) {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                if (refresh_token) {
                  localStorage.setItem('refresh_token', refresh_token);
                }
                
                const userData = convertApiUserToUser(user);
                setUser(userData);
                
                // Close popup if still open
                if (popup && !popup.closed) {
                  popup.close();
                }
                
                resolve({ 
                  success: true, 
                  user: userData, 
                  token: token 
                });
              } else {
                reject(new Error('Invalid auth data received'));
              }
            } else if (event.data.type === 'google_auth_error') {
              console.error('❌ Google auth error:', event.data.message);
              
              // Clean up
              window.removeEventListener('message', messageHandler);
              clearTimeout(timeout);
              if (interval) clearInterval(interval);
              
              // Close popup if still open
              if (popup && !popup.closed) {
                popup.close();
              }
              
              reject(new Error(event.data.message || 'Authentication failed'));
            }
          };
          
          // Add message listener
          window.addEventListener('message', messageHandler);
          
          // Check if popup was closed manually
          interval = setInterval(() => {
            if (popup.closed) {
              window.removeEventListener('message', messageHandler);
              clearTimeout(timeout);
              clearInterval(interval);
              reject(new Error('Authentication cancelled'));
            }
          }, 500);
          
          // Timeout after 60 seconds
          timeout = setTimeout(() => {
            window.removeEventListener('message', messageHandler);
            clearInterval(interval);
            if (popup && !popup.closed) {
              popup.close();
            }
            reject(new Error('Authentication timeout'));
          }, 60000);
        });
      } else {
        throw new Error(response.message || 'Failed to get auth URL');
      }
    } catch (apiError) {
      console.error('Backend API error:', apiError);
      
      // Fallback: Direct Google OAuth URL
      console.log('🔄 Using direct Google OAuth URL...');
      
      const clientId = '284143902150-gvbg0vcs1l373afbmgmuv73p10uo1qhe.apps.googleusercontent.com';
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const redirectUri = encodeURIComponent(`${apiUrl}/auth/google/callback`);
      const scope = encodeURIComponent('https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid');
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `access_type=offline&` +
        `scope=${scope}&` +
        `prompt=consent&` +
        `response_type=code&` +
        `client_id=${clientId}&` +
        `redirect_uri=${redirectUri}`;
      
      console.log('Direct auth URL:', authUrl);
      
      // Open popup with direct URL
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        authUrl,
        'google_auth',
        `width=${width},height=${height},top=${top},left=${left}`
      );

      if (!popup) {
        throw new Error('Popup blocked');
      }

      return new Promise((resolve, reject) => {
        let timeout: NodeJS.Timeout;
        let interval: NodeJS.Timeout;
        
        // Listen for messages from popup
        const messageHandler = (event: MessageEvent) => {
          // Security: Only accept messages from expected origins
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
          const apiBaseUrl = apiUrl.replace('/api', '');
          const allowedOrigins = [
            'http://localhost:3000',
            apiBaseUrl,
            window.location.origin
          ];
          
          if (!allowedOrigins.includes(event.origin)) {
            console.warn('Ignoring message from unauthorized origin:', event.origin);
            return;
          }
          
          if (event.data.type === 'google_auth_success') {
            console.log('✅ Google auth success message received (direct)');
            
            // Clean up
            window.removeEventListener('message', messageHandler);
            clearTimeout(timeout);
            if (interval) clearInterval(interval);
            
            // Store auth data
            const { token, refresh_token, user } = event.data;
            
            if (token && user) {
              localStorage.setItem('token', token);
              localStorage.setItem('user', JSON.stringify(user));
              if (refresh_token) {
                localStorage.setItem('refresh_token', refresh_token);
              }
              
              const userData = convertApiUserToUser(user);
              setUser(userData);
              
              // Close popup if still open
              if (popup && !popup.closed) {
                popup.close();
              }
              
              resolve({ 
                success: true, 
                user: userData, 
                token: token 
              });
            } else {
              reject(new Error('Invalid auth data received'));
            }
          } else if (event.data.type === 'google_auth_error') {
            console.error('❌ Google auth error:', event.data.message);
            
            // Clean up
            window.removeEventListener('message', messageHandler);
            clearTimeout(timeout);
            if (interval) clearInterval(interval);
            
            // Close popup if still open
            if (popup && !popup.closed) {
              popup.close();
            }
            
            reject(new Error(event.data.message || 'Authentication failed'));
          }
        };
        
        // Add message listener
        window.addEventListener('message', messageHandler);
        
        // Check if popup was closed manually
        interval = setInterval(() => {
          if (popup.closed) {
            window.removeEventListener('message', messageHandler);
            clearTimeout(timeout);
            clearInterval(interval);
            reject(new Error('Authentication cancelled'));
          }
        }, 500);
        
        // Timeout after 60 seconds
        timeout = setTimeout(() => {
          window.removeEventListener('message', messageHandler);
          clearInterval(interval);
          if (popup && !popup.closed) {
            popup.close();
          }
          reject(new Error('Authentication timeout'));
        }, 60000);
      });
    }
    
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