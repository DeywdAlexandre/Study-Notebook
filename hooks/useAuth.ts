
import { useContext } from 'react';
import { AuthProvider, useAuth as useAuthFromContext } from '../context/AuthContext';

// This is just an alias for easier imports
export const useAuth = useAuthFromContext;
