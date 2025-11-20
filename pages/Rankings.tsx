import React, { useEffect, useState, useMemo } from 'react';
import { DataService } from '../services/dataService';
import { UserRole, User, PointEvent } from '../types';
import { Trophy, Medal, Award, Loader, X, AlertTriangle } from 'lucide-react';
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Rankings: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<PointEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail Modal State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<{ positives: PointEvent[], negatives: PointEvent[] }>({ positives: [], negatives: [] });

  useEffect(() => {
      const load = async () => {
          const [u, e] = await Promise.all([DataService.getUsers(), DataService.getEvents()]);
          setUsers(u);
          setEvents(e);
          setLoading(false);
      };
      load();
  }, []);

  // Logic to open details
  const handleUserClick = async (user: User) => {
      setSelectedUser(user);
      
      // Filter events for this user, sort by points
      // We use the global 'events' list which is already loaded for efficiency, 
      // but normally for strict consistency we could fetch fresh data.
      const userEvents = events.filter(e => e.targetUserId === user.id);
      
      const pos = userEvents
        .filter(e => e.points > 0)
        .sort((a, b) => b.points - a.points) // Descending
        .slice(0, 10); // Top 10

      const neg = userEvents
        .filter(e => e.points < 0)
        .sort((a, b) => a.points - b.points) // Ascending (most negative first)
        .slice(0, 10); // Top 10 (Worst)

      setUserStats({ positives: pos, negatives: neg });
  };

  // Calculate Weekly Stats
  const rankings = useMemo(() => {
    if (loading) return { all: [], prof: [], surv: [], dir: [] };

    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });

    // Initialize scores map
    const scores: Record<string, number> = {};
    // Filter adults
    users.forEach(u => {
        if ([UserRole.PROFESSEUR, UserRole.SURVEILLANT, UserRole.DIRECTION].includes(u.role)) {
            scores[u.id] = 0;
        }
    });

    // Sum points
    events.forEach(e => {
        if (isWithinInterval(parseISO(e.dateTime), { start, end })) {
            if (scores[e.targetUserId] !== undefined) {
                scores[e.targetUserId] += e.points;
            }
        }
    });

    const getRankedList = (role?: UserRole) => {
        return Object.entries(scores)
            .map(([uid, score]) => {
                const u = users.find(user => user.id === uid);
                return { user: u, score };
            })
            .filter(item => item.user && (!role || item.user.role === role))
            .sort((a, b) => b.score - a.score);
    };

    return {
        all: getRankedList(),
        prof: getRankedList(UserRole.PROFESSEUR),
        surv: getRankedList(UserRole.SURVEILLANT),
        dir: getRankedList(UserRole.DIRECTION),
    };
  }, [users, events, loading]);

  if (loading) return <div className="p-8 text-center"><Loader className="animate-spin w-8 h-8 mx-auto text-indigo-600" /></div>;

  const RankingTable = ({ title, data, icon: Icon, colorClass }: any) => (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
      <div className={`px-6 py-4 ${colorClass} text-white flex items-center justify-between`}>
        <div className="flex items-center space-x-2">
            <Icon className="w-5 h-5" />
            <h3 className="text-lg font-bold">{title}</h3>
        </div>
        <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">Semaine en cours</span>
      </div>
      <ul className="divide-y divide-gray-100">
        {data.map((item: any, index: number) => (
            <li 
                key={item.user.id} 
                onClick={() => handleUserClick(item.user)}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group"
            >
                <div className="flex items-center">
                    <span className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold mr-3 ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                        index === 1 ? 'bg-gray-100 text-gray-700' : 
                        index === 2 ? 'bg-orange-100 text-orange-700' : 'text-gray-400'
                    }`}>
                        {index + 1}
                    </span>
                    <div>
                        <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 underline-offset-2 group-hover:underline transition-all">
                            {item.user.fullName}
                        </p>
                        <p className="text-xs text-gray-400">{item.user.role}</p>
                    </div>
                </div>
                <div className={`text-sm font-bold ${item.score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.score > 0 ? '+' : ''}{item.score} pts
                </div>
            </li>
        ))}
        {data.length === 0 && (
            <li className="px-6 py-8 text-center text-gray-400 text-sm">Aucune donnée cette semaine.</li>
        )}
      </ul>
    </div>
  );

  // Prepare Chart Data (Top 5 Global)
  const chartData = rankings.all.slice(0, 5).map(i => ({
      name: i.user?.fullName,
      score: i.score
  }));

  const getActionLabel = (eventId: string | null, customLabel?: string) => {
      if (!eventId) return customLabel || 'Action personnalisée';
      const predefined = DataService.getActions().find(a => a.id === eventId);
      return predefined ? predefined.label : (customLabel || 'Inconnu');
  };

  return (
    <div className="space-y-8">
      <div className="text-center sm:text-left">
        <h1 className="text-3xl font-extrabold text-gray-900">Classement Hebdomadaire (SEM)</h1>
        <p className="mt-2 text-gray-500">Les points sont réinitialisés chaque semaine. Cliquez sur un nom pour voir les détails.</p>
      </div>

      {/* Chart Section */}
      {chartData.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-80">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Top 5 Global</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{fontSize: 12}} interval={0} />
                    <YAxis />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.score >= 0 ? '#4F46E5' : '#EF4444'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
         <RankingTable title="Professeurs" data={rankings.prof} icon={Trophy} colorClass="bg-indigo-600" />
         <RankingTable title="Surveillants" data={rankings.surv} icon={Award} colorClass="bg-blue-600" />
         <RankingTable title="Direction" data={rankings.dir} icon={Medal} colorClass="bg-purple-600" />
         <RankingTable title="Global" data={rankings.all} icon={Trophy} colorClass="bg-slate-800" />
      </div>

      {/* Details Modal */}
      {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                  {/* Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                      <div>
                          <h2 className="text-xl font-bold text-gray-900">{selectedUser.fullName}</h2>
                          <p className="text-sm text-gray-500">{selectedUser.role}</p>
                      </div>
                      <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-6 h-6" />
                      </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Positives */}
                      <div className="space-y-3">
                          <h3 className="text-green-700 font-bold flex items-center border-b border-green-200 pb-2">
                              <Trophy className="w-5 h-5 mr-2" /> Faits d'armes (Top 10)
                          </h3>
                          <ul className="space-y-2">
                              {userStats.positives.map((e, i) => (
                                  <li key={i} className="bg-green-50 p-3 rounded border border-green-100 flex justify-between items-center">
                                      <span className="text-sm text-green-900 font-medium">{getActionLabel(e.actionId, e.customLabel)}</span>
                                      <span className="text-xs font-bold bg-green-200 text-green-800 px-2 py-1 rounded">+{e.points}</span>
                                  </li>
                              ))}
                              {userStats.positives.length === 0 && <p className="text-sm text-gray-400 italic">Aucune action positive notable.</p>}
                          </ul>
                      </div>

                      {/* Negatives */}
                      <div className="space-y-3">
                          <h3 className="text-red-700 font-bold flex items-center border-b border-red-200 pb-2">
                              <AlertTriangle className="w-5 h-5 mr-2" /> Casier (Top 10 Pires)
                          </h3>
                          <ul className="space-y-2">
                              {userStats.negatives.map((e, i) => (
                                  <li key={i} className="bg-red-50 p-3 rounded border border-red-100 flex justify-between items-center">
                                      <span className="text-sm text-red-900 font-medium">{getActionLabel(e.actionId, e.customLabel)}</span>
                                      <span className="text-xs font-bold bg-red-200 text-red-800 px-2 py-1 rounded">{e.points}</span>
                                  </li>
                              ))}
                              {userStats.negatives.length === 0 && <p className="text-sm text-gray-400 italic">Casier vierge.</p>}
                          </ul>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Rankings;