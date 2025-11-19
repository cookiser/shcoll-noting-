import { supabase } from './supabase';
import { User, ClassGroup, PointEvent, UserRole, ActionDefinition } from '../types';
import { PREDEFINED_ACTIONS } from '../constants';

// Mapping functions (DB snake_case to App camelCase)
const mapUser = (data: any): User => ({
  id: data.id,
  fullName: data.full_name,
  username: data.username || '',
  password: data.password || '',
  role: data.role as UserRole,
  active: data.active,
  classId: data.class_id || undefined,
  assignedClassIds: data.assigned_class_ids || []
});

const mapClass = (data: any): ClassGroup => ({
  id: data.id,
  name: data.name
});

const mapEvent = (data: any): PointEvent => ({
  id: data.id,
  dateTime: data.date_time,
  createdById: data.created_by_id,
  studentId: data.student_id || undefined,
  targetUserId: data.target_user_id,
  actionId: data.action_id || null,
  customLabel: data.custom_label || undefined,
  points: data.points
});

export const DataService = {
  // INITIALISATION (Seed Data if empty)
  init: async () => {
    try {
      // On vérifie si des utilisateurs existent. 
      // Si la table n'existe pas, cette requête va échouer (catch), ce qui est normal si le SQL n'a pas été lancé.
      const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error("Erreur d'accès à la base de données (Tables manquantes ?):", error.message);
        return;
      }
      
      if (count === 0) {
        console.log("Base de données vide, tentative d'initialisation via l'App...");
        
        // 1. Création des Classes (IDs courts comme c6a pour matcher le SQL)
        const classesPayload = [];
        const grades = [
          { label: '6ème', code: '6' },
          { label: '5ème', code: '5' },
          { label: '4ème', code: '4' },
          { label: '3ème', code: '3' }
        ];
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

        grades.forEach(grade => {
          letters.forEach(letter => {
            classesPayload.push({
                id: `c${grade.code}${letter.toLowerCase()}`, // ex: c6a
                name: `${grade.label} ${letter}`
            });
          });
        });
        
        await supabase.from('classes').insert(classesPayload);

        // 2. Création des Utilisateurs
        const usersPayload = [
          // Admin
          { 
            id: 'u1', full_name: 'Administrateur', username: 'Paul', password: 'Paul2025.', role: UserRole.ADMIN, active: true 
          },
          // Professeurs
          { 
            id: 'prof1', full_name: 'M. Dupont', role: UserRole.PROFESSEUR, active: true, 
            assigned_class_ids: ['c6a', 'c6b']
          },
          { 
            id: 'prof2', full_name: 'Mme Durand', role: UserRole.PROFESSEUR, active: true, 
            assigned_class_ids: ['c6a']
          },
          // Staff Global
          { id: 'surv1', full_name: 'Mme Martin', role: UserRole.SURVEILLANT, active: true },
          { id: 'dir1', full_name: 'M. Le Directeur', role: UserRole.DIRECTION, active: true },
          // Élève
          { 
            id: 'eleve1', full_name: 'Lucas', username: 'eleve1', password: '123', role: UserRole.ELEVE, active: true, 
            class_id: 'c6a' 
          },
        ];

        await supabase.from('users').insert(usersPayload);
        console.log("Initialisation terminée.");
      }
    } catch (error) {
      console.error("Erreur critique lors de l'init:", error);
    }
  },

  // --- USERS ---
  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return data.map(mapUser);
  },

  getUserById: async (id: string): Promise<User | undefined> => {
     const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
     if (error || !data) return undefined;
     return mapUser(data);
  },

  saveUser: async (user: User) => {
    const payload = {
      id: user.id,
      full_name: user.fullName,
      username: user.username || null,
      password: user.password || null,
      role: user.role,
      active: user.active,
      class_id: user.classId || null,
      assigned_class_ids: user.assignedClassIds || null
    };
    const { error } = await supabase.from('users').upsert(payload);
    if (error) console.error('Error saving user', error);
  },

  deleteUser: async (id: string) => {
    await supabase.from('users').delete().eq('id', id);
  },

  // --- CLASSES ---
  getClasses: async (): Promise<ClassGroup[]> => {
    const { data, error } = await supabase.from('classes').select('*').order('name');
    if (error) throw error;
    return data.map(mapClass);
  },

  addClass: async (name: string) => {
    const id = `c_${Date.now()}`;
    await supabase.from('classes').insert([{ id, name }]);
  },

  deleteClass: async (id: string) => {
    await supabase.from('classes').delete().eq('id', id);
  },

  // --- EVENTS ---
  getEvents: async (): Promise<PointEvent[]> => {
    const { data, error } = await supabase.from('events').select('*');
    if (error) throw error;
    return data.map(mapEvent);
  },

  addEvent: async (event: PointEvent) => {
    const payload = {
      id: event.id,
      date_time: event.dateTime,
      created_by_id: event.createdById,
      student_id: event.studentId || null,
      target_user_id: event.targetUserId,
      action_id: event.actionId || null,
      custom_label: event.customLabel || null,
      points: event.points
    };
    await supabase.from('events').insert([payload]);
  },

  // --- CONSTANTS ---
  getActions: (): ActionDefinition[] => PREDEFINED_ACTIONS,
};