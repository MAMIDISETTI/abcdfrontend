import React, { createContext, useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";
import Cookies from "js-cookie";
import PasswordChangePopup from "../components/PasswordChangePopup";

export const UserContext = createContext();

const UserProvider = ({ children }) => {
     const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // New state to track loading
  const [showPasswordChangePopup, setShowPasswordChangePopup] = useState(false);

  useEffect(() => {
    if (user) return;

    const accessToken = Cookies.get("token");
    if (!accessToken) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);
        setUser(response.data);
        
        // Check if user needs to change password (trainee with passwordChanged: false)
        if (response.data.role === 'trainee' && response.data.passwordChanged === false) {
          setShowPasswordChangePopup(true);
        }
      } catch (error) {
        console.error("Profile fetch error:", error);
        
        // Clear user if it's a 401 (unauthorized) or 403 (forbidden/deactivated) error
        if (error.response?.status === 401 || error.response?.status === 403) {
          clearUser();
        } else {
          // Keep user logged in but show error message for other errors
          setUser(prevUser => prevUser); // Keep current user data
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const updateUser = (userData) => {
    setUser(userData);
    // Set cookie with 7 days expiration (same as JWT token)
    Cookies.set("token", userData.token, { expires: 7, secure: true, sameSite: 'strict' });
    setLoading(false);
    
    // Check if user needs to change password after login
    if (userData.role === 'trainee' && userData.passwordChanged === false) {
      setShowPasswordChangePopup(true);
    }
  };

  const clearUser = () => {
    setUser(null);
    Cookies.remove("token");
  };

  const handlePasswordChangeSuccess = () => {
    // Update user data to reflect password change
    setUser(prev => ({
      ...prev,
      passwordChanged: true
    }));
    setShowPasswordChangePopup(false);
  };

  return (
    <UserContext.Provider value={{ user, loading, updateUser, clearUser }}>
      {children}
      <PasswordChangePopup
        isOpen={showPasswordChangePopup}
        onClose={() => setShowPasswordChangePopup(false)}
        onSuccess={handlePasswordChangeSuccess}
      />
    </UserContext.Provider>
  );
}

export default UserProvider