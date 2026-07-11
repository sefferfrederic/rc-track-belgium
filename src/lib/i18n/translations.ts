export type Locale = "fr" | "nl";

export const translations = {
  // --- Navigation ---
  nav_home: { fr: "Accueil", nl: "Start" },
  nav_agenda: { fr: "Agenda", nl: "Agenda" },
  nav_map: { fr: "Carte", nl: "Kaart" },
  nav_tracks: { fr: "Pistes", nl: "Circuits" },
  nav_events: { fr: "Events", nl: "Events" },
  nav_profile: { fr: "Profil", nl: "Profiel" },
  nav_login: { fr: "Connexion", nl: "Inloggen" },

  // --- Accueil ---
  home_tagline_1: { fr: "Qui roule.", nl: "Wie rijdt." },
  home_tagline_2: { fr: "Où. Quand.", nl: "Waar. Wanneer." },
  home_subtitle: {
    fr: "Indique ta session en 3 clics et retrouve les autres pilotes de ta piste favorite, au lieu de rouler chacun de son côté.",
    nl: "Geef je sessie door in 3 klikken en vind de andere piloten van je favoriete circuit, in plaats van elk apart te rijden.",
  },
  home_new_session: { fr: "Nouvelle session", nl: "Nieuwe sessie" },
  home_login_to_ride: { fr: "Se connecter pour rouler", nl: "Inloggen om te rijden" },
  home_view_map: { fr: "Voir la carte", nl: "Bekijk de kaart" },
  home_today: { fr: "Aujourd'hui", nl: "Vandaag" },
  home_login_prompt: {
    fr: "Connecte-toi pour voir qui roule aujourd'hui et déclarer ta session.",
    nl: "Log in om te zien wie er vandaag rijdt en geef je sessie door.",
  },
  home_loading: { fr: "Chargement…", nl: "Laden…" },
  home_no_sessions: {
    fr: "Personne n'a encore déclaré de session aujourd'hui. Sois le premier !",
    nl: "Nog niemand heeft vandaag een sessie doorgegeven. Wees de eerste!",
  },
  home_favorite_track: { fr: "Ta piste favorite", nl: "Jouw favoriete circuit" },
  home_favorite_none: {
    fr: "Rien de prévu prochainement sur ta piste favorite.",
    nl: "Niets gepland op je favoriete circuit binnenkort.",
  },
  home_riders: { fr: "pilotes", nl: "piloten" },

  // --- Connexion ---
  login_title: { fr: "Connexion", nl: "Inloggen" },
  login_google: { fr: "Continuer avec Google", nl: "Doorgaan met Google" },
  login_or: { fr: "ou", nl: "of" },
  login_email: { fr: "Email", nl: "E-mail" },
  login_password: { fr: "Mot de passe", nl: "Wachtwoord" },
  login_nickname: { fr: "Pseudo ou prénom", nl: "Bijnaam of voornaam" },
  login_signin: { fr: "Se connecter", nl: "Inloggen" },
  login_signup: { fr: "Créer mon compte", nl: "Account aanmaken" },
  login_no_account: { fr: "Pas encore de compte ? Inscris-toi", nl: "Nog geen account? Registreer je" },
  login_has_account: { fr: "Déjà un compte ? Connecte-toi", nl: "Al een account? Log in" },

  // --- Profil ---
  profile_nickname_label: { fr: "Pseudo / Prénom", nl: "Bijnaam / Voornaam" },
  profile_favorite_track: { fr: "Piste favorite", nl: "Favoriete circuit" },
  profile_favorite_hint: {
    fr: "Utilisée pour l'aperçu rapide des prochaines sessions sur l'Accueil.",
    nl: "Gebruikt voor het snelle overzicht van komende sessies op de startpagina.",
  },
  profile_no_favorite: { fr: "Aucune piste favorite", nl: "Geen favoriet circuit" },
  profile_sessions: { fr: "Sessions", nl: "Sessies" },
  profile_role: { fr: "Rôle", nl: "Rol" },
  profile_admin_panel: { fr: "Panneau d'administration", nl: "Beheerpaneel" },
  profile_save: { fr: "Enregistrer", nl: "Opslaan" },
  profile_saving: { fr: "Enregistrement…", nl: "Opslaan…" },
  profile_logout: { fr: "Se déconnecter", nl: "Uitloggen" },

  // --- Agenda ---
  agenda_title: { fr: "Qui roule ce mois-ci ?", nl: "Wie rijdt deze maand?" },
  agenda_track_all: { fr: "Toutes les pistes", nl: "Alle circuits" },
  agenda_track_label: { fr: "Piste", nl: "Circuit" },
  agenda_nothing: { fr: "Rien de prévu ce jour-là.", nl: "Niets gepland op deze dag." },
  agenda_back_today: { fr: "Revenir à aujourd'hui", nl: "Terug naar vandaag" },
  agenda_legend_none: { fr: "Personne", nl: "Niemand" },
  agenda_legend_riding: { fr: "Ça roule (nombre de pilotes)", nl: "Er wordt gereden (aantal piloten)" },
  agenda_legend_event: { fr: "Événement", nl: "Evenement" },

  // --- Carte ---
  map_title: { fr: "Toutes les pistes", nl: "Alle circuits" },
  map_all: { fr: "Toutes", nl: "Alle" },
  map_loading: { fr: "Chargement des pistes…", nl: "Circuits laden…" },
  map_website: { fr: "Voir le site du club →", nl: "Bekijk de clubwebsite →" },
  map_create_here: { fr: "Créer une session ici", nl: "Sessie hier aanmaken" },

  // --- Pistes ---
  tracks_title: { fr: "Pistes", nl: "Circuits" },
  tracks_view_map: { fr: "Voir sur la carte", nl: "Bekijk op kaart" },
  tracks_club_site: { fr: "Site du club", nl: "Clubwebsite" },
  tracks_create_session: { fr: "Créer une session ici", nl: "Sessie hier aanmaken" },

  // --- Événements ---
  events_title: { fr: "Événements", nl: "Evenementen" },
  events_none: { fr: "Aucun événement à venir pour l'instant.", nl: "Momenteel geen aankomende evenementen." },
  events_going: { fr: "Je participe", nl: "Ik doe mee" },
  events_interested: { fr: "Je suis intéressé", nl: "Geïnteresseerd" },
  events_login_prompt: { fr: "Connecte-toi pour participer.", nl: "Log in om deel te nemen." },
  events_more_info: { fr: "Plus d'infos →", nl: "Meer info →" },

  // --- Session (création/rejoindre) ---
  session_new: { fr: "Nouvelle session", nl: "Nieuwe sessie" },
  session_join: { fr: "Je roule aussi", nl: "Ik rijd ook" },
  session_track: { fr: "Piste", nl: "Circuit" },
  session_date: { fr: "Date", nl: "Datum" },
  session_start: { fr: "Début", nl: "Start" },
  session_end: { fr: "Fin", nl: "Einde" },
  session_certainty: { fr: "Taux de certitude", nl: "Zekerheidsgraad" },
  session_discipline: { fr: "Discipline", nl: "Discipline" },
  session_scale: { fr: "Échelle", nl: "Schaal" },
  session_not_specified: { fr: "Non précisé", nl: "Niet gespecifieerd" },
  session_validate: { fr: "Valider ma session", nl: "Sessie bevestigen" },
  session_saving: { fr: "Enregistrement…", nl: "Opslaan…" },
  session_cancel_participation: { fr: "Annuler ma participation", nl: "Deelname annuleren" },
  session_cancelling: { fr: "Annulation…", nl: "Annuleren…" },
  session_peak: { fr: "Pic de fréquentation", nl: "Drukste moment" },
  session_chat: { fr: "Chat", nl: "Chat" },
  session_chat_title: { fr: "Chat de session", nl: "Sessiechat" },
  session_chat_hint: {
    fr: "Visible uniquement par les participants — supprimé 48h après la fin de la session.",
    nl: "Enkel zichtbaar voor deelnemers — verwijderd 48u na het einde van de sessie.",
  },
  session_chat_empty: {
    fr: "Aucun message pour l'instant. Sois le premier à écrire !",
    nl: "Nog geen berichten. Schrijf als eerste!",
  },
  session_chat_placeholder: { fr: "Écris un message…", nl: "Schrijf een bericht…" },

  // --- Divers ---
  close: { fr: "Fermer", nl: "Sluiten" },
} as const;

export type TranslationKey = keyof typeof translations;
