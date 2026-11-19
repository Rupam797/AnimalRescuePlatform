import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      if (token) {
        try {
          const response = await authService.getMe();
          setUser(response.data);
          localStorage.setItem("user", JSON.stringify(response.data));
        } catch (error) {
          console.error("Token verification failed:", error);
          logout();
        }
      }
      setLoading(false);
    }

    verifyAuth();
  }, [token]);

  const login = async (email, password) => {
    const response = await authService.login({ email, password });
    const authData = response.data;

    localStorage.setItem("token", authData.token);
    const userData = {
      id: authData.id,
      name: authData.name,
      email: authData.email,
      phone: authData.phone,
      role: authData.role,
      approved: authData.approved,
    };
    localStorage.setItem("user", JSON.stringify(userData));

    setToken(authData.token);
    setUser(userData);
    return userData;
  };

  const signup = async (signupData) => {
    const response = await authService.signup(signupData);
    const authData = response.data;

    if (authData.token) {
      localStorage.setItem("token", authData.token);
      const userData = {
        id: authData.id,
        name: authData.name,
        email: authData.email,
        phone: authData.phone,
        role: authData.role,
        approved: authData.approved,
      };
      localStorage.setItem("user", JSON.stringify(userData));
      setToken(authData.token);
      setUser(userData);
      return { success: true, user: userData, pending: false };
    }

    return {
      success: true,
      pending: true,
      message: "Registration successful! Your volunteer account is pending admin approval.",
    };
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === "ROLE_ADMIN";
  const isVolunteer = user?.role === "ROLE_VOLUNTEER";
  const isUser = user?.role === "ROLE_USER";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isAdmin,
        isVolunteer,
        isUser,
        loading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
