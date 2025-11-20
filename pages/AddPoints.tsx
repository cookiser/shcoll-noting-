import React, { useState, useMemo, useEffect } from 'react';
import { User, UserRole, PointEvent, ActionType, TargetRole } from '../types';
import { DataService } from '../services/dataService';
import { Search, Send, CheckCircle, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CUSTOM_ACTION_ID } from '../constants';

interface AddPointsProps {
  currentUser: User;
}

const AddPoints: React.FC<AddPointsProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const actions = DataService.getActions();

  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  
  // Custom Action State
  const [customActionText, setCustomActionText] = useState('');
  const [customPoints, setCustomPoints] = useState<number | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
      const load = async () => {
          const u = await DataService.getUsers();
          setUsers(u);
          setLoading(false);
      };
      load();
  }, []);

  // Filter Targets based on rules
  const targetUsers = useMemo(() => {
    // 1. Get all active users
    let filtered = users.filter(u => u.active);
    
    // 2. Filter only adults (Targets)
    const isAdult = (r: UserRole) => [UserRole.PROFESSEUR, UserRole.SURVEILLANT, UserRole.DIRECTION].includes(r);
    filtered = filtered.filter(u => isAdult(u.role));

    // 3. Role-Specific Visibility Logic
    if (currentUser.role === UserRole.ELEVE && currentUser.classId) {
        filtered = filtered.filter(u => {
            // PROFESSEUR: Only visible if assigned to student's class
            if (u.role === UserRole.PROFESSEUR) {
                return u.assignedClassIds && u.assignedClassIds.includes(currentUser.classId!);
            }
            // SURVEILLANT & DIRECTION: Visible to ALL students
            return true;
        });
    }
    
    // 4. Search Term
    if (searchTerm) {
        filtered = filtered.filter(u => u.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    return filtered;
  }, [users, currentUser, searchTerm]);

  const selectedTargetUser = users.find(u => u.id === selectedTargetId);

  // Filter actions based on selected target role
  const availableActions = useMemo(() => {
    if (!selectedTargetUser) return [];
    
    let targetRoleEnum: TargetRole;
    if (selectedTargetUser.role === UserRole.PROFESSEUR) targetRoleEnum = TargetRole.PROFESSEUR;
    else if (selectedTargetUser.role === UserRole.SURVEILLANT) targetRoleEnum = TargetRole.SURVEILLANT;
    else targetRoleEnum = TargetRole.DIRECTION;

    return actions.filter(a => a.targetRole.includes(targetRoleEnum));
  }, [selectedTargetUser, actions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetId) return;
    setSubmitting(true);
    
    let points = 0;
    let actionId = selectedActionId;
    let finalCustomLabel = undefined;

    if (selectedActionId === CUSTOM_ACTION_ID) {
        if (!customActionText.trim() || customPoints === null) return;
        finalCustomLabel = customActionText;
        actionId = null;
        points = customPoints;
    } else {
        const act = actions.find(a => a.id === selectedActionId);
        if (act) points = act.defaultPoints;
    }

    const newEvent: PointEvent = {
        id: Date.now().toString(),
        dateTime: new Date().toISOString(),
        createdById: currentUser.id,
        studentId: currentUser.role === UserRole.ELEVE ? currentUser.id : undefined,
        targetUserId: selectedTargetId,
        actionId: actionId,
        customLabel: finalCustomLabel,
        points: points
    };

    await DataService.addEvent(newEvent);
    setSubmitting(false);
    setSuccess(true);
    setTimeout(() => {
        setSuccess(false);
        setSelectedTargetId(null);
        setSelectedActionId(null);
        setCustomActionText('');
        setCustomPoints(null);
        setSearchTerm('');
        navigate('/');
    }, 1500);
  };

  if (loading) return <div className="p-8 text-center"><Loader className="animate-spin w-8 h-8 mx-auto text-indigo-600" /></div>;

  if (success) {
      return (
          <div className="flex flex-col items-center justify-center h-96 text-center">
              <CheckCircle className="w-20 h-20 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Évaluation enregistrée !</h2>
              <p className="text-gray-500 mt-2">Redirection en cours...</p>
          </div>
      );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ajouter / Retirer des points</h1>
        <p className="text-gray-500">Sélectionnez un adulte et une action pour évaluer.</p>
      </div>

      <div className="bg-white shadow rounded-xl p-6 space-y-6">
        
        {/* Step 1: Select Adult */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">1. Sélectionner un adulte</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Rechercher par nom..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-md p-2 bg-gray-50">
                {targetUsers.map(u => (
                    <div 
                        key={u.id}
                        onClick={() => { setSelectedTargetId(u.id); setSelectedActionId(null); }}
                        className={`cursor-pointer p-3 rounded-lg flex items-center border transition-all ${selectedTargetId === u.id ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-gray-200 bg-white hover:border-indigo-300'}`}
                    >
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3 ${u.role === UserRole.PROFESSEUR ? 'bg-blue-500' : 'bg-orange-500'}`}>
                            {u.role === UserRole.PROFESSEUR ? 'P' : u.role.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">{u.fullName}</p>
                            <p className="text-xs text-gray-500">{u.role}</p>
                        </div>
                    </div>
                ))}
                {targetUsers.length === 0 && (
                    <p className="p-4 text-sm text-gray-500 text-center col-span-full">Aucun adulte correspondant trouvé.</p>
                )}
            </div>
        </div>

        {/* Step 2: Select Action */}
        {selectedTargetId && (
            <div className="animate-fade-in">
                <label className="block text-sm font-medium text-gray-700 mb-2">2. Sélectionner une action</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availableActions.map(action => (
                         <button
                            key={action.id}
                            type="button"
                            onClick={() => setSelectedActionId(action.id)}
                            className={`relative text-left p-4 border rounded-lg shadow-sm hover:shadow-md transition-all ${selectedActionId === action.id 
                                ? (action.type === ActionType.POSITIVE ? 'border-green-500 bg-green-50 ring-1 ring-green-200' : 'border-red-500 bg-red-50 ring-1 ring-red-200')
                                : 'bg-white border-gray-200'
                            }`}
                         >
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-900">{action.label}</span>
                                <span className={`text-xs font-bold px-2 py-1 rounded ${action.type === ActionType.POSITIVE ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
                                    {action.defaultPoints > 0 ? '+' : ''}{action.defaultPoints}
                                </span>
                            </div>
                         </button>
                    ))}
                    
                    {/* Custom Action Option */}
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedActionId(CUSTOM_ACTION_ID);
                            setCustomPoints(null);
                        }}
                        className={`relative text-left p-4 border rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-between ${selectedActionId === CUSTOM_ACTION_ID ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200' : 'bg-white border-gray-200'}`}
                    >
                        <span className="text-sm font-medium text-gray-900">Action personnalisée...</span>
                    </button>
                </div>
            </div>
        )}

        {/* Step 3: Custom Details (if selected) */}
        {selectedActionId === CUSTOM_ACTION_ID && (
             <div className="p-4 bg-gray-50 rounded-md border border-gray-200 animate-fade-in">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description de l'action</label>
                <input
                    type="text"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border mb-3"
                    placeholder="Ex: A pris le temps de m'expliquer..."
                    value={customActionText}
                    onChange={(e) => setCustomActionText(e.target.value)}
                />
                
                <label className="block text-sm font-medium text-gray-700 mb-2">Points à attribuer</label>
                <div className="space-y-3">
                    {/* Positive Values */}
                    <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map(val => (
                            <button
                                key={`pos-${val}`}
                                type="button"
                                onClick={() => setCustomPoints(val)}
                                className={`flex-1 py-2 rounded text-sm font-bold transition-colors ${
                                    customPoints === val 
                                    ? 'bg-green-600 text-white shadow-md transform scale-105' 
                                    : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                                }`}
                            >
                                +{val}
                            </button>
                        ))}
                    </div>

                    {/* Negative Values */}
                    <div className="flex space-x-2">
                        {[-1, -2, -3, -4, -5].map(val => (
                            <button
                                key={`neg-${val}`}
                                type="button"
                                onClick={() => setCustomPoints(val)}
                                className={`flex-1 py-2 rounded text-sm font-bold transition-colors ${
                                    customPoints === val 
                                    ? 'bg-red-600 text-white shadow-md transform scale-105' 
                                    : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                                }`}
                            >
                                {val}
                            </button>
                        ))}
                    </div>
                </div>
             </div>
        )}

        {/* Submit */}
        <div className="pt-4">
            <button
                onClick={handleSubmit}
                disabled={!selectedTargetId || !selectedActionId || (selectedActionId === CUSTOM_ACTION_ID && (!customActionText || customPoints === null)) || submitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
                {submitting ? <Loader className="animate-spin w-4 h-4" /> : <><Send className="w-4 h-4 mr-2" /> Envoyer l'évaluation</>}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AddPoints;