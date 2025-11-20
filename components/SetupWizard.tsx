import React, { useState } from 'react';
import { Copy, Check, AlertTriangle, Database, PlayCircle } from 'lucide-react';

// ID du projet extrait de la configuration pour vérification visuelle
const PROJECT_ID = 'zafmtyqrtgiwfydkfmgq';

const SQL_SCRIPT = `-- 1. Nettoyage (Supprime les anciennes versions pour éviter les conflits)
drop table if exists public.events;
drop table if exists public.users;
drop table if exists public.classes;

-- 2. Création des tables (Les tiroirs de rangement)
create table public.classes (
  id text primary key,
  name text not null
);

create table public.users (
  id text primary key,
  full_name text not null,
  username text,
  password text,
  role text not null,
  active boolean default true,
  class_id text, 
  assigned_class_ids text[] 
);

create table public.events (
  id text primary key,
  date_time text not null,
  created_by_id text not null,
  student_id text,
  target_user_id text not null,
  action_id text,
  custom_label text,
  points integer not null
);

-- 3. OUVERTURE DES DROITS (Corrige l'erreur "Privilèges")
alter table public.classes disable row level security;
alter table public.users disable row level security;
alter table public.events disable row level security;

-- 4. Données de démarrage
insert into public.users (id, full_name, username, password, role, active)
values ('u1', 'Administrateur', 'Paul', 'Paul2025.', 'Admin', true);

insert into public.classes (id, name) values
('c6a', '6ème A'), ('c6b', '6ème B'), ('c6c', '6ème C'), ('c6d', '6ème D'), ('c6e', '6ème E'), ('c6f', '6ème F'),
('c5a', '5ème A'), ('c5b', '5ème B'), ('c5c', '5ème C'), ('c5d', '5ème D'), ('c5e', '5ème E'), ('c5f', '5ème F'),
('c4a', '4ème A'), ('c4b', '4ème B'), ('c4c', '4ème C'), ('c4d', '4ème D'), ('c4e', '4ème E'), ('c4f', '4ème F'),
('c3a', '3ème A'), ('c3b', '3ème B'), ('c3c', '3ème C'), ('c3d', '3ème D'), ('c3e', '3ème E'), ('c3f', '3ème F');

insert into public.users (id, full_name, role, active, assigned_class_ids)
values ('prof1', 'M. Dupont', 'Professeur', true, ARRAY['c6a', 'c6b']);

insert into public.users (id, full_name, username, password, role, active, class_id)
values ('eleve1', 'Lucas', 'eleve1', '123', 'Élève', true, 'c6a');

insert into public.users (id, full_name, role, active) values 
('dir1', 'M. Le Directeur', 'Direction', true),
('surv1', 'Mme La Surveillante', 'Surveillant', true);

-- 5. FORCE LE RAFRAÎCHISSEMENT DU CACHE (Corrige l'erreur "Schema Cache")
NOTIFY pgrst, 'reload config';`;

interface SetupWizardProps {
  onBypass: () => void;
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onBypass }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="bg-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between text-white mb-2">
                <div className="flex items-center">
                    <Database className="w-6 h-6 mr-3" />
                    <h1 className="text-xl font-bold">Installation & Réparation</h1>
                </div>
                <span className="bg-yellow-400 text-indigo-900 text-xs font-bold px-2 py-1 rounded uppercase">Action requise</span>
            </div>
            <div className="text-indigo-100 text-xs font-mono">
                Projet ID: <span className="font-bold text-white">{PROJECT_ID}</span>
            </div>
        </div>

        <div className="p-6 space-y-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700 font-bold">
                            Base de données non détectée ou cache expiré.
                        </p>
                        <p className="text-sm text-yellow-600 mt-1">
                            Suivez les instructions ci-dessous pour configurer votre projet Supabase.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Instructions :</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-600 ml-2">
                    <li>Vérifiez que l'URL de votre navigateur Supabase contient l'ID : <strong>{PROJECT_ID}</strong></li>
                    <li>Copiez le code SQL ci-dessous.</li>
                    <li>Allez dans Supabase &gt; <strong>SQL Editor</strong> &gt; <strong>New Query</strong>.</li>
                    <li>Collez le code et cliquez sur <strong>RUN</strong>.</li>
                    <li>Une fois que vous voyez "Success", cliquez sur le bouton vert ci-dessous.</li>
                </ol>
            </div>

            <div className="relative rounded-md bg-slate-900 p-4 overflow-hidden group">
                <div className="absolute top-2 right-2">
                    <button 
                        onClick={handleCopy}
                        className="flex items-center px-3 py-1 bg-white bg-opacity-10 hover:bg-opacity-20 text-white rounded text-sm transition-colors"
                    >
                        {copied ? <Check className="w-4 h-4 mr-1 text-green-400" /> : <Copy className="w-4 h-4 mr-1" />}
                        {copied ? 'Copié !' : 'Copier le code'}
                    </button>
                </div>
                <pre className="text-xs text-blue-100 font-mono overflow-x-auto h-64 p-2 whitespace-pre-wrap">
                    {SQL_SCRIPT}
                </pre>
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-4">
                <button 
                    onClick={() => window.location.reload()}
                    className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 shadow-sm transition-all transform hover:scale-[1.02]"
                >
                    <PlayCircle className="w-5 h-5 mr-2" />
                    J'ai terminé l'installation, Lancer l'app !
                </button>

                <div className="text-center">
                    <button 
                        onClick={onBypass}
                        className="text-xs text-gray-400 hover:text-indigo-600 underline"
                    >
                        Je suis sûr que ça marche, forcer l'accès au login
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;