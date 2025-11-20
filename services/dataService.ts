import { supabase } from './supabase';
import { User, ClassGroup, PointEvent, UserRole, ActionDefinition } from '../types';
import { PREDEFINED_ACTIONS } from '../constants';

// Mapping functions (DB snake_case to App camelCase)
const mapUser = (data: any): User => ({
  id: data.id,
  fullName: data.full_name || 'Utilisateur Inconnu',
  username: data.username || '',
  password: data.password || '',
  role: (data.role as UserRole) || UserRole.ELEVE,
  active: data.active === true, 
  classId: data.class_id || undefined,
  assignedClassIds: data.assigned_class_ids || []
});

const mapClass = (data: any): ClassGroup => ({
  id: data.id,
  name: data.name || 'Classe sans nom'
});

const mapEvent = (data: any): PointEvent => ({
  id: data.id,
  dateTime: data.date_time,
  createdById: data.created_by_id,
  studentId: data.student_id || undefined,
  targetUserId: data.target_user_id,
  actionId: data.action_id || null,
  customLabel: data.custom_label || undefined,
  points: data.points || 0
});

// Variable pour stocker la dernière erreur d'init
let lastInitError: any = null;

export const DataService = {
  // INITIALISATION (Check connectivity)
  init: async (): Promise<'OK' | 'MISSING_TABLES'> => {
    try {
      // On tente de lire une seule ligne de la table 'classes'.
      // C'est le test le plus fiable pour voir si la table existe et si on a les droits.
      const { error } = await supabase.from('classes').select('id').limit(1);
      
      if (error) {
        lastInitError = error;
        console.error("Erreur DB (Init):", JSON.stringify(error, null, 2));
        return 'MISSING_TABLES';
      }
      
      return 'OK';
    } catch (error: any) {
      lastInitError = error;
      const msg = error && typeof error === 'object' ? JSON.stringify(error) : String(error);
      console.error("Exception critique lors de l'init:", msg);
      return 'MISSING_TABLES';
    }
  },

  getLastError: () => lastInitError,

  // --- USERS ---
  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*');
    
    if (error) {
        console.error("Erreur getUsers:", JSON.stringify(error));
        throw error;
    }
    
    if (!data) return [];
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
    if (error) console.error('Error saving user', JSON.stringify(error));
  },

  deleteUser: async (id: string) => {
    await supabase.from('users').delete().eq('id', id);
  },

  // --- CLASSES ---
  getClasses: async (): Promise<ClassGroup[]> => {
    const { data, error } = await supabase.from('classes').select('*').order('name');
    if (error) throw error;
    if (!data) return [];
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
    if (!data) return [];
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

  // --- EVENTS MANAGEMENT (ADMIN) ---
  
  // Supprimer TOUS les points (Reset global)
  deleteAllEvents: async () => {
    // L'astuce pour tout supprimer sans filtre est de demander id != 'impossible_value'
    // ou simplement d'utiliser une condition toujours vraie si Supabase l'accepte.
    // Ici on supprime tout ce qui a un ID (donc tout).
    const { error } = await supabase.from('events').delete().neq('id', '0');
    if (error) throw error;
  },

  // Supprimer les points d'une cible spécifique
  deleteEventsForTarget: async (targetUserId: string) => {
    const { error } = await supabase.from('events').delete().eq('target_user_id', targetUserId);
    if (error) throw error;
  },

  // --- CONSTANTS ---
  getActions: (): ActionDefinition[] => PREDEFINED_ACTIONS,
};