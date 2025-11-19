import { User, ClassGroup, PointEvent, UserRole, ActionDefinition } from '../types';
import { PREDEFINED_ACTIONS } from '../constants';

const KEYS = {
  USERS: 'eval_ecole_users',
  CLASSES: 'eval_ecole_classes',
  EVENTS: 'eval_ecole_events',
  INIT: 'eval_ecole_init_v5_final' // Clé mise à jour pour forcer la réinitialisation
};

// Initial Seed Data
const seedData = () => {
  if (localStorage.getItem(KEYS.INIT)) return;

  // Génération de 24 classes (6 niveaux par grade : A, B, C, D, E, F pour 6ème, 5ème, 4ème, 3ème)
  const classes: ClassGroup[] = [];
  const grades = ['6ème', '5ème', '4ème', '3ème'];
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  grades.forEach(grade => {
    letters.forEach(letter => {
        classes.push({
            id: `c_${grade}_${letter}`,
            name: `${grade} ${letter}`
        });
    });
  });

  const users: User[] = [
    // Admin demandé : Paul / Paul2025.
    { id: 'u1', fullName: 'Administrateur', username: 'Paul', password: 'Paul2025.', role: UserRole.ADMIN, active: true },
    
    // Professeur Test (assigné à 6ème A et 6ème B)
    // Pas besoin de mdp/username car ils ne se connectent pas
    { 
        id: 'u_prof1', 
        fullName: 'M. Dupont', 
        username: '', 
        password: '', 
        role: UserRole.PROFESSEUR, 
        active: true, 
        assignedClassIds: [`c_6ème_A`, `c_6ème_B`] 
    },
    { 
        id: 'u_prof2', 
        fullName: 'Mme Durand', 
        username: '', 
        password: '', 
        role: UserRole.PROFESSEUR, 
        active: true, 
        assignedClassIds: [`c_6ème_A`] 
    },

    // Surveillant & Direction (Visibles par tous)
    { id: 'u_surv1', fullName: 'Mme Martin', username: '', password: '', role: UserRole.SURVEILLANT, active: true },
    { id: 'u_dir1', fullName: 'M. Le Directeur', username: '', password: '', role: UserRole.DIRECTION, active: true },
    
    // Élève Test (Classe 6ème A)
    { 
        id: 'u_eleve1', 
        fullName: 'Lucas', 
        username: 'eleve1', 
        password: '123', 
        role: UserRole.ELEVE, 
        active: true, 
        classId: `c_6ème_A` 
    },
  ];

  const events: PointEvent[] = [];

  localStorage.setItem(KEYS.CLASSES, JSON.stringify(classes));
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  localStorage.setItem(KEYS.EVENTS, JSON.stringify(events));
  localStorage.setItem(KEYS.INIT, 'true');
};

// Helper to read/write
const getItems = <T>(key: string): T[] => {
  const str = localStorage.getItem(key);
  return str ? JSON.parse(str) : [];
};

const setItems = <T>(key: string, items: T[]) => {
  localStorage.setItem(key, JSON.stringify(items));
};

export const DataService = {
  init: seedData,

  // USERS
  getUsers: (): User[] => getItems<User>(KEYS.USERS),
  
  getUserById: (id: string): User | undefined => {
    return getItems<User>(KEYS.USERS).find(u => u.id === id);
  },

  saveUser: (user: User) => {
    const users = getItems<User>(KEYS.USERS);
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    setItems(KEYS.USERS, users);
  },

  deleteUser: (id: string) => {
    let users = getItems<User>(KEYS.USERS);
    users = users.filter(u => u.id !== id);
    setItems(KEYS.USERS, users);
  },

  // CLASSES
  getClasses: (): ClassGroup[] => getItems<ClassGroup>(KEYS.CLASSES),

  addClass: (name: string) => {
    const classes = getItems<ClassGroup>(KEYS.CLASSES);
    const newClass = { id: Date.now().toString(), name };
    classes.push(newClass);
    setItems(KEYS.CLASSES, classes);
  },

  deleteClass: (id: string) => {
    let classes = getItems<ClassGroup>(KEYS.CLASSES);
    classes = classes.filter(c => c.id !== id);
    setItems(KEYS.CLASSES, classes);
  },
  
  // EVENTS
  getEvents: (): PointEvent[] => getItems<PointEvent>(KEYS.EVENTS),

  addEvent: (event: PointEvent) => {
    const events = getItems<PointEvent>(KEYS.EVENTS);
    events.push(event);
    setItems(KEYS.EVENTS, events);
  },

  getActions: (): ActionDefinition[] => PREDEFINED_ACTIONS,
};