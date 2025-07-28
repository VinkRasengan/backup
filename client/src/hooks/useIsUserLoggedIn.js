import { useAuth } from '../context/AuthContext'

const useIsUserLoggedIn = () => {
  const { user } = useAuth();
  return !!user; // Returns true if user exists, otherwise false
};

export default useIsUserLoggedIn;