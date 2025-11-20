import React, { useState, useEffect } from 'react';
import { User, UserRole, ClassGroup } from '../types';
import { DataService } from '../services/dataService';
import { Plus, Edit2, Trash2, X, BookOpen, GraduationCap, Briefcase, Loader, AlertTriangle, RefreshCcw, ShieldAlert, Sliders } from 'lucide-react';

const UserManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'eleves' | 'personnel' | 'classes' | 'points'>('eleves');
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modal states
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Adjust Score Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustTargetUser, setAdjustTargetUser] = useState<User | null>(null);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [newTargetScore, setNewTargetScore] = useState<string>('');

  // New Class State
  const [newClassName, setNewClassName] = useState('');

  // User Form State
  const [formData, setFormData] = useState({
      fullName: '',
      username: '',
      password: '',
      role: UserRole.ELEVE,
      classId: '',
      assignedClassIds: [] as string[],
      active: true
  });

  const refreshData = async () => {
      setLoading(true);
      const [u, c] = await Promise.all([DataService.getUsers(), DataService.getClasses()]);
      setUsers(u);
      setClasses(c);
      setLoading(false);
  };

  useEffect(() => {
      refreshData();
  }, []);

  // --- User Logic ---

  const openUserModal = (type: 'eleve' | 'personnel', user?: User) => {
      if (user) {
          setEditingUser(user);
          setFormData({
              fullName: user.fullName,
              username: user.username,
              password: user.password,
              role: user.role,
              classId: user.classId || '',
              assignedClassIds: user.assignedClassIds || [],
              active: user.active
          });
      } else {
          setEditingUser(null);
          setFormData({
            fullName: '',
            username: '',
            password: '',
            role: type === 'eleve' ? UserRole.ELEVE : UserRole.PROFESSEUR,
            classId: classes[0]?.id || '',
            assignedClassIds: [],
            active: true
        });
      }
      setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
      e.preventDefault();
      setActionLoading(true);
      
      const isStaff = [UserRole.PROFESSEUR, UserRole.SURVEILLANT, UserRole.DIRECTION, UserRole.COMPTABILITE].includes(formData.role);
      
      const newUser: User = {
          id: editingUser ? editingUser.id : crypto.randomUUID(), // Use randomUUID for new strings
          fullName: formData.fullName,
          username: isStaff ? '' : formData.username, 
          password: isStaff ? '' : formData.password, 
          role: formData.role,
          active: formData.active,
          classId: formData.role === UserRole.ELEVE ? formData.classId : undefined,
          assignedClassIds: formData.role === UserRole.PROFESSEUR ? formData.assignedClassIds : undefined
      };

      await DataService.saveUser(newUser);
      setIsUserModalOpen(false);
      setActionLoading(false);
      refreshData();
  };

  const handleDeleteUser = async (id: string) => {
      if (window.confirm('Êtes-vous sûr de vouloir supprimer ?')) {
          setActionLoading(true);
          await DataService.deleteUser(id);
          setActionLoading(false);
          refreshData();
      }
  };

  const toggleClassAssignment = (classId: string) => {
      setFormData(prev => {
          const current = prev.assignedClassIds;
          if (current.includes(classId)) {
              return { ...prev, assignedClassIds: current.filter(id => id !== classId) };
          } else {
              return { ...prev, assignedClassIds: [...current, classId] };
          }
      });
  };

  // --- Score Adjustment Logic ---
  const openAdjustModal = async (user: User) => {
      setAdjustTargetUser(user);
      setActionLoading(true);
      try {
          // Fetch current events to calculate score
          const events = await DataService.getEventsForTarget(user.id);
          const score = events.reduce((acc, e) => acc + e.points, 0);
          setCurrentScore(score);
          setNewTargetScore(score.toString());
          setIsAdjustModalOpen(true);
      } catch (e) {
          alert("Erreur lors de la récupération du score.");
      } finally {
          setActionLoading(false);
      }
  };

  const handleAdjustScore = async () => {
      if (!adjustTargetUser || !newTargetScore) return;
      const target = parseInt(newTargetScore);
      if (isNaN(target)) return;

      const diff = target - currentScore;
      if (diff === 0) {
          setIsAdjustModalOpen(false);
          return;
      }

      setActionLoading(true);
      try {
          await DataService.addEvent({
              id: Date.now().toString(),
              dateTime: new Date().toISOString(),
              createdById: 'admin_adjust', // Marqueur système
              targetUserId: adjustTargetUser.id,
              actionId: null,
              customLabel: 'Ajustement administratif du score',
              points: diff
          });
          alert(`Score ajusté de ${currentScore} à ${target}.`);
          setIsAdjustModalOpen(false);
      } catch (e) {
          alert("Erreur lors de l'ajustement.");
      } finally {
          setActionLoading(false);
      }
  };

  // --- Class Logic ---

  const handleAddClass = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newClassName.trim()) {
          setActionLoading(true);
          await DataService.addClass(newClassName.trim());
          setNewClassName('');
          setActionLoading(false);
          refreshData();
      }
  };

  const handleDeleteClass = async (id: string) => {
      if (window.confirm('Supprimer cette classe ? Les élèves liés perdront leur affiliation.')) {
          setActionLoading(true);
          await DataService.deleteClass(id);
          setActionLoading(false);
          refreshData();
      }
  };

  // --- Points Logic ---
  const handleDeleteAllPoints = async () => {
      const confirm1 = window.confirm("⚠️ ATTENTION : Vous êtes sur le point de supprimer TOUS les points de l'application.");
      if (confirm1) {
          const confirm2 = window.confirm("Êtes-vous vraiment sûr ? Cette action est irréversible.");
          if (confirm2) {
              setActionLoading(true);
              try {
                  await DataService.deleteAllEvents();
                  alert("Tous les points ont été réinitialisés.");
              } catch (e) {
                  console.error(e);
                  alert("Erreur lors de la suppression.");
              } finally {
                  setActionLoading(false);
              }
          }
      }
  };

  const handleDeleteTargetPoints = async (userId: string, userName: string) => {
      if (window.confirm(`Voulez-vous remettre à zéro les points de ${userName} ?`)) {
          setActionLoading(true);
          try {
              await DataService.deleteEventsForTarget(userId);
              alert(`Points de ${userName} réinitialisés.`);
          } catch (e) {
              alert("Erreur lors de la suppression.");
          } finally {
              setActionLoading(false);
          }
      }
  };

  // Filters
  const studentUsers = users.filter(u => u.role === UserRole.ELEVE);
  const staffUsers = users.filter(u => [UserRole.PROFESSEUR, UserRole.SURVEILLANT, UserRole.DIRECTION, UserRole.COMPTABILITE].includes(u.role));

  const isEleveForm = formData.role === UserRole.ELEVE;

  if (loading && !isUserModalOpen && !isAdjustModalOpen) return <div className="p-8 text-center"><Loader className="animate-spin w-8 h-8 mx-auto text-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
          {actionLoading && <Loader className="animate-spin text-indigo-600" />}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-8">
            <button
                onClick={() => setActiveTab('eleves')}
                className={`${activeTab === 'eleves' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
                <GraduationCap className="w-4 h-4 mr-2" />
                Élèves
            </button>
            <button
                onClick={() => setActiveTab('personnel')}
                className={`${activeTab === 'personnel' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
                <Briefcase className="w-4 h-4 mr-2" />
                Personnel
            </button>
            <button
                onClick={() => setActiveTab('classes')}
                className={`${activeTab === 'classes' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
                <BookOpen className="w-4 h-4 mr-2" />
                Classes
            </button>
            <button
                onClick={() => setActiveTab('points')}
                className={`${activeTab === 'points' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-red-700 hover:border-red-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
                <ShieldAlert className="w-4 h-4 mr-2" />
                Gestion des Points
            </button>
        </nav>
      </div>

      {/* CONTENT: ELEVES */}
      {activeTab === 'eleves' && (
          <div className="animate-fade-in">
              <div className="flex justify-end mb-4">
                <button onClick={() => openUserModal('eleve')} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un Élève
                </button>
              </div>
              <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Identifiant</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mot de passe</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classe</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accès</th>
                            <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {studentUsers.map(user => {
                            const userClass = classes.find(c => c.id === user.classId);
                            return (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.fullName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{user.password}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{userClass?.name || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {user.active ? 'Ouvert' : 'Bloqué'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => openUserModal('eleve', user)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit2 className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
              </div>
          </div>
      )}

      {/* CONTENT: PERSONNEL */}
      {activeTab === 'personnel' && (
          <div className="animate-fade-in">
              <div className="flex justify-end mb-4">
                <button onClick={() => openUserModal('personnel')} className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors">
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter du Personnel
                </button>
              </div>
              <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignations</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {staffUsers.map(user => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.fullName}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                    {user.role === UserRole.PROFESSEUR 
                                      ? user.assignedClassIds?.map(cid => classes.find(c => c.id === cid)?.name).join(', ') || 'Aucune'
                                      : 'Tout l\'établissement'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {user.active ? 'Visible' : 'Masqué'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button 
                                        onClick={() => openAdjustModal(user)} 
                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        title="Ajuster le score"
                                    >
                                        <Sliders className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => openUserModal('personnel', user)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                        {staffUsers.length === 0 && (
                             <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Aucun personnel.</td>
                             </tr>
                        )}
                    </tbody>
                </table>
              </div>
          </div>
      )}

      {/* CONTENT: CLASSES */}
      {activeTab === 'classes' && (
          <div className="animate-fade-in grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* List */}
              <div className="md:col-span-2 bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                   <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                          <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom de la classe</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                          {classes.map(cls => (
                              <tr key={cls.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cls.name}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                      <button onClick={() => handleDeleteClass(cls.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                                  </td>
                              </tr>
                          ))}
                          {classes.length === 0 && (
                              <tr>
                                  <td colSpan={2} className="px-6 py-4 text-center text-gray-500">Aucune classe. Ajoutez-en une à droite.</td>
                              </tr>
                          )}
                      </tbody>
                   </table>
              </div>

              {/* Add Form */}
              <div className="md:col-span-1">
                  <div className="bg-white shadow sm:rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Ajouter une classe</h3>
                      <form onSubmit={handleAddClass}>
                          <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700">Nom (ex: 6ème A)</label>
                              <input 
                                type="text" 
                                required
                                value={newClassName}
                                onChange={(e) => setNewClassName(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              />
                          </div>
                          <button type="submit" disabled={actionLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-400">
                              {actionLoading ? <Loader className="animate-spin h-4 w-4" /> : <><Plus className="w-4 h-4 mr-2" /> Ajouter</>}
                          </button>
                      </form>
                  </div>
              </div>
          </div>
      )}

      {/* CONTENT: POINTS MANAGEMENT */}
      {activeTab === 'points' && (
          <div className="animate-fade-in space-y-8">
              
              {/* Global Reset */}
              <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg shadow-sm">
                  <div className="flex justify-between items-center">
                      <div>
                          <h3 className="text-lg font-bold text-red-900 flex items-center">
                              <AlertTriangle className="w-5 h-5 mr-2" />
                              Réinitialisation Globale
                          </h3>
                          <p className="text-sm text-red-700 mt-1">
                              Supprime l'intégralité de l'historique des points (Professeurs, Surveillants, Direction).
                              <br />
                              Utilisez cette fonction en début d'année ou de trimestre. <strong>Action irréversible.</strong>
                          </p>
                      </div>
                      <button 
                        onClick={handleDeleteAllPoints}
                        className="ml-4 px-4 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700 shadow transition-colors"
                      >
                          TOUT SUPPRIMER
                      </button>
                  </div>
              </div>

              {/* Individual Reset */}
              <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <h3 className="text-lg font-medium text-gray-900">Réinitialisation par Personne</h3>
                      <p className="text-sm text-gray-500">Remettre à zéro le compteur d'un adulte spécifique.</p>
                  </div>
                  <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                      {staffUsers.map(user => (
                          <li key={user.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                              <div className="flex items-center">
                                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3 ${user.role === UserRole.PROFESSEUR ? 'bg-blue-500' : 'bg-orange-500'}`}>
                                      {user.role.charAt(0)}
                                  </div>
                                  <div>
                                      <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                                      <p className="text-xs text-gray-500">{user.role}</p>
                                  </div>
                              </div>
                              <button 
                                onClick={() => handleDeleteTargetPoints(user.id, user.fullName)}
                                className="text-gray-400 hover:text-red-600 flex items-center text-sm"
                                title="Remettre les points à zéro"
                              >
                                  <RefreshCcw className="w-4 h-4 mr-1" /> Remettre à zéro
                              </button>
                          </li>
                      ))}
                      {staffUsers.length === 0 && (
                          <li className="px-6 py-4 text-center text-gray-500">Aucun personnel trouvé.</li>
                      )}
                  </ul>
              </div>
          </div>
      )}

      {/* Adjust Score Modal */}
      {isAdjustModalOpen && adjustTargetUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Ajuster le score</h3>
                  <p className="text-sm text-gray-500 mb-4">Modifiez manuellement le score de {adjustTargetUser.fullName}.</p>
                  
                  <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500">Score actuel :</span>
                          <span className="font-bold">{currentScore} pts</span>
                      </div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau total souhaité :</label>
                      <input 
                          type="number" 
                          value={newTargetScore}
                          onChange={(e) => setNewTargetScore(e.target.value)}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      {newTargetScore && !isNaN(parseInt(newTargetScore)) && (
                          <p className="text-xs text-indigo-600 mt-1">
                              {parseInt(newTargetScore) - currentScore > 0 ? '+' : ''}{parseInt(newTargetScore) - currentScore} points seront ajoutés via un ajustement.
                          </p>
                      )}
                  </div>

                  <div className="flex justify-end pt-2">
                      <button 
                        onClick={() => setIsAdjustModalOpen(false)} 
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 mr-3"
                      >
                          Annuler
                      </button>
                      <button 
                        onClick={handleAdjustScore} 
                        disabled={!newTargetScore}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                      >
                          Appliquer
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* User Modal */}
      {isUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {editingUser ? 'Modifier' : 'Ajouter'} {isEleveForm ? 'un Élève' : 'un Membre du Personnel'}
                      </h3>
                      <button onClick={() => setIsUserModalOpen(false)} className="text-gray-400 hover:text-gray-500"><X className="w-5 h-5" /></button>
                  </div>
                  <form onSubmit={handleSaveUser} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Nom complet</label>
                          <input 
                            type="text" 
                            required 
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                            value={formData.fullName} 
                            onChange={e => setFormData({...formData, fullName: e.target.value})}
                          />
                      </div>

                      {/* Role Selection (Visible ONLY for Personnel, hidden for Eleve) */}
                      {activeTab !== 'eleves' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Rôle</label>
                            <select 
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                value={formData.role}
                                onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                            >
                                {activeTab === 'personnel' && (
                                    <>
                                    <option value={UserRole.PROFESSEUR}>Professeur</option>
                                    <option value={UserRole.SURVEILLANT}>Surveillant</option>
                                    <option value={UserRole.DIRECTION}>Direction</option>
                                    </>
                                )}
                                {activeTab === 'classes' && Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                      )}

                      {/* Fields only for Eleve (Login) */}
                      {isEleveForm && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Identifiant</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                                    value={formData.username} 
                                    onChange={e => setFormData({...formData, username: e.target.value})}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                                    value={formData.password} 
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                />
                              </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Classe</label>
                            <select 
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                value={formData.classId}
                                onChange={e => setFormData({...formData, classId: e.target.value})}
                            >
                                {classes.length === 0 && <option value="">Aucune classe créée</option>}
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                          </div>
                        </>
                      )}

                      {/* Fields for Professor (Multiple Class Selection) */}
                      {formData.role === UserRole.PROFESSEUR && (
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Classes assignées (Cochez pour rendre visible)</label>
                              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 bg-gray-50 grid grid-cols-2 gap-2">
                                  {classes.map(cls => (
                                      <label key={cls.id} className="flex items-center space-x-2 text-sm">
                                          <input 
                                            type="checkbox" 
                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                            checked={formData.assignedClassIds.includes(cls.id)}
                                            onChange={() => toggleClassAssignment(cls.id)}
                                          />
                                          <span>{cls.name}</span>
                                      </label>
                                  ))}
                                  {classes.length === 0 && <p className="text-xs text-gray-500">Aucune classe disponible.</p>}
                              </div>
                          </div>
                      )}

                      <div className="flex items-center pt-2">
                          <input 
                            id="active" 
                            type="checkbox" 
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" 
                            checked={formData.active}
                            onChange={e => setFormData({...formData, active: e.target.checked})}
                          />
                          <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                              {isEleveForm ? 'Compte Actif (Peut se connecter)' : 'Visible dans les évaluations'}
                          </label>
                      </div>

                      <div className="pt-4 flex justify-end">
                          <button type="button" onClick={() => setIsUserModalOpen(false)} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 mr-3">Annuler</button>
                          <button type="submit" disabled={actionLoading} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">
                            {actionLoading ? <Loader className="animate-spin h-4 w-4" /> : 'Enregistrer'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default UserManagement;