// src/contexts/LangContext.js

import React, { createContext, useContext, useState } from "react";

const LangContext = createContext();
export const useLang = () => useContext(LangContext);

export function LangProvider({ children }) {
  const [lang, setLang] = useState("en");
  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}
