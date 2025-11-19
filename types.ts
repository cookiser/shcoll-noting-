export enum UserRole {
  ELEVE = 'Élève',
  PROFESSEUR = 'Professeur',
  SURVEILLANT = 'Surveillant',
  DIRECTION = 'Direction',
  COMPTABILITE = 'Comptabilité',
  ADMIN = 'Admin',
}

export interface ClassGroup {
  id: string;
  name: string; // e.g., "6A", "5B"
}

export interface User {
  id: string;
  fullName: string;
  username: string;
  password: string; // In a real app, this would be hashed
  role: UserRole;
  active: boolean;
  classId?: string; // For students
  assignedClassIds?: string[]; // For teachers (optional, if they manage specific classes)
}

export enum ActionType {
  POSITIVE = 'Positif',
  NEGATIVE = 'Négatif',
}

export enum TargetRole {
  PROFESSEUR = 'Professeur',
  SURVEILLANT = 'Surveillant',
  DIRECTION = 'Direction',
}

export interface ActionDefinition {
  id: string;
  label: string;
  targetRole: TargetRole[]; // Who can receive this action
  type: ActionType;
  defaultPoints: number;
  isCustom?: boolean; // Helper to identify if it allows custom text input logic
}

export interface PointEvent {
  id: string;
  dateTime: string; // ISO String
  studentId?: string; // Who experienced it (usually student)
  createdById: string; // Who logged it
  targetUserId: string; // Who received points
  actionId: string | null; // Null if purely custom
  customLabel?: string; // If custom
  points: number;
}
