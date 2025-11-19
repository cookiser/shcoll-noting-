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
  // INITIALISATION (Check connectivity)
  init: async (): Promise<'OK' | 'MISSING_TABLES'> => {
    try {
      // Tentative de lecture simple pour voir si la table existe
      const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error("Erreur DB:", error);
        // 42P01 est le code Postgres pour "undefined_table"
        // "relation" dans le message indique aussi souvent que la table manque
        if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
             return 'MISSING_TABLES';
        }
        // Si erreur de permission, on considère aussi qu'il faut relancer le script (qui inclut les droits)
        if (error.code === '42501' || error.message.includes('permission denied')) {
            return 'MISSING_TABLES';
        }
        // Autres erreurs (réseau, etc.)
        return 'OK'; // On laisse l'app essayer de continuer ou afficher une erreur plus tard
      }
      
      // Si table vide mais existe, on pourrait initialiser via l'API, mais on préfère le SQL pour la robustesse
      if (count === 0) {
          // Optionnel : insérer un admin par défaut via API si on veut, 
          // mais le SetupWizard est plus propre.
          return 'MISSING_TABLES'; // On force le wizard pour avoir des données propres
      }

      return 'OK';
    } catch (error) {
      console.error("Erreur critique lors de l'init:", error);
      return 'OK';
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