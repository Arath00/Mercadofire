import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../firebase';

// Interfaz del usuario simplificada
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Interfaz del contexto de autenticación
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Escuchar cambios en el estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Crear objeto de usuario simplificado
        const userData: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
          role: 'user' // Por defecto todos son usuarios estándar
        };
        setUser(userData);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Función de inicio de sesión
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error: any) {
      console.error('Error en login:', error);
      return false;
    }
  };

  // Función de registro
  const signUp = async (email: string, password: string, name: string): Promise<{ success: boolean; message: string }> => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      return { 
        success: true, 
        message: 'Usuario registrado exitosamente' 
      };
    } catch (error: any) {
      console.error('Error en registro:', error);
      
      // Manejar errores específicos de Firebase
      let message = 'Error al registrar usuario';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'Este correo ya está registrado';
          break;
        case 'auth/weak-password':
          message = 'La contraseña debe tener al menos 6 caracteres';
          break;
        case 'auth/invalid-email':
          message = 'El formato del correo no es válido';
          break;
        default:
          message = error.message || 'Error al registrar usuario';
      }
      
      return { success: false, message };
    }
  };

  // Función para cerrar sesión
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  const value = {
    user,
    login,
    signUp,
    logout,
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar el contexto de autenticación
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};