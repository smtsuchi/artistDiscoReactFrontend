import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const { logout } = useAuth();

  useEffect(() => {
    logout();
  }, []);

  return <div></div>;
};

export default Login;
