import React, { useEffect, useState } from 'react';
import { User, UserRole, ClassGroup } from '../types';
import { DataService } from '../services/dataService';
import { Users, Loader } from 'lucide-react';

interface MyClassProps {
  currentUser: User;
}

const MyClass: React.FC<MyClassProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
        const [u, c] = await Promise.all([DataService.getUsers(), DataService.getClasses()]);
        setUsers(u);
        setClasses(c);
        setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="p-8 text-center"><Loader className="animate-spin w-8 h-8 mx-auto text-indigo-600" /></div>;

  // Logic for "My Class"
  let myStudents: User[] = [];
  let myClassTitle = '';

  if (currentUser.role === UserRole.ELEVE && currentUser.classId) {
    myStudents = users.filter(u => u.role === UserRole.ELEVE && u.classId === currentUser.classId);
    const cls = classes.find(c => c.id === currentUser.classId);
    myClassTitle = cls ? `Ma Classe: ${cls.name}` : 'Ma Classe';
  } else if (currentUser.role === UserRole.PROFESSEUR) {
    // Teachers see students in classes they manage. 
    const assignedIds = currentUser.assignedClassIds || [];
    myStudents = users.filter(u => u.role === UserRole.ELEVE && u.classId && assignedIds.includes(u.classId));
    const classNames = classes.filter(c => assignedIds.includes(c.id)).map(c => c.name).join(', ');
    myClassTitle = `Mes Classes: ${classNames}`;
  }

  // Adults associated (Teachers for Student view)
  let associatedAdults: User[] = [];
  if (currentUser.role === UserRole.ELEVE && currentUser.classId) {
      associatedAdults = users.filter(u => 
        u.role === UserRole.PROFESSEUR && 
        u.assignedClassIds && 
        u.assignedClassIds.includes(currentUser.classId!)
      );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{myClassTitle}</h1>
        <p className="text-gray-500">
            {currentUser.role === UserRole.ELEVE ? "Voici tes camarades et tes professeurs." : "Voici les élèves de vos classes."}
        </p>
      </div>

      {/* Adults Section (Only for Students) */}
      {currentUser.role === UserRole.ELEVE && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-indigo-50 border-b border-indigo-100">
                <h3 className="text-lg leading-6 font-medium text-indigo-900">
                    Professeurs de la classe
                </h3>
            </div>
            <ul className="divide-y divide-gray-200">
                {associatedAdults.length > 0 ? (
                    associatedAdults.map(adult => (
                        <li key={adult.id} className="px-4 py-4 flex items-center">
                            <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                    {adult.fullName.charAt(0)}
                                </div>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{adult.fullName}</p>
                                <p className="text-xs text-gray-500">Professeur</p>
                            </div>
                        </li>
                    ))
                ) : (
                    <li className="px-4 py-4 text-sm text-gray-500">Aucun professeur assigné spécifiquement à cette classe.</li>
                )}
            </ul>
        </div>
      )}

      {/* Students List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex items-center">
            <Users className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">
                Élèves
            </h3>
        </div>
        <ul className="divide-y divide-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {myStudents.map(student => (
                <li key={student.id} className="px-4 py-4 flex items-center">
                    <div className="flex-shrink-0">
                         <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                             {student.fullName.charAt(0)}
                         </div>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{student.fullName}</p>
                        <div className="flex items-center mt-1">
                           <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${student.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                             {student.active ? 'Actif' : 'Inactif'}
                           </span>
                        </div>
                    </div>
                </li>
            ))}
            {myStudents.length === 0 && (
                 <li className="px-4 py-8 text-sm text-gray-500 col-span-full text-center">Aucun élève trouvé.</li>
            )}
        </ul>
      </div>
    </div>
  );
};

export default MyClass;