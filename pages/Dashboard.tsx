import React, { useEffect, useState } from 'react';
import { User, UserRole, PointEvent } from '../types';
import { DataService } from '../services/dataService';
import { Users, Trophy, Star, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';

interface DashboardProps {
  currentUser: User;
}

const Dashboard: React.FC<DashboardProps> = ({ currentUser }) => {
  const [stats, setStats] = useState({
    pointsGivenThisWeek: 0,
    myPointsThisWeek: 0,
    topRankedAdult: 'Chargement...',
  });

  useEffect(() => {
    const events = DataService.getEvents();
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
    const end = endOfWeek(now, { weekStartsOn: 1 });

    const thisWeekEvents = events.filter(e => 
      isWithinInterval(parseISO(e.dateTime), { start, end })
    );

    // Calculation based on role
    let given = 0;
    let received = 0;

    // Points given by me (Student/Admin)
    if (currentUser.role === UserRole.ELEVE || currentUser.role === UserRole.ADMIN) {
        given = thisWeekEvents.filter(e => e.createdById === currentUser.id).length;
    }

    // Points received (Adults)
    if ([UserRole.PROFESSEUR, UserRole.SURVEILLANT, UserRole.DIRECTION].includes(currentUser.role)) {
        received = thisWeekEvents
            .filter(e => e.targetUserId === currentUser.id)
            .reduce((acc, e) => acc + e.points, 0);
    }

    // Determine top adult
    const adultPoints: Record<string, number> = {};
    thisWeekEvents.forEach(e => {
        adultPoints[e.targetUserId] = (adultPoints[e.targetUserId] || 0) + e.points;
    });
    
    let maxPoints = -Infinity;
    let topAdultId = '';
    Object.entries(adultPoints).forEach(([id, pts]) => {
        if (pts > maxPoints) {
            maxPoints = pts;
            topAdultId = id;
        }
    });

    let topAdultName = "Aucune donnée";
    if (topAdultId) {
        const u = DataService.getUserById(topAdultId);
        if (u) topAdultName = u.fullName;
    }

    setStats({
        pointsGivenThisWeek: given,
        myPointsThisWeek: received,
        topRankedAdult: topAdultName
    });

  }, [currentUser]);

  const Card = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100">
      <div className="p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md p-3 ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-2xl font-bold text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bonjour, {currentUser.fullName} 👋</h1>
        <p className="mt-1 text-sm text-gray-500">Voici un aperçu de l'activité récente.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Widgets vary by role */}
        
        {currentUser.role === UserRole.ELEVE && (
           <Card 
             title="Actions cette semaine" 
             value={stats.pointsGivenThisWeek} 
             icon={Star} 
             color="bg-indigo-500" 
           />
        )}

        {[UserRole.PROFESSEUR, UserRole.SURVEILLANT, UserRole.DIRECTION].includes(currentUser.role) && (
           <Card 
             title="Mon score (Semaine)" 
             value={stats.myPointsThisWeek} 
             icon={Activity} 
             color={stats.myPointsThisWeek >= 0 ? "bg-green-500" : "bg-red-500"} 
           />
        )}

        <Card 
             title="Leader de la semaine" 
             value={stats.topRankedAdult} 
             icon={Trophy} 
             color="bg-yellow-500" 
        />
        
        <Link to="/classement" className="block group">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-sm p-6 text-white transition-transform transform hover:scale-105">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-lg font-semibold">Voir le classement complet</p>
                        <p className="text-blue-100 text-sm">Semaine en cours (SEM)</p>
                    </div>
                    <Trophy className="w-8 h-8 text-blue-200 opacity-75" />
                </div>
            </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {currentUser.role === UserRole.ELEVE && (
                <Link to="/ajouter-points" className="p-4 bg-white border rounded-lg shadow-sm hover:bg-gray-50 flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
                        <Star className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-gray-700">Évaluer un adulte</span>
                </Link>
            )}
             {currentUser.role === UserRole.ELEVE && (
                <Link to="/ma-classe" className="p-4 bg-white border rounded-lg shadow-sm hover:bg-gray-50 flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-full text-green-600">
                        <Users className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-gray-700">Ma Classe</span>
                </Link>
            )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
