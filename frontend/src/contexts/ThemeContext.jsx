import { createContext, useContext, useState, useEffect } from 'react'

// ─── Translations ─────────────────────────────────────────────────────────────
const TRANSLATIONS = {
  fr: {
    // Auth
    welcome: 'Bienvenue', signin_sub: 'Connectez-vous à votre portail de santé mentale',
    sign_in: 'Se Connecter', register: "S'inscrire", role_as: 'Se connecter en tant que',
    student: 'Étudiant', counselor: 'Conseiller', admin: 'Administrateur',
    email: 'Adresse Email', password: 'Mot de passe', signin_btn: 'Se connecter',
    no_account: 'Pas de compte ?', register_here: "S'inscrire ici",
    first_name: 'Prénom', last_name: 'Nom', student_id: 'Numéro étudiant',
    create_account: 'Créer un compte', have_account: 'Déjà inscrit ?', sign_in_here: 'Se connecter',
    // Nav
    dashboard: 'Tableau de bord', my_cases: 'Mes Demandes', cases: 'Dossiers',
    messages: 'Messages', resources: 'Ressources', users: 'Utilisateurs',
    reports: 'Rapports', profile: 'Profil', settings: 'Paramètres', sign_out: 'Déconnexion',
    // Dashboard
    hello: 'Bonjour', not_alone: "Vous n'êtes pas seul(e). Nos conseillers sont là pour vous.",
    active_requests: 'Demandes actives', unread_msgs: 'Messages non lus',
    resources_read: 'Ressources lues', sessions_done: 'Séances effectuées',
    // Cases
    new_request: '+ Nouvelle Demande', case_type: 'Type', priority: 'Priorité',
    status: 'Statut', submitted: 'Soumis le', open: 'Ouvert', in_progress: 'En cours',
    resolved: 'Résolu', closed: 'Fermé', low: 'Faible', medium: 'Moyenne',
    high: 'Élevée', urgent: 'Urgente',
    // Messages
    type_message: 'Écrire un message…', send: 'Envoyer',
    // Misc
    save: 'Enregistrer', cancel: 'Annuler', submit: 'Soumettre',
    loading: 'Chargement…', no_data: 'Aucune donnée', search: 'Rechercher…',
    safe_space: 'Votre espace sécurisé', flag: '🇫🇷', lang_label: 'FR',
    tagline: 'Soutien en Santé Mentale',
    quote: "Chaque étudiant mérite un espace sûr pour grandir, guérir et s'épanouir.",
  },
  en: {
    welcome: 'Welcome', signin_sub: 'Sign in to your mental health support portal',
    sign_in: 'Sign In', register: 'Register', role_as: 'Sign in as',
    student: 'Student', counselor: 'Counselor', admin: 'Administrator',
    email: 'Email Address', password: 'Password', signin_btn: 'Sign In',
    no_account: "Don't have an account?", register_here: 'Register here',
    first_name: 'First Name', last_name: 'Last Name', student_id: 'Student ID',
    create_account: 'Create Account', have_account: 'Already registered?', sign_in_here: 'Sign in',
    dashboard: 'Dashboard', my_cases: 'My Requests', cases: 'Cases',
    messages: 'Messages', resources: 'Resources', users: 'Users',
    reports: 'Reports', profile: 'Profile', settings: 'Settings', sign_out: 'Sign Out',
    hello: 'Hello', not_alone: "You are not alone. Our counselors are here to support you.",
    active_requests: 'Active Requests', unread_msgs: 'Unread Messages',
    resources_read: 'Resources Read', sessions_done: 'Sessions Done',
    new_request: '+ New Request', case_type: 'Type', priority: 'Priority',
    status: 'Status', submitted: 'Submitted', open: 'Open', in_progress: 'In Progress',
    resolved: 'Resolved', closed: 'Closed', low: 'Low', medium: 'Medium',
    high: 'High', urgent: 'Urgent',
    type_message: 'Type a message…', send: 'Send',
    save: 'Save', cancel: 'Cancel', submit: 'Submit',
    loading: 'Loading…', no_data: 'No data', search: 'Search…',
    safe_space: 'Your safe space', flag: '🇬🇧', lang_label: 'EN',
    tagline: 'Mental Health Support',
    quote: "Every student deserves a safe space to grow, heal, and thrive.",
  },
  rw: {
    welcome: 'Murakaza Neza', signin_sub: "Injira kuri porotali y'ubuzima bwo mu mutwe",
    sign_in: 'Injira', register: 'Iyandikishe', role_as: 'Injira nka',
    student: 'Umunyeshuri', counselor: 'Umujyanama', admin: 'Umuyobozi',
    email: 'Imeyili', password: "Ijambo ry'ibanga", signin_btn: 'Injira',
    no_account: 'Nta konti ufite?', register_here: 'Iyandikishe hano',
    first_name: "Izina ry'mbere", last_name: 'Irindi zina', student_id: "Numero y'umunyeshuri",
    create_account: 'Fungura konti', have_account: 'Usanzwe ufite konti?', sign_in_here: 'Injira',
    dashboard: 'Intangiriro', my_cases: 'Ibisabwa byanjye', cases: 'Ibibazo',
    messages: 'Ubutumwa', resources: 'Amakuru', users: 'Abakoresha',
    reports: 'Raporo', profile: 'Umwirondoro', settings: 'Igenamiterere', sign_out: 'Sohoka',
    hello: 'Mwaramutse', not_alone: "Ntufite ikibazo. Abajyanama bacu bari hano kukufasha.",
    active_requests: 'Ibisabwa bikora', unread_msgs: 'Ubutumwa butasomwe',
    resources_read: 'Amakuru yasomwe', sessions_done: 'Inama zaranzwe',
    new_request: '+ Isaba Rishya', case_type: 'Ubwoko', priority: 'Uburemere',
    status: 'Imiterere', submitted: 'Byoherejwe', open: 'Bufunguye', in_progress: 'Birakora',
    resolved: 'Byakemutse', closed: 'Bifunze', low: 'Hasi', medium: 'Hagati',
    high: 'Hejuru', urgent: 'Byihutirwa',
    type_message: 'Andika ubutumwa…', send: 'Ohereza',
    save: 'Bika', cancel: 'Hagarika', submit: 'Ohereza',
    loading: 'Gutegereza…', no_data: 'Nta makuru', search: 'Shakisha…',
    safe_space: 'Ahantu hahifuje', flag: '🇷🇼', lang_label: 'RW',
    tagline: "Ubufasha bw'Ubuzima bwo mu Mutwe",
    quote: "Buri munyeshuri akwiye kugira ahantu hahifuje ho gukura, gukomera no gutunga.",
  },
}

const LANG_CYCLE = ['fr', 'en', 'rw']

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('mm_theme') || 'light')
  const [lang, setLang] = useState(() => localStorage.getItem('mm_lang') || 'en')

  // Apply dark class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('mm_theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('mm_lang', lang)
    document.documentElement.setAttribute('lang', lang)
  }, [lang])

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')

  const cycleLang = () => {
    setLang(l => {
      const idx = LANG_CYCLE.indexOf(l)
      return LANG_CYCLE[(idx + 1) % LANG_CYCLE.length]
    })
  }

  const t = key => TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS['fr'][key] ?? key

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, lang, cycleLang, t }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}