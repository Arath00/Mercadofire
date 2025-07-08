// Importaciones necesarias para el contexto de idioma
import React, { createContext, useContext, useState } from 'react';

// Tipo para los idiomas soportados
type Language = 'es' | 'en';

// Interfaz para el diccionario de traducciones
interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

// Diccionario de traducciones
const translations: Translations = {
  en: {
    // Traducciones en inglés...
    'nav.dashboard': 'Dashboard',
    'nav.categories': 'Categories',
    'nav.products': 'Products',
    'nav.inventory': 'Inventory',
    'nav.reports': 'Reports',
    'nav.logout': 'Logout',
    // ... resto de traducciones
  },
  es: {
    // Traducciones en español...
    'nav.dashboard': 'Dashboard',
    'nav.categories': 'Categorías',
    'nav.products': 'Productos',
    'nav.inventory': 'Inventario',
    'nav.reports': 'Reportes',
    'nav.logout': 'Cerrar sesión',
    // ... resto de traducciones
  },
};

// Interfaz del contexto de idioma
interface LanguageContextType {
  language: Language;                  // Idioma actual
  setLanguage: (lang: Language) => void; // Función para cambiar el idioma
  t: (key: string) => string;         // Función para obtener traducciones
}

// Creación del contexto
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Proveedor del contexto de idioma
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Estado para el idioma actual (español por defecto)
  const [language, setLanguage] = useState<Language>('es');

  // Función para obtener traducciones
  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook personalizado para usar el contexto de idioma
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage debe ser usado dentro de un LanguageProvider');
  }
  return context;
};