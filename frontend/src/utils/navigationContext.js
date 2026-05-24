/**
 * Enhanced Navigation Context
 * Manages navigation history and back button behavior
 * Provides professional-level navigation flow like Malabar Gold app
 */

import { createContext, useContext, useCallback, useRef, useEffect } from 'react';

const NavigationContext = createContext();

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};

export const NavigationProvider = ({ children }) => {
  const navigationStack = useRef([]);
  const currentPathRef = useRef(null);

  const pushRoute = useCallback((path, state = {}) => {
    navigationStack.current.push({
      path,
      state,
      timestamp: Date.now(),
    });
  }, []);

  const popRoute = useCallback(() => {
    if (navigationStack.current.length > 0) {
      navigationStack.current.pop();
    }
  }, []);

  const getBackTarget = useCallback(() => {
    if (navigationStack.current.length > 1) {
      const previousRoute = navigationStack.current[navigationStack.current.length - 2];
      return previousRoute.path;
    }
    return null;
  }, []);

  const clearStack = useCallback(() => {
    navigationStack.current = [];
  }, []);

  const getStack = useCallback(() => {
    return [...navigationStack.current];
  }, []);

  const value = {
    pushRoute,
    popRoute,
    getBackTarget,
    clearStack,
    getStack,
    navigationStack: navigationStack.current,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};
