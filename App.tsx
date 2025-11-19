import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MyClass from './pages/MyClass';
import AddPoints from './pages/AddPoints';
import Rankings from './pages/Rankings';
import UserManagement from './pages/UserManagement';
import Layout from './components/Layout';
import { DataService } from './services/dataService';
import { User, UserRole } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      // Init DB if empty
      await DataService.init();
      
      // Check session
      const storedUser = localStorage.getItem('eval_ecole_session');
      if (storedUser) {
        // Verify if user still exists in DB (optional but safer)
        const userObj = JSON.parse(storedUser);
        try {
            const dbUser = await DataService.getUserById(userObj.id);
            if (dbUser && dbUser.active) {
                setCurrentUser(dbUser);
            } else {
                localStorage.removeItem('eval_ecole_session');
            }
        } catch (e) {
            console.error("Session validation failed", e);
        }
      }
      setIsLoading(false);
    };

    initApp();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('eval_ecole_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('eval_ecole_session');
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <HashRouter>
      <Routes>
        <Route 
          path="/login" 
          element={!currentUser ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} 
        />
        
        {/* Protected Routes */}
        <Route
          path="*"
          element={
            currentUser ? (
              <Layout currentUser={currentUser} onLogout={handleLogout}>
                <Routes>
                  <Route path="/" element={<Dashboard currentUser={currentUser} />} />
                  
                  <Route 
                    path="/ma-classe" 
                    element={
                        [UserRole.ELEVE, UserRole.PROFESSEUR].includes(currentUser.role) 
                        ? <MyClass currentUser={currentUser} /> 
                        : <Navigate to="/" />
                    } 
                  />
                  
                  <Route 
                    path="/ajouter-points" 
                    element={
                        currentUser.role !== UserRole.COMPTABILITE // Compta is read-only
                        ? <AddPoints currentUser={currentUser} /> 
                        : <Navigate to="/" />
                    } 
                  />
                  
                  <Route path="/classement" element={<Rankings />} />
                  
                  <Route 
                    path="/utilisateurs" 
                    element={
                        currentUser.role === UserRole.ADMIN 
                        ? <UserManagement /> 
                        : <Navigate to="/" />
                    } 
                  />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </HashRouter>
  );
};

export default App;