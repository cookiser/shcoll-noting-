import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserRole, User } from '../types';
import { 
  LogOut, 
  LayoutDashboard, 
  Users, 
  Trophy, 
  PlusCircle, 
  School, 
  Menu, 
  X,
  UserCog
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentUser, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const navItemClass = (path: string) => `
    flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200
    ${isActive(path) 
      ? 'bg-indigo-100 text-indigo-700' 
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
  `;

  // Menu Visibility Logic
  const showAddPoints = [UserRole.ELEVE, UserRole.ADMIN, UserRole.PROFESSEUR, UserRole.SURVEILLANT, UserRole.DIRECTION].includes(currentUser.role);
  const showUsers = currentUser.role === UserRole.ADMIN;
  const showMyClass = [UserRole.ELEVE, UserRole.PROFESSEUR].includes(currentUser.role);
  const showRankings = true; // Everyone can see rankings

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center h-16 border-b bg-indigo-600 text-white shadow-md">
        <School className="w-6 h-6 mr-2" />
        <span className="text-lg font-bold tracking-wide">Éval'École</span>
      </div>
      
      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <Link to="/" className={navItemClass('/')} onClick={() => setIsSidebarOpen(false)}>
          <LayoutDashboard className="w-5 h-5 mr-3" />
          Tableau de bord
        </Link>

        {showMyClass && (
          <Link to="/ma-classe" className={navItemClass('/ma-classe')} onClick={() => setIsSidebarOpen(false)}>
            <Users className="w-5 h-5 mr-3" />
            Ma Classe
          </Link>
        )}

        {showAddPoints && (
          <Link to="/ajouter-points" className={navItemClass('/ajouter-points')} onClick={() => setIsSidebarOpen(false)}>
            <PlusCircle className="w-5 h-5 mr-3" />
            Ajouter/Retirer
          </Link>
        )}

        {showRankings && (
          <Link to="/classement" className={navItemClass('/classement')} onClick={() => setIsSidebarOpen(false)}>
            <Trophy className="w-5 h-5 mr-3" />
            Classement SEM
          </Link>
        )}

        {showUsers && (
          <Link to="/utilisateurs" className={navItemClass('/utilisateurs')} onClick={() => setIsSidebarOpen(false)}>
            <UserCog className="w-5 h-5 mr-3" />
            Utilisateurs
          </Link>
        )}
      </div>

      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold mr-3">
                {currentUser.fullName.charAt(0)}
            </div>
            <div className="overflow-hidden">
                <p className="text-sm font-medium text-gray-900 truncate">{currentUser.fullName}</p>
                <p className="text-xs text-gray-500 truncate">{currentUser.role}</p>
            </div>
        </div>
        <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <NavContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white shadow-sm lg:hidden flex items-center justify-between p-4">
            <div className="flex items-center">
                <School className="w-6 h-6 text-indigo-600 mr-2" />
                <span className="text-lg font-bold text-gray-900">Éval'École</span>
            </div>
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600 rounded-md hover:bg-gray-100">
                <Menu className="w-6 h-6" />
            </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
