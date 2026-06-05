import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import Script from 'next/script';

// Configuration Firebase de l'utilisateur
const firebaseConfig = {
  apiKey: "AIzaSyBiPI-KyiwR3Nqkl0LPqRfJCaWSAVzfbN8",
  authDomain: "harry-potter-quiz-15176.firebaseapp.com",
  projectId: "harry-potter-quiz-15176",
  storageBucket: "harry-potter-quiz-15176.firebasestorage.app",
  messagingSenderId: "750970719940",
  appId: "1:750970719940:web:f939cdedfae11723380391",
  measurementId: "G-BJ1MGW5WFG"
};

// --------------------------------------------------------------------------
// BASE DE DONNÉES DES QUESTIONS (Tomes 1 à 7)
// --------------------------------------------------------------------------
const QUESTIONS_DB = {
  // ----------------------------------------------------
  // LEVEL 1 : HERMIONE GRANGER (Tomes 1 à 3)
  // ----------------------------------------------------
  1: [
    {
      text: "Dans le tome 1, quelle épreuve logique Hermione résout-elle pour franchir les flammes noires vers la Pierre Philosophale ?",
      options: [
        "L'énigme des sept bouteilles de Rogue",
        "Le filet du diable avec la lumière",
        "La partie d'échecs géante de McGonagall",
        "L'attrape de la clé volante ailée"
      ],
      correct: 0,
      context: "Hermione résout l'énigme logique de Rogue, identifiant la bouteille qui permet de franchir le feu noir et celle qui permet de revenir en arrière."
    },
    {
      text: "Dans le tome 2, quelle potion complexe et interdite Hermione prépare-t-elle en secret dans les toilettes de Mimi Geignarde ?",
      options: [
        "La potion de Polynectar",
        "Le Veritaserum de vérité",
        "L'Amortentia d'amour",
        "La potion Tue-Loup pour loup-garou"
      ],
      correct: 0,
      context: "Hermione prépare le Polynectar pour permettre à Harry et Ron de se transformer en Goyle et Crabbe."
    },
    {
      text: "Dans le tome 1, quel objet Neville Londubat reçoit-il de sa grand-mère, qui se remplit de fumée rouge quand on a oublié quelque chose ?",
      options: [
        "Le Rappeloutout",
        "La Glace à l'Ennemi",
        "La Plume d'Acceptation",
        "Le Pense-Bête"
      ],
      correct: 0,
      context: "Neville reçoit un Rappeloutout. Drago le lui vole, provoquant la première poursuite sur balai de Harry."
    },
    {
      text: "Quel ingrédient rare Hermione vole-t-elle dans les réserves privées de Rogue pour fabriquer le Polynectar dans le tome 2 ?",
      options: [
        "De la peau de serpent d'arbre africain",
        "Des plumes d'Oiseau de Tonnerre",
        "Du venin d'Acromantule",
        "Des cornes de Licorne broyées"
      ],
      correct: 0,
      context: "Hermione vole de la peau de serpent d'arbre africain et des chrysopes pour la potion."
    },
    {
      text: "Dans le tome 3, quel objet magique Hermione utilise-t-elle secrètement pour pouvoir assister à tous ses cours en même temps ?",
      options: [
        "Le Retourneur de Temps",
        "La Carte du Maraudeur",
        "Une Plume à Réaction Rapide",
        "Le miroir à double sens"
      ],
      correct: 0,
      context: "Le Professeur McGonagall obtient une autorisation spéciale du Ministère pour qu'Hermione utilise un Retourneur de Temps."
    },
    {
      text: "Dans le tome 3, quel animal de compagnie de nature très intelligente Hermione achète-t-elle à la Ménagerie Magique ?",
      options: [
        "Le chat Pattenrond",
        "Le crapaud Trevor",
        "Le rat Croûtard",
        "Le boursouf boursoufle"
      ],
      correct: 0,
      context: "Hermione adopte Pattenrond, un chat à moitié Fléreur (Kneazle), qui suspecte immédiatement le rat Croûtard."
    },
    {
      text: "Dans le tome 2, quel elfe de maison tente de 'sauver' Harry en interceptant ses lettres et en lui bloquant l'accès à la voie 9¾ ?",
      options: [
        "Dobby",
        "Kreattur",
        "Winky",
        "Hokey"
      ],
      correct: 0,
      context: "Dobby intercepte les lettres et bloque la barrière de King's Cross pour empêcher Harry d'aller à Poudlard."
    },
    {
      text: "Dans le tome 1, quel âge a l'alchimiste Nicolas Flamel, l'ami de Dumbledore qui a créé la Pierre Philosophale ?",
      options: [
        "665 ans",
        "525 ans",
        "450 ans",
        "712 ans"
      ],
      correct: 0,
      context: "Nicolas Flamel avait 665 ans l'année précédente selon le livre de bibliothèque d'Hermione."
    }
  ],

  // ----------------------------------------------------
  // LEVEL 2 : SEVERUS ROGUE (Tomes 3 à 5)
  // ----------------------------------------------------
  2: [
    {
      text: "Lors du premier cours de potions dans le tome 1, quel ingrédient Rogue décrit-il comme une pierre tirée de l'estomac d'une chèvre permettant de sauver des poisons ?",
      options: [
        "Le bézoard",
        "L'aconit tue-loup",
        "La poudre de racine d'asphodèle",
        "Le dictame liquide"
      ],
      correct: 0,
      context: "Rogue explique qu'un bézoard est une pierre qu'on trouve dans l'estomac des chèvres et qui protège de la plupart des poisons."
    },
    {
      text: "Dans le tome 3, en quoi se transforme l'Épouvantard (Boggart) de Neville Londubat lors du cours du professeur Lupin ?",
      options: [
        "Le Professeur Rogue",
        "Un loup-garou",
        "Une araignée géante",
        "Une momie sanglante"
      ],
      correct: 0,
      context: "L'épouvantard de Neville prend la forme de Rogue. Neville utilise le sortilège 'Riddikulus' pour l'habiller avec les vêtements de sa grand-mère."
    },
    {
      text: "Dans le tome 4, de quel sérum de vérité extrêmement puissant Rogue menace-t-il d'abreuver Harry s'il le soupçonne de vol ?",
      options: [
        "Le Veritaserum",
        "La potion de Polynectar",
        "L'Amortentia",
        "Le Felix Felicis"
      ],
      correct: 0,
      context: "Rogue menace d'en verser quelques gouttes dans le jus de citrouille de Harry pour lui faire confesser ses secrets."
    },
    {
      text: "À la fin du tome 4, que montre Rogue à Cornelius Fudge pour prouver de façon irréfutable que Voldemort est de retour ?",
      options: [
        "La Marque Sombre sur son avant-bras",
        "Le journal intime détruit",
        "Une fiole de sang de Voldemort",
        "La prophétie brisée"
      ],
      correct: 0,
      context: "Rogue retrousse sa manche et montre la Marque Sombre gravée sur sa peau, qui a recommencé à noircir et à brûler."
    },
    {
      text: "Dans le tome 5, quelle discipline magique de défense mentale Dumbledore ordonne-t-il à Rogue d'enseignant à Harry ?",
      options: [
        "L'Occlumancie",
        "La Légilimancie",
        "L'Arithmancie",
        "La Divination"
      ],
      correct: 0,
      context: "Rogue donne des cours particuliers d'Occlumancie à Harry pour fermer son esprit aux intrusions de Voldemort."
    },
    {
      text: "Dans le tome 2, quel sortilège Drago Malefoy lance-t-il sur ordre de Rogue lors du Club de Duel, faisant apparaître un serpent ?",
      options: [
        "Serpensortia",
        "Vipera Evanesca",
        "Tarantallegra",
        "Levicorpus"
      ],
      correct: 0,
      context: "Drago invoque un serpent noir avec Serpensortia, révélant au grand jour les facultés de Fourchelang de Harry."
    },
    {
      text: "Dans le tome 5, quel objet magique Rogue emprunte-t-il à Dumbledore pour y cacher ses souvenirs avant chaque leçon avec Harry ?",
      options: [
        "La Pensine",
        "Le Miroir de poche",
        "Le Pense-Bête",
        "Le coffret de runes"
      ],
      correct: 0,
      context: "Rogue utilise la Pensine pour retirer ses souvenirs personnels les plus intimes et douloureux afin que Harry ne puisse pas les voir."
    },
    {
      text: "Dans le tome 3, quel devoir écrit Rogue impose-t-il aux élèves lorsqu'il remplace Lupin en Défense contre les Forces du Mal ?",
      options: [
        "Une rédaction sur les loups-garous",
        "Un essai sur les Détraqueurs",
        "Une fiche sur les Épouvantards",
        "Un devoir sur les maléfices impardonnables"
      ],
      correct: 0,
      context: "Rogue exige un essai détaillé sur les caractéristiques physiques et psychologiques des loups-garous pour faire démasquer Lupin."
    }
  ],

  // ----------------------------------------------------
  // LEVEL 3 : ALBUS DUMBLEDORE (Tomes 5 à 6)
  // ----------------------------------------------------
  3: [
    {
      text: "Dans le tome 5, comment Dumbledore s'échappe-t-il de son bureau lorsque Fudge et les Aurors tentent de l'arrêter ?",
      options: [
        "En saisissant la queue de son Phénix Fumseck",
        "En transperçant le mur avec un sort",
        "En utilisant de la Poudre de Cheminette",
        "En transplanant directement"
      ],
      correct: 0,
      context: "Dumbledore assomme les Aurors et s'envole en s'accrochant à la queue de Fumseck qui s'enflamme et disparaît."
    },
    {
      text: "Dans le tome 6, quel ancien maître des potions à la retraite Dumbledore convainc-t-il de revenir enseigner avec l'aide de Harry ?",
      options: [
        "Horace Slughorn",
        "Severus Rogue",
        "Gilderoy Lockhart",
        "Alastor Maugrey"
      ],
      correct: 0,
      context: "Dumbledore utilise Harry comme appât pour séduire Horace Slughorn et le convaincre de reprendre son poste à Poudlard."
    },
    {
      text: "Dans le tome 6, quel Horcruxe de Voldemort Dumbledore et Harry recherchent-ils dans la caverne noire au bord de la mer ?",
      options: [
        "Le médaillon de Salazar Serpentard",
        "La coupe de Helga Poufsouffle",
        "Le diadème de Rowena Serdaigle",
        "La bague de Gaunt"
      ],
      correct: 0,
      context: "Ils tentent de récupérer le médaillon de Serpentard, caché dans un bassin d'eau verte au milieu de la caverne remplie d'Inferi."
    },
    {
      text: "Dans le tome 5, quelle organisation clandestine d'élèves Harry fonde-t-il, nommée ironiquement en référence au Directeur ?",
      options: [
        "L'Armée de Dumbledore",
        "L'Ordre du Phénix",
        "Le Club de Duel",
        "La brigade inquisitoriale"
      ],
      correct: 0,
      context: "L'Armée de Dumbledore (A.D.) est créée pour apprendre la Défense contre les Forces du Mal sous l'inquisition d'Ombrage."
    },
    {
      text: "Quel Horcruxe Dumbledore a-t-il détruit lui-même avec l'épée de Gryffondor, lui causant une terrible blessure maudite à la main ?",
      options: [
        "La bague d'Elvis Gaunt",
        "Le journal intime de Jedusor",
        "Le médaillon de Serpentard",
        "La coupe de Poufsouffle"
      ],
      correct: 0,
      context: "Dumbledore a détruit la bague des Gaunt (qui contenait la Pierre de Résurrection), mais le sortilège maudit a condamné sa main droite."
    },
    {
      text: "Dans le tome 6, quel sortilège de mort terrasse définitivement Dumbledore au sommet de la Tour d'Astronomie ?",
      options: [
        "Avada Kedavra",
        "Sectumsempra",
        "Expelliarmus",
        "Endoloris"
      ],
      correct: 0,
      context: "Severus Rogue lance le sortilège de mort 'Avada Kedavra' sur Dumbledore, conformément à un accord secret conclu entre eux."
    },
    {
      text: "Quel objet magique unique Dumbledore lègue-t-il par testament à Ron Weasley dans le tome 7 ?",
      options: [
        "Le Déluminateur",
        "Le Pense-Bête",
        "Le Rappeloutout",
        "La cape d'invisibilité"
      ],
      correct: 0,
      context: "Dumbledore lègue son Déluminateur (ou Éteignoir) à Ron. Cet objet lui permet de retrouver le chemin vers Harry et Hermione."
    },
    {
      text: "Dans le tome 5, quel sortilège ou créature de feu Dumbledore combat-il face à Voldemort dans le grand hall du Ministère ?",
      options: [
        "Un serpent de feu géant",
        "Un phénix de flammes noires",
        "Un Feudeymon incontrôlé",
        "Une tempête de foudre bleue"
      ],
      correct: 0,
      context: "Dumbledore manipule l'eau de la fontaine et combat le serpent de feu invoqué par Voldemort lors de leur duel légendaire."
    }
  ],

  // ----------------------------------------------------
  // LEVEL 4 : LORD VOLDEMORT (Tomes 6 à 7)
  // ----------------------------------------------------
  4: [
    {
      text: "Dans le tome 7, quel Horcruxe de Rowena Serdaigle Voldemort a-t-il caché dans la Salle sur Demande de Poudlard ?",
      options: [
        "Le diadème perdu",
        "Le médaillon runique",
        "La coupe dorée",
        "Le miroir brisé"
      ],
      correct: 0,
      context: "Voldemort a transformé le Diadème perdu de Rowena Serdaigle en Horcruxe, pensant que lui seul connaissait l'existence de la Salle sur Demande."
    },
    {
      text: "Dans le tome 7, quel animal fidèle de Voldemort est également son tout dernier Horcruxe, décapité par Neville Londubat ?",
      options: [
        "Le serpent Nagini",
        "Le phénix Fumseck",
        "L'araignée Aragog",
        "Le basilic de la Chambre"
      ],
      correct: 0,
      context: "Nagini est le serpent de compagnie géant de Voldemort. Neville lui tranche la tête avec l'épée de Gryffondor à la fin de la Bataille."
    },
    {
      text: "Dans le tome 7, quelle Relique de la Mort Voldemort pille-t-il directement dans la tombe d'Albus Dumbledore ?",
      options: [
        "La Baguette de Sureau",
        "La Pierre de Résurrection",
        "La Cape d'Invisibilité",
        "Le Miroir du Riséd"
      ],
      correct: 0,
      context: "Voldemort profane la tombe de Dumbledore pour s'emparer de la Baguette de Sureau (Elder Wand), pensant qu'elle le rendra invincible."
    },
    {
      text: "En comptant la part d'âme logée involontairement en Harry Potter, en combien de fragments d'âme Voldemort s'est-il divisé ?",
      options: [
        "Huit fragments (sept Horcruxes)",
        "Sept fragments (six Horcruxes)",
        "Neuf fragments (huit Horcruxes)",
        "Six fragments (cinq Horcruxes)"
      ],
      correct: 0,
      context: "Voldemort voulait diviser son âme en 7 parties (nombre magique), mais il l'a accidentellement divisée en 8 fragments lorsqu'il a tenté de tuer Harry bébé."
    },
    {
      text: "Dans le tome 6, quel est le nom de la mère de Voldemort, descendante directe de Salazar Serpentard morte dans la misère ?",
      options: [
        "Merope Gaunt",
        "Lily Potter",
        "Hepzibah Smith",
        "Walburga Black"
      ],
      correct: 0,
      context: "Merope Gaunt, fille d'Elvis Gaunt, est la mère de Tom Jedusor. Elle est décédée peu après l'accouchement à l'orphelinat de Londres."
    },
    {
      text: "Quel objet magique de sa propre famille Voldemort a-t-il transformé en premier Horcruxe en assassinant son père Tom Jedusor Sr. ?",
      options: [
        "La bague de son grand-père Elvis Gaunt",
        "Le journal intime d'écolier",
        "Le médaillon de Serpentard",
        "La coupe de Poufsouffle"
      ],
      correct: 0,
      context: "Voldemort utilise le meurtre de son père pour transformer la bague héritée de son grand-père maternel Elvis Gaunt en son premier Horcruxe."
    },
    {
      text: "Pourquoi le sortilège de mort Avada Kedavra lancé par Voldemort contre Harry dans la Grande Salle se retourne-t-il contre lui-même ?",
      options: [
        "Parce que la Baguette de Sureau appartenait en réalité à Harry",
        "Parce que Harry a utilisé un sortilège de bouclier physique",
        "Parce que le serpent Nagini a intercepté le sort",
        "Parce que Dumbledore a dévié le sort depuis l'au-delà"
      ],
      correct: 0,
      context: "Harry était le véritable maître de la Baguette de Sureau (ayant désarmé Drago, qui avait lui-même désarmé Dumbledore). La baguette a refusé de tuer son maître."
    },
    {
      text: "Dans le tome 6, dans quel orphelinat moldu londonien Dumbledore rencontre-t-il Tom Jedusor enfant pour la première fois ?",
      options: [
        "L'orphelinat de Wool",
        "L'orphelinat de Saint-Mungo",
        "L'orphelinat de Cokeworth",
        "L'orphelinat des Orphelins du Rail"
      ],
      correct: 0,
      context: "Dumbledore rend visite à Tom Jedusor à l'orphelinat de Wool (Wool's Orphanage) pour lui annoncer son admission à Poudlard."
    }
  ]
};

// --------------------------------------------------------------------------
// DÉFINITIONS DES ADVERSAIRES
// --------------------------------------------------------------------------
const OPPONENTS = {
  1: {
    name: "Hermione Granger",
    title: "Préfète & Fondatrice de la S.P.E.W.",
    difficulty: "Facile / Moyen",
    maxHP: 100,
    color: "#eeba30",
    spells: ["Silencio !", "Petrificus Totalus !", "Incarcerous !", "Stupefix !"],
    avatarURL: "/assets/hermione.jpg"
  },
  2: {
    name: "Severus Rogue",
    title: "Maître des Potions & Prince de Sang-Mêlé",
    difficulty: "Moyen / Difficile",
    maxHP: 120,
    color: "#2ecc71",
    spells: ["Rictusempra !", "Langue-de-plomb !", "Legilimens !", "Sectumsempra !"],
    avatarURL: "/assets/snape.jpg"
  },
  3: {
    name: "Albus Dumbledore",
    title: "Directeur de Poudlard & Grand Sage",
    difficulty: "Difficile",
    maxHP: 150,
    color: "#00d2ff",
    spells: ["Incendio !", "Ligotage magique !", "Protego Horribilis !", "Expelliarmus suprême !"],
    avatarURL: "/assets/dumbledore.jpg"
  },
  4: {
    name: "Lord Voldemort",
    title: "Le Seigneur des Ténèbres",
    difficulty: "Légendaire",
    maxHP: 200,
    color: "#ff1744",
    spells: ["Feudeymon !", "Endoloris !", "Legilimens !", "Avada Kedavra !"],
    avatarURL: "/assets/voldemort.jpg"
  }
};

const PLAYER_HOUSE_CRESTS = {
  gryffindor: `
    <svg viewBox="0 0 100 100" class="house-icon" style="color: #ae0001; width: 85%; height: 85%; animation: floatGlow 3s ease-in-out infinite;">
        <polygon points="50,10 85,25 85,75 50,90 15,75 15,25" fill="rgba(116,0,1,0.15)" stroke="currentColor" stroke-width="4"/>
        <path d="M35,32 Q50,20 65,32 Q70,50 50,78 Q30,50 35,32 Z" fill="none" stroke="currentColor" stroke-width="2"/>
        <text x="50" y="60" font-family="'Cinzel'" font-size="32" font-weight="bold" text-anchor="middle" fill="#eeba30">G</text>
    </svg>`,
  slytherin: `
    <svg viewBox="0 0 100 100" class="house-icon" style="color: #2a623d; width: 85%; height: 85%; animation: floatGlow 3s ease-in-out infinite;">
        <polygon points="50,10 85,25 85,75 50,90 15,75 15,25" fill="rgba(26,71,42,0.15)" stroke="currentColor" stroke-width="4"/>
        <path d="M35,32 Q50,20 65,32 Q70,50 50,78 Q30,50 35,32 Z" fill="none" stroke="currentColor" stroke-width="2"/>
        <text x="50" y="60" font-family="'Cinzel'" font-size="32" font-weight="bold" text-anchor="middle" fill="#2ecc71">S</text>
    </svg>`,
  ravenclaw: `
    <svg viewBox="0 0 100 100" class="house-icon" style="color: #222f5b; width: 85%; height: 85%; animation: floatGlow 3s ease-in-out infinite;">
        <polygon points="50,10 85,25 85,75 50,90 15,75 15,25" fill="rgba(14,26,64,0.15)" stroke="currentColor" stroke-width="4"/>
        <path d="M35,32 Q50,20 65,32 Q70,50 50,78 Q30,50 35,32 Z" fill="none" stroke="currentColor" stroke-width="2"/>
        <text x="50" y="60" font-family="'Cinzel'" font-size="32" font-weight="bold" text-anchor="middle" fill="#00d2ff">R</text>
    </svg>`,
  hufflepuff: `
    <svg viewBox="0 0 100 100" class="house-icon" style="color: #ecb939; width: 85%; height: 85%; animation: floatGlow 3s ease-in-out infinite;">
        <polygon points="50,10 85,25 85,75 50,90 15,75 15,25" fill="rgba(236,185,57,0.15)" stroke="currentColor" stroke-width="4"/>
        <path d="M35,32 Q50,20 65,32 Q70,50 50,78 Q30,50 35,32 Z" fill="none" stroke="currentColor" stroke-width="2"/>
        <text x="50" y="60" font-family="'Cinzel'" font-size="32" font-weight="bold" text-anchor="middle" fill="#ecb939">P</text>
    </svg>`
};

const PLAYER_HOUSE_SPELLS = {
  gryffindor: ["Rictusempra !", "Expelliarmus !", "Stupefix !", "Expecto Patronum !"],
  slytherin: ["Rictusempra !", "Incarcerous !", "Sectumsempra !", "Expecto Patronum !"],
  ravenclaw: ["Tarantallegra !", "Silencio !", "Stupefix !", "Expecto Patronum !"],
  hufflepuff: ["Rictusempra !", "Petrificus Totalus !", "Stupefix !", "Expecto Patronum !"]
};

export default function HarryPotterQuiz() {
  const [mounted, setMounted] = useState(false);
  const [screen, setScreen] = useState('intro'); // 'intro', 'arena', 'gameover'
  const [playerName, setPlayerName] = useState('');
  const [playerHouse, setPlayerHouse] = useState('');
  const [playerHP, setPlayerHP] = useState(100);
  const [opponentHP, setOpponentHP] = useState(100);
  const [opponentId, setOpponentId] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(15);
  const [viewportTheme, setViewportTheme] = useState('default-theme');
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [canAnswer, setCanAnswer] = useState(false);
  const [options, setOptions] = useState([]);
  
  // États d'effets visuels & audio
  const [consoleText, setConsoleText] = useState("Préparez votre baguette. Le duel va commencer...");
  const [spellBeamClass, setSpellBeamClass] = useState("");
  const [spellBeamColor, setSpellBeamColor] = useState("");
  const [spellFlashClass, setSpellFlashClass] = useState("");
  const [shakePlayer, setShakePlayer] = useState(false);
  const [shakeOpponent, setShakeOpponent] = useState(false);
  const [isVictoryOutcome, setIsVictoryOutcome] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Firebase
  const [db, setDb] = useState(null);
  const [isGlobalMode, setIsGlobalMode] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  const timerIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const canAnswerRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Déclencher le chargement de Firebase si non encore fait
  const handleFirebaseScriptLoad = () => {
    if (typeof window !== 'undefined' && window.firebase) {
      try {
        if (firebaseConfig.apiKey && firebaseConfig.projectId) {
          if (window.firebase.apps.length === 0) {
            window.firebase.initializeApp(firebaseConfig);
          }
          const firestore = window.firebase.firestore();
          setDb(firestore);
          setIsGlobalMode(true);
          console.log("Firebase connecté au site Road Sixty Geek !");
        }
      } catch (e) {
        console.error("Erreur d'initialisation silencieuse Firebase :", e);
      }
    }
  };

  // Jouer des sons de manière compatible et robuste avec fallback
  const playSound = (isCorrect) => {
    try {
      const audioPath = isCorrect ? '/assets/correct.mp3' : '/assets/wrong.mp3';
      const audio = new Audio(audioPath);
      audio.volume = 0.45;
      audio.play().catch(err => {
        console.log("Lecture audio bloquée/manquée :", err);
      });
    } catch (e) {
      console.log("Audio non disponible :", e);
    }
  };

  // Gestion du clavier pour raccourcis 1, 2, 3, 4
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (screen !== 'arena' || !canAnswer) return;
      if (["1", "2", "3", "4"].includes(e.key)) {
        const idx = parseInt(e.key) - 1;
        submitAnswer(idx);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, canAnswer, options]);

  // Formulaire d'introduction valide
  const isFormValid = playerName.trim().length >= 2 && playerHouse !== "";

  // Démarrer l'aventure
  const startGame = () => {
    if (!isFormValid) return;
    setScore(0);
    setStreak(0);
    setQuestionsAnswered(0);
    setCorrectAnswers(0);
    setPlayerHP(100);
    setOpponentId(1);
    
    // Injecter la classe de thème de maison sur le conteneur du quiz
    setViewportTheme(`${playerHouse}-theme`);
    
    setScreen('arena');
    canAnswerRef.current = false;
    initDuel(1);
  };

  // Initialisation d'un duel
  const initDuel = (nextOpponentId) => {
    const opp = OPPONENTS[nextOpponentId];
    setOpponentId(nextOpponentId);
    setOpponentHP(opp.maxHP);
    setQuestionIndex(0);
    setStreak(0);
    setConsoleText(`${opp.name} s'avance au centre du podium de duel. Saluez votre adversaire...`);

    setTimeout(() => {
      loadQuestion(nextOpponentId, 0);
    }, 2200);
  };

  // Charger une question
  const loadQuestion = (oppId, qIdx) => {
    const questionsList = QUESTIONS_DB[oppId];
    if (!questionsList) return;

    // Récupérer l'historique des questions déjà répondues pour ce joueur
    const storageKey = `hp_answered_${playerName.trim().toLowerCase()}`;
    let answeredList = [];
    try {
      answeredList = JSON.parse(localStorage.getItem(storageKey)) || [];
    } catch (e) {
      console.log("Erreur lecture localStorage :", e);
    }

    // Filtrer les questions non répondues pour cet adversaire
    let availableQuestions = questionsList.filter(q => !answeredList.includes(q.text));

    // Si toutes les questions ont été posées, on réinitialise l'historique pour cet adversaire
    if (availableQuestions.length === 0) {
      const opponentQuestionTexts = questionsList.map(q => q.text);
      answeredList = answeredList.filter(text => !opponentQuestionTexts.includes(text));
      try {
        localStorage.setItem(storageKey, JSON.stringify(answeredList));
      } catch (e) {
        console.log("Erreur écriture localStorage :", e);
      }
      availableQuestions = [...questionsList];
    }

    // Choisir une question au hasard parmi celles disponibles
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const q = availableQuestions[randomIndex];

    // Mettre à jour l'historique avec cette nouvelle question
    answeredList.push(q.text);
    try {
      localStorage.setItem(storageKey, JSON.stringify(answeredList));
    } catch (e) {
      console.log("Erreur écriture localStorage :", e);
    }

    setCurrentQuestion(q);
    setQuestionIndex(qIdx % questionsList.length);

    // Mélanger les options tout en gardant l'index original
    const optionsWithIndices = q.options.map((opt, i) => ({ text: opt, originalIndex: i }));
    optionsWithIndices.sort(() => Math.random() - 0.5);
    setOptions(optionsWithIndices);

    canAnswerRef.current = true;
    setCanAnswer(true);
    setTimeRemaining(15);

    // Démarrer le compte à rebours
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Quand le temps imparti est écoulé
  const handleTimeout = () => {
    if (!canAnswerRef.current) return;
    canAnswerRef.current = false;
    setCanAnswer(false);
    setQuestionsAnswered(prev => prev + 1);
    setStreak(0);
    playSound(false);

    const opp = OPPONENTS[opponentId];
    const spellIndex = Math.floor(Math.random() * opp.spells.length);
    const opponentSpell = opp.spells[spellIndex];
    const damage = 15 + (opponentId * 5);

    const nextPlHP = Math.max(0, playerHP - damage);
    setPlayerHP(nextPlHP);
    setConsoleText(`Le temps est écoulé ! ${opp.name} en profite pour lancer ${opponentSpell} et vous inflige ${damage} dégâts !`);

    // Animation flash et secousse
    setSpellFlashClass("active-wrong");
    setSpellBeamColor("#ff1744");
    setSpellBeamClass("wrong-cast");
    setShakePlayer(true);

    setTimeout(() => {
      setSpellFlashClass("");
      setSpellBeamClass("");
      setShakePlayer(false);
      
      if (nextPlHP <= 0) {
        setTimeout(() => endGame(false), 1500);
      } else {
        loadQuestion(opponentId, questionIndex + 1);
      }
    }, 2500);
  };

  // Soumettre une réponse
  const submitAnswer = (selectedBtnIndex) => {
    if (!canAnswerRef.current) return;
    canAnswerRef.current = false;
    setCanAnswer(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    setQuestionsAnswered(prev => prev + 1);
    const clickedOption = options[selectedBtnIndex];
    const isCorrect = clickedOption.originalIndex === currentQuestion.correct;

    let nextPlHP = playerHP;
    let nextOppHP = opponentHP;

    if (isCorrect) {
      nextOppHP = handleCorrectAnswer();
    } else {
      nextPlHP = handleIncorrectAnswer();
    }

    setTimeout(() => {
      setSpellFlashClass("");
      setSpellBeamClass("");
      setShakePlayer(false);
      setShakeOpponent(false);

      if (nextPlHP <= 0) {
        endGame(false);
      } else if (nextOppHP <= 0) {
        handleOpponentDefeated();
      } else {
        loadQuestion(opponentId, questionIndex + 1);
      }
    }, 2500);
  };

  const handleCorrectAnswer = () => {
    setCorrectAnswers(prev => prev + 1);
    playSound(true);

    const playerSpells = PLAYER_HOUSE_SPELLS[playerHouse];
    let spellName = playerSpells[Math.min(streak, playerSpells.length - 2)];
    
    const isPatronus = streak >= 3;
    if (isPatronus) {
      spellName = playerSpells[playerSpells.length - 1]; // Expecto Patronum !
    }

    const speedRatio = timeRemaining / 15;
    let baseDamage = Math.round(15 + (speedRatio * 15));
    
    const mult = 1 + (streak * 0.2);
    let finalDamage = Math.round(baseDamage * mult);

    if (isPatronus) {
      finalDamage = Math.round(finalDamage * 1.8);
    }

    const nextOppHP = Math.max(0, opponentHP - finalDamage);
    setOpponentHP(nextOppHP);

    const pointsGained = Math.round(100 * mult * (timeRemaining + 1));
    setScore(prev => prev + pointsGained);
    setStreak(prev => prev + 1);

    const oppName = OPPONENTS[opponentId].name;
    if (isPatronus) {
      setConsoleText(`🌟 INCROYABLE ! Vous invoquez un ${spellName} et infligez ${finalDamage} dégâts à ${oppName} !`);
    } else {
      setConsoleText(`⚡ Vous lancez ${spellName} et infligez ${finalDamage} dégâts à ${oppName}.`);
    }

    setSpellFlashClass("active-correct");
    setSpellBeamColor(isPatronus ? "#00e5ff" : "var(--theme-accent)");
    setSpellBeamClass("correct-cast");
    setShakeOpponent(true);

    return nextOppHP;
  };

  const handleIncorrectAnswer = () => {
    setStreak(0);
    playSound(false);

    const opp = OPPONENTS[opponentId];
    const spellIndex = Math.floor(Math.random() * opp.spells.length);
    const opponentSpell = opp.spells[spellIndex];
    const damage = 15 + (opponentId * 5);

    const nextPlHP = Math.max(0, playerHP - damage);
    setPlayerHP(nextPlHP);
    setConsoleText(`❌ Erreur ! ${opp.name} contre-attaque avec ${opponentSpell} et vous inflige ${damage} dégâts !`);

    setSpellFlashClass("active-wrong");
    setSpellBeamColor("#ff1744");
    setSpellBeamClass("wrong-cast");
    setShakePlayer(true);

    return nextPlHP;
  };

  // Victoire sur un adversaire
  const handleOpponentDefeated = () => {
    const oppName = OPPONENTS[opponentId].name;
    setConsoleText(`🏆 Victoire ! ${oppName} s'avoue vaincu(e) !`);
    
    // Regain de vie après victoire
    setPlayerHP(prev => Math.min(100, prev + 25));

    setTimeout(() => {
      if (opponentId < 4) {
        const nextId = opponentId + 1;
        setConsoleText(`Préparation pour le prochain duel contre ${OPPONENTS[nextId].name}...`);
        setTimeout(() => {
          initDuel(nextId);
        }, 2000);
      } else {
        endGame(true);
      }
    }, 2000);
  };

  // Fin de partie générale
  const endGame = (victory) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setIsVictoryOutcome(victory);
    setScreen('gameover');

    // Sauvegarde & Chargement des scores
    saveScoreToStorage(playerName, playerHouse, score);
    loadLeaderboardData(playerName, playerHouse, score);
  };

  // Sauvegarde dans le localStorage (résilience locale)
  const saveScoreToStorage = (name, house, finalScore) => {
    if (!name) return;
    let localBoard = JSON.parse(localStorage.getItem("hp_duel_leaderboard")) || [];
    localBoard.push({
      name: name,
      house: house,
      score: finalScore,
      date: new Date().toLocaleDateString()
    });
    localBoard.sort((a, b) => b.score - a.score);
    localBoard = localBoard.slice(0, 6);
    localStorage.setItem("hp_duel_leaderboard", JSON.stringify(localBoard));
  };

  // Charger le tableau d'honneur (local en premier, puis cloud si connecté)
  const loadLeaderboardData = (currentName, currentHouse, currentScore) => {
    // Top 6 local de secours
    let localBoard = JSON.parse(localStorage.getItem("hp_duel_leaderboard")) || [];
    if (localBoard.length === 0) {
      localBoard = [
        { name: "Albus Dumbledore", house: "gryffindor", score: 9500, date: "31/05/2026" },
        { name: "Hermione Granger", house: "gryffindor", score: 8200, date: "31/05/2026" },
        { name: "Severus Rogue", house: "slytherin", score: 7800, date: "31/05/2026" },
        { name: "Luna Lovegood", house: "ravenclaw", score: 6500, date: "31/05/2026" },
        { name: "Cedric Diggory", house: "hufflepuff", score: 5800, date: "31/05/2026" }
      ];
      localStorage.setItem("hp_duel_leaderboard", JSON.stringify(localBoard));
    }
    setLeaderboard(localBoard);

    // Envoi du score à Firestore
    if (isGlobalMode && db) {
      db.collection("leaderboard").add({
        name: currentName,
        house: currentHouse,
        score: currentScore,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      })
      .then(() => {
        console.log("Score synchronisé sur Firestore !");
        // Recharger le classement global de la communauté
        return db.collection("leaderboard")
          .orderBy("score", "desc")
          .limit(6)
          .get();
      })
      .then(snapshot => {
        if (snapshot && !snapshot.empty) {
          const globalData = [];
          snapshot.forEach(doc => {
            globalData.push(doc.data());
          });
          setLeaderboard(globalData);
        }
      })
      .catch(err => {
        console.error("Erreur de synchronisation Firestore, affichage local :", err);
      });
    }
  };

  const restartGame = () => {
    setScreen('intro');
    setPlayerHouse('');
    setPlayerName('');
    setViewportTheme('default-theme');
  };

  const copyShareText = () => {
    const text = `⚡ J'ai obtenu le score de ${score} points dans "Le Duel des Sorciers" sur Road Sixty Geek ! Prêt à me défier ? Relevez le défi ici : https://roadsixtygeek.com/activation`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      });
    } else {
      alert(text);
    }
  };

  // Rendu de l'écusson de maison dans l'arène
  const renderPlayerCrest = () => {
    if (!playerHouse) return null;
    return <div dangerouslySetInnerHTML={{ __html: PLAYER_HOUSE_CRESTS[playerHouse] }} style={{ width: '100%', height: '100%' }} />;
  };

  // Pct pour le cercle de temps restant
  const pct = timeRemaining / 15;
  const offsetValue = 201.0 - (pct * 201.0);

  return (
    <>
      <Head>
        <title>Relève le Challenge Harry Potter | Road Sixty Geek</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="description" content="Affrontez les sorciers légendaires de Poudlard dans ce grand duel de connaissances couvrant l'intégralité des 7 livres de la saga !" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Outfit:wght@300;400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/harry-potter.css" />
        
        {/* Métadonnées de Partage Social (Open Graph & Twitter Card) pour la viralité */}
        <meta property="og:title" content="Relève le Grand Concours Harry Potter | Road Sixty Geek" />
        <meta property="og:description" content="Affrontez les sorciers légendaires de Poudlard dans ce grand duel de connaissances sur les 7 livres ! Serez-vous à la hauteur ?" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://roadsixtygeek.com/activation" />
        <meta property="og:image" content="https://images.unsplash.com/photo-1598153346810-860daa814c4b?q=80&w=1200&auto=format&fit=crop" />
        <meta property="og:site_name" content="Road Sixty Geek" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Relève le Grand Concours Harry Potter | Road Sixty Geek" />
        <meta name="twitter:description" content="Affrontez les sorciers légendaires de Poudlard dans ce grand duel de connaissances sur les 7 livres ! Serez-vous à la hauteur ?" />
        <meta name="twitter:image" content="https://images.unsplash.com/photo-1598153346810-860daa814c4b?q=80&w=1200&auto=format&fit=crop" />
      </Head>

      <Script 
        src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"
        strategy="afterInteractive"
        onLoad={handleFirebaseScriptLoad}
      />
      <Script 
        src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"
        strategy="afterInteractive"
        onLoad={handleFirebaseScriptLoad}
      />

      {!mounted ? (
        <div style={{ background: '#05020a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#ea80fc', fontFamily: "'Cinzel', serif", fontSize: '1.2rem', letterSpacing: '2px', textAlign: 'center' }}>
            CHARGEMENT DU DUEL...
          </div>
        </div>
      ) : (
        <div className={`hp-quiz-viewport ${viewportTheme}`}>
          
          {/* Overlay d'effet d'éclair magique */}
        <div id="spell-flash-overlay" className={`spell-flash-overlay ${spellFlashClass}`} />

        <div className="stars-container">
          <div className="stars" />
        </div>

        <div className="app-container">
          
          {/* ÉCRAN 1 : INTRO & CHOIX DE MAISON */}
          {screen === 'intro' && (
            <section id="screen-intro" className="screen active">
              <header className="game-header">
                <div className="logo-area">
                  <svg className="hogwarts-crest" viewBox="0 0 100 100" width="70" height="70">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="1 3"/>
                    <path d="M50 15 L80 35 L80 75 L50 85 L20 75 L20 35 Z" fill="none" stroke="currentColor" stroke-width="2"/>
                    <path d="M50 15 L50 85" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2"/>
                    <path d="M20 53 L80 53" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2"/>
                    <text x="32" y="42" fontFamily="'Cinzel'" fontSize="16" fill="currentColor" fontWeight="bold">G</text>
                    <text x="60" y="42" fontFamily="'Cinzel'" fontSize="16" fill="currentColor" fontWeight="bold">S</text>
                    <text x="32" y="70" fontFamily="'Cinzel'" fontSize="16" fill="currentColor" fontWeight="bold">R</text>
                    <text x="60" y="70" fontFamily="'Cinzel'" fontSize="16" fill="currentColor" fontWeight="bold">P</text>
                  </svg>
                  <h1>Le Duel des Sorciers</h1>
                  <p className="subtitle">Relève le challenge Harry Potter — Grand Concours (Tomes 1 à 7)</p>
                </div>
              </header>

              <div className="setup-container card-glass">
                <h2>Réglez vos paramètres de duelliste</h2>

                {/* Introduction & Texte du Grand Concours */}
                <div className="contest-intro-box" style={{ 
                  background: 'rgba(234, 179, 8, 0.04)', 
                  border: '1px solid rgba(234, 179, 8, 0.15)', 
                  padding: '12px 16px', 
                  borderRadius: '10px', 
                  fontSize: '0.82rem', 
                  color: 'var(--color-text)', 
                  lineHeight: '1.45', 
                  marginBottom: '10px',
                  textAlign: 'left'
                }}>
                  <h3 style={{ 
                    fontFamily: "'Cinzel', serif", 
                    color: 'var(--theme-accent)', 
                    fontSize: '0.92rem', 
                    fontWeight: 'bold', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    marginBottom: '6px' 
                  }}>
                    🏆 GRAND CONCOURS DES SORCIERS
                  </h3>
                  <p style={{ margin: '0 0 6px 0' }}>
                    Préparez votre baguette magique pour le défi ultime ! Affrontez 4 adversaires légendaires de Poudlard dans un duel de questions sans pitié couvrant <strong>les 7 tomes originaux de la saga Harry Potter</strong>.
                  </p>
                  <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
                    🔥 Renseignez votre nom de sorcier et votre Maison pour participer. Votre score final sera sauvegardé en direct dans notre base de données mondiale et comparé avec le classement des autres sorciers !
                  </p>
                </div>
                <div className="input-group">
                  <label htmlFor="player-name">Nom du Sorcier / Sorcière</label>
                  <input 
                    type="text" 
                    id="player-name" 
                    placeholder="Entrez votre nom..." 
                    maxLength={15} 
                    autoComplete="off"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                  />
                </div>

                <h3>Choisissez votre Maison de Poudlard</h3>
                <div className="houses-grid">
                  {/* Gryffondor */}
                  <div className={`house-card gryffindor ${playerHouse === 'gryffindor' ? 'selected' : ''}`} onClick={() => setPlayerHouse('gryffindor')}>
                    <div className="house-bg-effect"></div>
                    <div className="house-crest-container">
                      <svg viewBox="0 0 100 100" className="house-icon-svg">
                        <polygon points="50,10 85,25 85,75 50,90 15,75 15,25" fill="none" stroke="currentColor" stroke-width="3"/>
                        <path d="M35,32 Q50,20 65,32 Q70,50 50,78 Q30,50 35,32 Z" fill="rgba(116,0,1,0.2)" stroke="currentColor" stroke-width="1.5"/>
                        <text x="50" y="58" fontFamily="'Cinzel'" fontSize="28" fontWeight="bold" textAnchor="middle" fill="currentColor">G</text>
                      </svg>
                    </div>
                    <h4>Gryffondor</h4>
                  </div>

                  {/* Serpentard */}
                  <div className={`house-card slytherin ${playerHouse === 'slytherin' ? 'selected' : ''}`} onClick={() => setPlayerHouse('slytherin')}>
                    <div className="house-bg-effect"></div>
                    <div className="house-crest-container">
                      <svg viewBox="0 0 100 100" className="house-icon-svg">
                        <polygon points="50,10 85,25 85,75 50,90 15,75 15,25" fill="none" stroke="currentColor" stroke-width="3"/>
                        <path d="M35,32 Q50,20 65,32 Q70,50 50,78 Q30,50 35,32 Z" fill="rgba(26,71,42,0.2)" stroke="currentColor" stroke-width="1.5"/>
                        <text x="50" y="58" fontFamily="'Cinzel'" fontSize="28" fontWeight="bold" textAnchor="middle" fill="currentColor">S</text>
                      </svg>
                    </div>
                    <h4>Serpentard</h4>
                  </div>

                  {/* Serdaigle */}
                  <div className={`house-card ravenclaw ${playerHouse === 'ravenclaw' ? 'selected' : ''}`} onClick={() => setPlayerHouse('ravenclaw')}>
                    <div className="house-bg-effect"></div>
                    <div className="house-crest-container">
                      <svg viewBox="0 0 100 100" className="house-icon-svg">
                        <polygon points="50,10 85,25 85,75 50,90 15,75 15,25" fill="none" stroke="currentColor" stroke-width="3"/>
                        <path d="M35,32 Q50,20 65,32 Q70,50 50,78 Q30,50 35,32 Z" fill="rgba(14,26,64,0.2)" stroke="currentColor" stroke-width="1.5"/>
                        <text x="50" y="58" fontFamily="'Cinzel'" fontSize="28" fontWeight="bold" textAnchor="middle" fill="currentColor">R</text>
                      </svg>
                    </div>
                    <h4>Serdaigle</h4>
                  </div>

                  {/* Poufsouffle */}
                  <div className={`house-card hufflepuff ${playerHouse === 'hufflepuff' ? 'selected' : ''}`} onClick={() => setPlayerHouse('hufflepuff')}>
                    <div className="house-bg-effect"></div>
                    <div className="house-crest-container">
                      <svg viewBox="0 0 100 100" className="house-icon-svg">
                        <polygon points="50,10 85,25 85,75 50,90 15,75 15,25" fill="none" stroke="currentColor" stroke-width="3"/>
                        <path d="M35,32 Q50,20 65,32 Q70,50 50,78 Q30,50 35,32 Z" fill="rgba(236,185,57,0.25)" stroke="currentColor" stroke-width="1.5"/>
                        <text x="50" y="58" fontFamily="'Cinzel'" fontSize="28" fontWeight="bold" textAnchor="middle" fill="currentColor">P</text>
                      </svg>
                    </div>
                    <h4>Poufsouffle</h4>
                  </div>
                </div>

                <button 
                  id="btn-start" 
                  className={`btn-glow btn-primary ${isFormValid ? '' : 'disabled'}`} 
                  onClick={startGame}
                  disabled={!isFormValid}
                  style={{ marginBottom: '10px' }}
                >
                  Pénétrer dans l'Arène
                </button>

                {/* Partage Social Avant de Jouer */}
                <div className="share-preplay-container" style={{ 
                  marginTop: '15px', 
                  borderTop: '1px solid var(--border-glass)', 
                  paddingTop: '12px', 
                  textAlign: 'center' 
                }}>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    textTransform: 'uppercase', 
                    color: 'var(--color-text-muted)', 
                    display: 'block', 
                    marginBottom: '8px', 
                    letterSpacing: '0.5px' 
                  }}>
                    📢 Partagez le défi de Poudlard !
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <a 
                      href="https://www.facebook.com/sharer/sharer.php?u=https://roadsixtygeek.com/activation" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        background: '#1877f2', 
                        color: '#fff', 
                        padding: '6px 12px', 
                        borderRadius: '6px', 
                        fontSize: '0.72rem', 
                        textDecoration: 'none', 
                        fontWeight: 'bold', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '5px' 
                      }}
                    >
                      🔵 Facebook
                    </a>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText("https://roadsixtygeek.com/activation");
                        alert("Lien du concours copié ! Collez-le dans votre bio ou story Instagram !");
                      }}
                      style={{ 
                        background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', 
                        color: '#fff', 
                        border: 'none', 
                        padding: '6px 12px', 
                        borderRadius: '6px', 
                        fontSize: '0.72rem', 
                        cursor: 'pointer', 
                        fontWeight: 'bold', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '5px' 
                      }}
                    >
                      📸 Instagram
                    </button>
                    <a 
                      href="https://twitter.com/intent/tweet?text=Rejoins%20le%20Grand%20Concours%20des%20Sorciers%20Harry%20Potter%20sur%20Road%20Sixty%20Geek%20!%20&url=https://roadsixtygeek.com/activation" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        background: '#000', 
                        color: '#fff', 
                        padding: '6px 12px', 
                        borderRadius: '6px', 
                        fontSize: '0.72rem', 
                        textDecoration: 'none', 
                        fontWeight: 'bold', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '5px', 
                        border: '1px solid #333' 
                      }}
                    >
                      𝕏 Twitter
                    </a>
                    <a 
                      href="https://api.whatsapp.com/send?text=Rejoins%20le%20Grand%20Concours%20des%20Sorciers%20Harry%20Potter%20sur%20Road%20Sixty%20Geek%20!%20https://roadsixtygeek.com/activation" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        background: '#25d366', 
                        color: '#fff', 
                        padding: '6px 12px', 
                        borderRadius: '6px', 
                        fontSize: '0.72rem', 
                        textDecoration: 'none', 
                        fontWeight: 'bold', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '5px' 
                      }}
                    >
                      🟢 WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ÉCRAN 2 : ARÈNE DE DUEL */}
          {screen === 'arena' && (
            <section id="screen-arena" className="screen active arena-layout-container">
              
              {/* Header */}
              <div className="arena-header card-glass">
                <div className="level-indicator">
                  <span>Duel magique</span>
                  <h3 id="current-opponent-title">{OPPONENTS[opponentId]?.name}</h3>
                </div>
                <div className="global-score">
                  <span>Score</span>
                  <strong id="arena-score">{String(score).padStart(4, '0')}</strong>
                </div>
              </div>

              {/* Zone Duel */}
              <div className="duel-layout">
                {/* Joueur */}
                <div className={`fighter-panel player ${shakePlayer ? 'shake-element' : ''}`} id="player-panel">
                  <div className="avatar-frame">
                    <div className="avatar-placeholder" id="player-avatar-crest-container">
                      {renderPlayerCrest()}
                    </div>
                  </div>
                  <div className="fighter-info">
                    <h4 id="player-display-name">{playerName}</h4>
                    <span className="house-tag" id="player-house-tag">
                      Maison {playerHouse.charAt(0).toUpperCase() + playerHouse.slice(1)}
                    </span>
                    <div className="health-container">
                      <div className="health-bar-bg">
                        <div 
                          className={`health-bar-fill ${playerHP <= 30 ? 'critical' : ''}`} 
                          id="player-hp-bar" 
                          style={{ width: `${playerHP}%` }} 
                        />
                      </div>
                      <span className="hp-text" id="player-hp-text">{playerHP} / 100 HP</span>
                    </div>
                  </div>
                </div>

                {/* Centre (Timer et Clash) */}
                <div className="clash-center">
                  <div className="timer-container" id="timer-box">
                    <svg className="timer-ring" width="80" height="80">
                      <circle className="timer-ring-circle-bg" stroke="rgba(255,255,255,0.1)" strokeWidth="5" fill="transparent" r="32" cx="40" cy="40"/>
                      <circle 
                        id="timer-progress" 
                        className="timer-ring-circle" 
                        stroke={timeRemaining <= 4 ? "var(--color-error)" : "var(--house-accent, #6a1b9a)"} 
                        strokeWidth="5" 
                        fill="transparent" 
                        r="32" 
                        cx="40" 
                        cy="40"
                        style={{ strokeDashoffset: offsetValue }}
                      />
                    </svg>
                    <div className="timer-text" id="timer-count" style={{ color: timeRemaining <= 4 ? "var(--color-error)" : "#fff" }}>{timeRemaining}</div>
                  </div>
                  
                  <div className="spell-beam-container">
                    <div 
                      id="spell-beam" 
                      className={`spell-beam ${spellBeamClass}`} 
                      style={{ '--beam-color': spellBeamColor }} 
                    />
                  </div>
                  
                  <div className="streak-indicator" id="streak-box">
                    <div className="streak-stars">
                      <span className={`star ${streak >= 1 ? 'active' : ''}`}>★</span>
                      <span className={`star ${streak >= 2 ? 'active' : ''}`}>★</span>
                      <span className={`star ${streak >= 3 ? 'active' : ''}`}>★</span>
                    </div>
                    <div className={`streak-text ${streak >= 3 ? 'active' : ''}`} id="streak-message">Patronus prêt !</div>
                  </div>
                </div>

                {/* Adversaire */}
                <div 
                  className={`fighter-panel opponent ${shakeOpponent ? 'shake-element' : ''}`} 
                  id="opponent-panel"
                  style={{ borderRight: `4px solid ${OPPONENTS[opponentId]?.color}` }}
                >
                  <div className="avatar-frame" style={{ background: `linear-gradient(135deg, ${OPPONENTS[opponentId]?.color} 0%, #ffffff 100%)` }}>
                    <div className="avatar-placeholder">
                      <img id="opponent-avatar-img" src={OPPONENTS[opponentId]?.avatarURL} className="character-portrait" alt="Adversaire" />
                    </div>
                  </div>
                  <div className="fighter-info">
                    <h4 id="opponent-display-name">{OPPONENTS[opponentId]?.name}</h4>
                    <span className="difficulty-tag" id="opponent-diff-tag" style={{ color: OPPONENTS[opponentId]?.color }}>
                      {OPPONENTS[opponentId]?.title}
                    </span>
                    <div className="health-container">
                      <div className="health-bar-bg">
                        <div 
                          className={`health-bar-fill opponent-hp ${opponentHP <= 30 ? 'critical' : ''}`} 
                          id="opponent-hp-bar" 
                          style={{ width: `${(opponentHP / OPPONENTS[opponentId]?.maxHP) * 100}%` }} 
                        />
                      </div>
                      <span className="hp-text" id="opponent-hp-text">{opponentHP} / {OPPONENTS[opponentId]?.maxHP} HP</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Console de dialogue */}
              <div className="magic-console card-glass" id="magic-console">
                <p id="console-text">{consoleText}</p>
              </div>

              {/* Question & Options */}
              <div className="question-board card-glass">
                <div className="question-header">
                  <span className="question-tracker" id="question-index">
                    Sortilège {questionIndex + 1} / {QUESTIONS_DB[opponentId]?.length}
                  </span>
                  <span className="multiplier-badge" id="multiplier-badge">
                    Combo: x{(1 + (streak * 0.2)).toFixed(1)}
                  </span>
                </div>
                <div className="question-text-box">
                  <div className="question-text" id="question-text">
                    {currentQuestion?.text}
                  </div>
                </div>
                <div className="options-grid" id="options-grid">
                  {options.map((opt, idx) => (
                    <button 
                      key={idx} 
                      className="option-btn" 
                      onClick={() => submitAnswer(idx)}
                      disabled={!canAnswer}
                    >
                      <span className="shortcut">{idx + 1}</span>
                      <span className="text">{opt.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ÉCRAN 3 : VICTOIRE / DÉFAITE */}
          {screen === 'gameover' && (
            <section id="screen-gameover" className="screen active">
              <div className="gameover-container card-glass">
                <div className="outcome-icon" id="outcome-crest-placeholder">
                  {isVictoryOutcome ? (
                    <svg viewBox="0 0 100 100" className="svg-pulse" style={{ width: '100px', height: '100px', color: 'var(--theme-accent)' }}>
                      <polygon points="50,10 85,25 85,75 50,90 15,75 15,25" fill="none" stroke="currentColor" strokeWidth="4"/>
                      <text x="50" y="60" fontFamily="'Cinzel'" fontSize="32" textAnchor="middle" fill="currentColor" fontWeight="bold">M</text>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 100 100" style={{ width: '100px', height: '100px', color: 'var(--color-error)' }}>
                      <path d="M35,40 C35,20 65,20 65,40 C65,55 58,60 55,65 L55,75 L45,75 L45,65 C42,60 35,55 35,40 Z" fill="none" stroke="currentColor" strokeWidth="3"/>
                      <circle cx="43" cy="40" r="4" fill="currentColor"/>
                      <circle cx="57" cy="40" r="4" fill="currentColor"/>
                      <line x1="47" y1="48" x2="53" y2="48" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  )}
                </div>
                
                <h2 id="outcome-title" style={{ color: isVictoryOutcome ? 'var(--color-success)' : 'var(--color-error)' }}>
                  {isVictoryOutcome ? "Victoire Suprême !" : "Défaite Magique"}
                </h2>
                <p id="outcome-desc" className="outcome-text">
                  {isVictoryOutcome 
                    ? "Incroyable ! Vous avez terrassé Lord Voldemort et prouvé votre savoir sur tous les tomes d'Harry Potter !" 
                    : `Votre bouclier a cédé face à ${OPPONENTS[opponentId]?.name}. Replongez-vous dans les livres de la saga !`
                  }
                </p>

                <div className="stats-summary">
                  <div className="stat-card">
                    <span className="label">Score Final</span>
                    <strong id="final-score">{score}</strong>
                  </div>
                  <div className="stat-card">
                    <span className="label">Duels Gagnés</span>
                    <strong id="stats-duels">{isVictoryOutcome ? 4 : opponentId - 1} / 4</strong>
                  </div>
                  <div className="stat-card">
                    <span className="label">Précision</span>
                    <strong id="stats-accuracy">
                      {questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 100) : 0}%
                    </strong>
                  </div>
                </div>

                {/* Classement */}
                <div className="leaderboard-section">
                  <div className="leaderboard-header-row">
                    <h3>Tableau d'Honneur des Duellistes</h3>
                    <span id="db-status-badge" className={`db-status-badge ${isGlobalMode ? 'global' : 'local'}`}>
                      {isGlobalMode ? "Mode Global" : "Mode Local"}
                    </span>
                  </div>
                  <div className="table-container">
                    <table id="leaderboard-table">
                      <thead>
                        <tr>
                          <th>Rang</th>
                          <th>Nom</th>
                          <th>Maison</th>
                          <th>Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((entry, idx) => {
                          const houseColors = {
                            gryffindor: "#ae0001",
                            slytherin: "#2a623d",
                            ravenclaw: "#222f5b",
                            hufflepuff: "#ecb939"
                          };
                          const houseDisplayName = entry.house ? entry.house.charAt(0).toUpperCase() + entry.house.slice(1) : "-";
                          const dotColor = houseColors[entry.house] || "#757575";

                          return (
                            <tr key={idx}>
                              <td><strong>#{idx + 1}</strong></td>
                              <td>{entry.name}</td>
                              <td>
                                <span className="house-circle" style={{ backgroundColor: dotColor }} />
                                {houseDisplayName}
                              </td>
                              <td><strong>{entry.score} pts</strong></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="actions-area" style={{ marginBottom: '15px' }}>
                  <button id="btn-restart" className="btn-glow btn-primary" onClick={restartGame}>Retenter l'Aventure</button>
                  <button id="btn-share" className="btn-secondary" onClick={copyShareText}>
                    {copiedLink ? "Message copié !" : "Partager mon Titre"}
                  </button>
                </div>

                {/* Partage Social Après Partie */}
                <div className="share-postplay-container" style={{ 
                  marginTop: '15px', 
                  borderTop: '1px solid var(--border-glass)', 
                  paddingTop: '12px', 
                  width: '100%',
                  textAlign: 'center'
                }}>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    textTransform: 'uppercase', 
                    color: 'var(--color-text-muted)', 
                    display: 'block', 
                    marginBottom: '8px', 
                    letterSpacing: '0.5px' 
                  }}>
                    📢 Partagez votre exploit de Sorcier !
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <a 
                      href={`https://www.facebook.com/sharer/sharer.php?u=https://roadsixtygeek.com/activation&quote=J'ai%20obtenu%20le%20score%20de%20${score}%20points%20dans%20Le%20Duel%20des%20Sorciers%20sur%20Road%20Sixty%20Geek%20!`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        background: '#1877f2', 
                        color: '#fff', 
                        padding: '6px 12px', 
                        borderRadius: '6px', 
                        fontSize: '0.72rem', 
                        textDecoration: 'none', 
                        fontWeight: 'bold', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '5px' 
                      }}
                    >
                      🔵 Facebook
                    </a>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`⚡ J'ai obtenu le score de ${score} points dans "Le Duel des Sorciers" sur Road Sixty Geek ! Prêt à me défier ? Relevez le défi ici : https://roadsixtygeek.com/activation`);
                        alert("Lien et score copiés ! Collez-les dans votre bio ou story Instagram !");
                      }}
                      style={{ 
                        background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', 
                        color: '#fff', 
                        border: 'none', 
                        padding: '6px 12px', 
                        borderRadius: '6px', 
                        fontSize: '0.72rem', 
                        cursor: 'pointer', 
                        fontWeight: 'bold', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '5px' 
                      }}
                    >
                      📸 Instagram
                    </button>
                    <a 
                      href={`https://twitter.com/intent/tweet?text=J'ai%20obtenu%20le%20score%20de%20${score}%20points%20dans%20le%20Grand%20Concours%20Harry%20Potter%20sur%20Road%20Sixty%20Geek%20!%20Prêt%20à%20me%20défier%20?%20&url=https://roadsixtygeek.com/activation`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        background: '#000', 
                        color: '#fff', 
                        padding: '6px 12px', 
                        borderRadius: '6px', 
                        fontSize: '0.72rem', 
                        textDecoration: 'none', 
                        fontWeight: 'bold', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '5px', 
                        border: '1px solid #333' 
                      }}
                    >
                      𝕏 Twitter
                    </a>
                    <a 
                      href={`https://api.whatsapp.com/send?text=J'ai%20obtenu%20le%20score%20de%20${score}%20points%20dans%20le%20Grand%20Concours%20Harry%20Potter%20sur%20Road%20Sixty%20Geek%20!%20Prêt%20à%20me%20défier%20?%20Rejoins%20le%20duel%20ici%20:%20https://roadsixtygeek.com/activation`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        background: '#25d366', 
                        color: '#fff', 
                        padding: '6px 12px', 
                        borderRadius: '6px', 
                        fontSize: '0.72rem', 
                        textDecoration: 'none', 
                        fontWeight: 'bold', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '5px' 
                      }}
                    >
                      🟢 WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
      )}
    </>
  );
}
