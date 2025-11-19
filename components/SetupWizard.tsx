import React, { useState } from 'react';
import { Copy, Check, AlertTriangle, Database } from 'lucide-react';

const SQL_SCRIPT = `-- 1. Nettoyage (au cas où)
drop table if exists public.events;
drop table if exists public.users;
drop table if exists public.classes;

-- 2. Création des tables
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

-- 3. OUVERTURE DES DROITS (IMPORTANT)
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
('surv1', 'Mme La Surveillante', 'Surveillant', true);`;

const SetupWizard: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center text-white">
                <Database className="w-6 h-6 mr-3" />
                <h1 className="text-xl font-bold">Installation de la Base de Données</h1>
            </div>
            <span className="bg-yellow-400 text-indigo-900 text-xs font-bold px-2 py-1 rounded uppercase">Requis</span>
        </div>

        <div className="p-6 space-y-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                            L'application est connectée à Supabase, mais les tables sont introuvables ou inaccessibles.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Instructions :</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-600 ml-2">
                    <li>Copiez le code SQL ci-dessous.</li>
                    <li>Allez dans votre projet Supabase, menu <strong>SQL Editor</strong>.</li>
                    <li>Collez le code dans une nouvelle requête ("New Query").</li>
                    <li>Cliquez sur <strong>RUN</strong>.</li>
                    <li>Revenez ici et rafraîchissez la page.</li>
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
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;