import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { AuthContext } from "./auth-context";

const getStoredToken = () => localStorage.getItem("jwt") || sessionStorage.getItem("jwt");

const persistUserProfile = (profile) => {
  try {
    localStorage.setItem("profile", JSON.stringify(profile));
  } catch (err) {
    console.warn("Αδυναμία αποθήκευσης profile:", err);
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getStoredToken());
  const [authLoading, setAuthLoading] = useState(true);

  const clearAuth = useCallback(() => {
    localStorage.removeItem("jwt");
    sessionStorage.removeItem("jwt");
    localStorage.removeItem("profile");
    localStorage.removeItem("user");
    localStorage.removeItem("authUser");
    localStorage.removeItem("currentUser");
    setToken(null);
    setUser(null);
  }, []);

  const fetchUserProfile = useCallback(async (tokenOverride) => {
    const currentToken = tokenOverride || getStoredToken();
    if (!currentToken) {
      clearAuth();
      return null;
    }

    try {
      const response = await api.get("/api/users/profile", {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });
      const profile = response.data || null;
      setToken(currentToken);
      setUser(profile);
      if (profile) persistUserProfile(profile);
      return profile;
    } catch (err) {
      console.error("Αδυναμία φόρτωσης προφίλ χρήστη:", err);
      clearAuth();
      if (!["/login", "/signup"].includes(window.location.pathname)) {
        window.location.href = "/login";
      }
      return null;
    }
  }, [clearAuth]);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const currentToken = getStoredToken();
      if (!currentToken) {
        clearAuth();
        if (isMounted) setAuthLoading(false);
        return;
      }

      await fetchUserProfile();
      if (isMounted) setAuthLoading(false);
    };

    initializeAuth();
    return () => {
      isMounted = false;
    };
  }, [clearAuth, fetchUserProfile]);

  const loginWithToken = useCallback(
    async (newToken, rememberMe = false) => {
      localStorage.removeItem("jwt");
      sessionStorage.removeItem("jwt");

      if (rememberMe) {
        localStorage.setItem("jwt", newToken);
      } else {
        sessionStorage.setItem("jwt", newToken);
      }

      setToken(newToken);
      return fetchUserProfile(newToken);
    },
    [fetchUserProfile]
  );

  const updateUser = useCallback(
    async (profileData) => {
      const currentToken = getStoredToken();
      if (!currentToken) {
        clearAuth();
        return null;
      }

      try {
        const response = await api.put("/api/users/profile", profileData, {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        });
        const updatedProfile = response.data || null;
        setUser(updatedProfile);
        if (updatedProfile) persistUserProfile(updatedProfile);
        return updatedProfile;
      } catch (err) {
        console.error("Αδυναμία ενημέρωσης προφίλ χρήστη:", err);
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          clearAuth();
          if (!["/login", "/signup"].includes(window.location.pathname)) {
            window.location.href = "/login";
          }
        }
        return null;
      }
    },
    [clearAuth]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      authLoading,
      isAuthenticated: Boolean(token),
      fetchUserProfile,
      loginWithToken,
      clearAuth,
      updateUser,
    }),
    [authLoading, clearAuth, fetchUserProfile, loginWithToken, token, updateUser, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
