import { ActionDefinition, ActionType, TargetRole, UserRole } from './types';

export const ROLES = Object.values(UserRole);

export const PREDEFINED_ACTIONS: ActionDefinition[] = [
  // Professeurs - Positive
  { id: 'p_help', label: "M'a aidé", targetRole: [TargetRole.PROFESSEUR], type: ActionType.POSITIVE, defaultPoints: 5 },
  { id: 'p_nice', label: "A été sympa", targetRole: [TargetRole.PROFESSEUR], type: ActionType.POSITIVE, defaultPoints: 3 },
  { id: 'p_absent', label: "N'a pas été là", targetRole: [TargetRole.PROFESSEUR], type: ActionType.POSITIVE, defaultPoints: 10 },
  
  // Professeurs - Negative
  { id: 'p_rude', label: "M'a envoyé chier", targetRole: [TargetRole.PROFESSEUR], type: ActionType.NEGATIVE, defaultPoints: -10 },
  { id: 'p_mock', label: "M'a ridiculisé", targetRole: [TargetRole.PROFESSEUR], type: ActionType.NEGATIVE, defaultPoints: -5 },
  { id: 'p_late', label: "Arrivé en retard", targetRole: [TargetRole.PROFESSEUR], type: ActionType.NEGATIVE, defaultPoints: -2 },
  { id: 'p_homework', label: "A donné des devoirs / évaluations", targetRole: [TargetRole.PROFESSEUR], type: ActionType.NEGATIVE, defaultPoints: -3 },

  // Surveillant & Direction - Positive
  { id: 'sd_help', label: "M'a aidé", targetRole: [TargetRole.SURVEILLANT, TargetRole.DIRECTION], type: ActionType.POSITIVE, defaultPoints: 5 },
  { id: 'sd_justice', label: "M'a rendu justice", targetRole: [TargetRole.SURVEILLANT, TargetRole.DIRECTION], type: ActionType.POSITIVE, defaultPoints: 5 },
  { id: 'sd_protect', label: "M'a protégé", targetRole: [TargetRole.SURVEILLANT, TargetRole.DIRECTION], type: ActionType.POSITIVE, defaultPoints: 5 },

  // Surveillant & Direction - Negative
  { id: 'sd_belittle', label: "M'a rabaissé", targetRole: [TargetRole.SURVEILLANT, TargetRole.DIRECTION], type: ActionType.NEGATIVE, defaultPoints: -5 },
  { id: 'sd_ignore', label: "M'a ignoré", targetRole: [TargetRole.SURVEILLANT, TargetRole.DIRECTION], type: ActionType.NEGATIVE, defaultPoints: -3 },
  { id: 'sd_speak_bad', label: "M'a mal parlé", targetRole: [TargetRole.SURVEILLANT, TargetRole.DIRECTION], type: ActionType.NEGATIVE, defaultPoints: -5 },
  { id: 'sd_punish', label: "Punition injuste", targetRole: [TargetRole.SURVEILLANT, TargetRole.DIRECTION], type: ActionType.NEGATIVE, defaultPoints: -10 },
];

export const CUSTOM_ACTION_ID = 'custom_action';
