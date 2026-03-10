import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme= () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
 return context;
};

export const ThemeProvider= ({ children }) => {
  const [theme, setTheme] = useState(() => {
   const savedTheme = localStorage.getItem('app-theme');
   return savedTheme || 'light';
  });

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
   setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

 return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
