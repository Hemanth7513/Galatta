import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate, useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import './App.css';
import { 
  Gamepad2, Film, Zap, Brain, HelpCircle, Trophy, Flame, Sparkles, 
  Volume2, VolumeX, Shuffle, Award, ChevronRight, RefreshCw, Lightbulb, 
  CheckCircle2, XCircle, Clock, Edit3, Play, ArrowLeft,
  Settings, Coins, Monitor, Sliders, Key
} from 'lucide-react';

// ==========================================
// 1. RETRO 8-BIT WEB AUDIO SYNTHESIZER
// ==========================================
class ArcadeAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.15;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type = 'square', duration = 0.08, delay = 0, vol = null) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const v = vol !== null ? vol : this.volume;
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
      gain.gain.setValueAtTime(v, this.ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + delay + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + duration);
    } catch {
      // Audio fallback
    }
  }

  // Classic Arcade Coin Chime (Two-tone high ping)
  coin() {
    this.playTone(987.77, 'square', 0.09, 0, 0.16); // B5
    this.playTone(1318.51, 'square', 0.35, 0.09, 0.22); // E6
  }

  click() {
    this.playTone(660, 'square', 0.04, 0, 0.08);
  }

  win() {
    // 8-bit victory arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((f, idx) => {
      this.playTone(f, 'square', 0.12, idx * 0.07, 0.15);
    });
  }

  lose() {
    // 8-bit crash downward slide
    this.playTone(280, 'sawtooth', 0.12, 0, 0.15);
    this.playTone(180, 'sawtooth', 0.22, 0.1, 0.15);
    this.playTone(110, 'sawtooth', 0.35, 0.22, 0.15);
  }

  levelUp() {
    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
    notes.forEach((f, idx) => {
      this.playTone(f, 'triangle', 0.14, idx * 0.05, 0.18);
    });
  }

  tileBeep(index) {
    const freqs = [329.63, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25, 783.99, 880.00];
    this.playTone(freqs[index % freqs.length], 'square', 0.14, 0, 0.14);
  }

  alarm() {
    this.playTone(880, 'sawtooth', 0.06, 0, 0.15);
    this.playTone(440, 'sawtooth', 0.06, 0.06, 0.15);
  }
}

const sfx = new ArcadeAudio();

// ==========================================
// 2. GEMINI AI API CLIENT WITH KEY STORAGE
// ==========================================
async function fetchGeminiStructured(systemPrompt, userPrompt, schema, userApiKey = "") {
  const apiKey = userApiKey.trim() || localStorage.getItem('arcade_gemini_key') || "";
  if (!apiKey) {
    throw new Error("No API key provided. Please insert API key in Arcade Settings or play offline mode!");
  }
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  };

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty AI response");
  return JSON.parse(text);
}

// ==========================================
// 3. RETRO GAME DATA BANKS
// ==========================================
const BUILT_IN_MOVIES = [
  // --- 1. BOLLYWOOD (HINDI) ---
  { 
    id: 'm1', 
    emojis: '🌧️👵🌾🪙🕳️', 
    title: 'Tumbbad', 
    category: 'BOLLYWOOD / FOLK HORROR', 
    difficulty: 'EXPERT',
    hint: 'A greedy lineage descends into the red-fleshed subterranean womb of a forgotten, gold-hoarding deity.', 
    options: ['Tumbbad', 'Pari', 'Bramayugam', 'Stree'] 
  },
  { 
    id: 'm6', 
    emojis: '🎹🕶️🐇🦀💉', 
    title: 'Andhadhun', 
    category: 'BOLLYWOOD / NEO-NOIR', 
    difficulty: 'EXPERT',
    hint: 'A pianist faking blindness witnesses an actor murder, only to awaken in a corrupt organ-harvesting clinic.', 
    options: ['Andhadhun', 'Badlapur', 'Johnny Gaddaar', 'Monica, O My Darling'] 
  },
  { 
    id: 'm11', 
    emojis: '🚂⛏️🔫🎯🎧', 
    title: 'Gangs of Wasseypur', 
    category: 'BOLLYWOOD / CRIME', 
    difficulty: 'EXPERT',
    hint: 'A generational blood vendetta ignites over Dhanbad coal mines, spanning crude country-made pistols and Bollywood song revenge.', 
    options: ['Gangs of Wasseypur', 'Satya', 'Mirzapur', 'Company'] 
  },
  { 
    id: 'm16', 
    emojis: '🛰️💧💡🚂👵', 
    title: 'Swades', 
    category: 'BOLLYWOOD / DRAMA', 
    difficulty: 'EXPERT',
    hint: 'A NASA satellite project manager is humbled by a child selling 25-paise drinking water at a rural train platform and builds a local hydro generator.', 
    options: ['Swades', 'Lagaan', 'Chak De! India', 'Pardes'] 
  },
  { 
    id: 'm58', 
    emojis: '🪙🚂🦿🩸🔫', 
    title: 'Sholay', 
    category: 'BOLLYWOOD / CLASSIC ACTION', 
    difficulty: 'HARD',
    hint: 'A retired police officer whose family was slaughtered and arms severed by a ruthless bandit hires two petty ex-convicts for bounty vengeance.', 
    options: ['Sholay', 'Deewaar', 'Shaan', 'Zanjeer'] 
  },
  { 
    id: 'm59', 
    emojis: '🏏🌾🌧️🪙🇬🇧', 
    title: 'Lagaan', 
    category: 'BOLLYWOOD / PERIOD DRAMA', 
    difficulty: 'HARD',
    hint: 'During the 1893 drought, central Indian villagers stake three years of crushing land tax on an unfamiliar cricket match against arrogant British officers.', 
    options: ['Lagaan', 'Swades', 'Mangal Pandey', 'Chak De! India'] 
  },
  { 
    id: 'm60', 
    emojis: '👶📏🚗💡🎓', 
    title: '3 Idiots', 
    category: 'BOLLYWOOD / COMEDY DRAMA', 
    difficulty: 'HARD',
    hint: 'Two engineering graduates embark on a road trip to Ladakh in search of their genius non-conformist friend who vanished on graduation day.', 
    options: ['3 Idiots', 'Taare Zameen Par', 'PK', 'Chhichhore'] 
  },
  { 
    id: 'm61', 
    emojis: '🎨✏️🐟🌟👨‍🏫', 
    title: 'Taare Zameen Par', 
    category: 'BOLLYWOOD / DRAMA', 
    difficulty: 'HARD',
    hint: 'An eight-year-old child ridiculed for inverted alphabet letters is sent to boarding school until a compassionate substitute art teacher diagnoses dyslexia.', 
    options: ['Taare Zameen Par', '3 Idiots', 'Stanley Ka Dabba', 'Black'] 
  },
  { 
    id: 'm62', 
    emojis: '🤰🔍🚇💣🚕', 
    title: 'Kahaani', 
    category: 'BOLLYWOOD / THRILLER', 
    difficulty: 'EXPERT',
    hint: 'A heavily pregnant software engineer arrives in Kolkata during Durga Puja searching for her missing husband, hiding a lethal intelligence agenda.', 
    options: ['Kahaani', 'Badla', 'Talaash', 'Drishyam'] 
  },
  { 
    id: 'm63', 
    emojis: '🚗🏖️🎨✈️💔', 
    title: 'Dil Chahta Hai', 
    category: 'BOLLYWOOD / COMEDY DRAMA', 
    difficulty: 'HARD',
    hint: 'Three wealthy Mumbai friends with differing philosophies on romance take a road trip to Goa before life and misunderstandings drift them apart.', 
    options: ['Dil Chahta Hai', 'Zindagi Na Milegi Dobara', 'Rock On!!', 'Yeh Jawaani Hai Deewani'] 
  },
  { 
    id: 'm64', 
    emojis: '❄️💀🔫🎭🧣', 
    title: 'Haider', 
    category: 'BOLLYWOOD / TRAGEDY', 
    difficulty: 'EXPERT',
    hint: 'A young poet returns to insurgency-torn Kashmir after his doctor father disappears, suspecting his uncle and mother of foul play in an adaptation of Hamlet.', 
    options: ['Haider', 'Maqbool', 'Omkara', 'Talvar'] 
  },
  { 
    id: 'm65', 
    emojis: '🔨🧳🩸1️⃣5️⃣🚬', 
    title: 'Badlapur', 
    category: 'BOLLYWOOD / NEO-NOIR', 
    difficulty: 'EXPERT',
    hint: 'A grief-consumed man spends fifteen years executing meticulous psychological revenge on the bank robber who murdered his wife and child.', 
    options: ['Badlapur', 'Andhadhun', 'Johnny Gaddaar', 'Raman Raghav 2.0'] 
  },
  { 
    id: 'm66', 
    emojis: '🎈🚲📻🍰🍬', 
    title: 'Barfi!', 
    category: 'BOLLYWOOD / ROMANCE', 
    difficulty: 'HARD',
    hint: 'A charming deaf and mute boy in 1970s Darjeeling forms an innocent emotional bond with an autistic girl and a high-society woman.', 
    options: ['Barfi!', 'Jagga Jasoos', 'Ludo', 'Tamasha'] 
  },
  { 
    id: 'm67', 
    emojis: '🎸🕊️💔🏍️🎤', 
    title: 'Rockstar', 
    category: 'BOLLYWOOD / MUSICAL DRAMA', 
    difficulty: 'HARD',
    hint: 'A clumsy Delhi collegian intentionally seeks heartbreak to ignite musical greatness, transforming into a self-destructive global musical rebel.', 
    options: ['Rockstar', 'Tamasha', 'Sanju', 'Ae Dil Hai Mushkil'] 
  },

  // --- 2. TOLLYWOOD (TELUGU) ---
  { 
    id: 'm2', 
    emojis: '🗡️👵🦶🩸⚖️', 
    title: 'Baahubali 2: The Conclusion', 
    category: 'TOLLYWOOD / EPIC', 
    difficulty: 'HARD',
    hint: 'A loyal slave-commander places the royal baby foot on his head before a tragic execution under queenly decree.', 
    options: ['Baahubali 2: The Conclusion', 'Magadheera', 'Arundhati', 'Rudhramadevi'] 
  },
  { 
    id: 'm7', 
    emojis: '🔥🌊🏍️🏹🐅', 
    title: 'RRR', 
    category: 'TOLLYWOOD / EPIC', 
    difficulty: 'HARD',
    hint: 'Elemental forces of fire and water collide before unleashing cage-bred jungle predators inside a British governor mansion.', 
    options: ['RRR', 'Sye Raa Narasimha Reddy', 'Rangasthalam', 'Acharya'] 
  },
  { 
    id: 'm13', 
    emojis: '🪰🕶️💉🏋️‍♂️🔥', 
    title: 'Eega', 
    category: 'TOLLYWOOD / FANTASY', 
    difficulty: 'HARD',
    hint: 'A murdered lover is reincarnated as an ordinary housefly that trains with tiny dumbbell weights to avenge his sweetheart.', 
    options: ['Eega', 'Magadheera', 'Aparichit', 'Robo'] 
  },
  { 
    id: 'm18', 
    emojis: '🍱👰‍♂️🪄🌙💍', 
    title: 'Mayabazar', 
    category: 'TOLLYWOOD / CLASSIC', 
    difficulty: 'HARD',
    hint: 'Ghatotkacha employs magical illusions, an enchanted gift box, and a bottomless stomach for wedding feast laddus to unite lovers.', 
    options: ['Mayabazar', 'Missamma', 'Pathala Bhairavi', 'Nartanasala'] 
  },
  { 
    id: 'm19', 
    emojis: '🪓🪵🔴🚚🧔‍♂️', 
    title: 'Pushpa: The Rise', 
    category: 'TOLLYWOOD / ACTION', 
    difficulty: 'HARD',
    hint: 'A red sandalwood laborer with a tilted shoulder rises through syndicate ranks by hiding timber logs inside milk tanker lorries.', 
    options: ['Pushpa: The Rise', 'Rangasthalam', 'Ala Vaikunthapurramuloo', 'Waltair Veerayya'] 
  },
  { 
    id: 'm20', 
    emojis: '👂📻🐍🌊🚜', 
    title: 'Rangasthalam', 
    category: 'TOLLYWOOD / DRAMA', 
    difficulty: 'EXPERT',
    hint: 'A hearing-impaired sound technician brother avenges a progressive leader assassinated before village elections.', 
    options: ['Rangasthalam', 'Pushpa: The Rise', 'Srimanthudu', 'Dasara'] 
  },
  { 
    id: 'm21', 
    emojis: '🏏🚂🧥💊❤️', 
    title: 'Jersey', 
    category: 'TOLLYWOOD / SPORTS', 
    difficulty: 'HARD',
    hint: 'A 36-year-old ex-cricketer returns to the pitch risking a fatal congenital heart condition to buy his son an Indian team jersey.', 
    options: ['Jersey', 'Majili', 'Dear Comrade', 'Nani\'s Gang Leader'] 
  },
  { 
    id: 'm22', 
    emojis: '🩺🕶️🐶💉🩸', 
    title: 'Arjun Reddy', 
    category: 'TOLLYWOOD / ROMANCE', 
    difficulty: 'HARD',
    hint: 'A brilliant surgeon with explosive rage spirals into substance abuse with his pet dog after forced separation from his junior.', 
    options: ['Arjun Reddy', 'Animal', 'Geetha Govindam', 'Baby'] 
  },
  { 
    id: 'm23', 
    emojis: '✉️🪖❄️🕊️🔒', 
    title: 'Sita Ramam', 
    category: 'TOLLYWOOD / ROMANCE', 
    difficulty: 'EXPERT',
    hint: 'An orphaned lieutenant stationed in Kashmir receives anonymous letters from an incognito princess before a fateful Pakistan jail ordeal.', 
    options: ['Sita Ramam', 'Mahanati', 'Hi Nanna', 'Shyam Singha Roy'] 
  },
  { 
    id: 'm24', 
    emojis: '🎯🌾🪞🕊️🔫', 
    title: 'Athadu', 
    category: 'TOLLYWOOD / THRILLER', 
    difficulty: 'EXPERT',
    hint: 'A professional hitman framed for an assassination assumes the identity of a deceased stranger in a joint family village home.', 
    options: ['Athadu', 'Pokiri', 'Khaleja', 'Okkadu'] 
  },
  { 
    id: 'm25', 
    emojis: '🥋🥥🔫🎧👮‍♂️', 
    title: 'Pokiri', 
    category: 'TOLLYWOOD / ACTION', 
    difficulty: 'HARD',
    hint: 'A cold-blooded underworld mercenary is revealed to be undercover IPS officer Krishna Manohar infiltrating Ali Bhai\'s syndicate.', 
    options: ['Pokiri', 'Athadu', 'Businessman', 'Gabbar Singh'] 
  },
  { 
    id: 'm26', 
    emojis: '🏹⏳👶🦾🛸', 
    title: 'Kalki 2898 AD', 
    category: 'TOLLYWOOD / SCI-FI', 
    difficulty: 'HARD',
    hint: 'An ancient cursed warrior from the Mahabharata defends an unborn divine avatar from a 200-year-old supreme totalitarian god-king in Kashi.', 
    options: ['Kalki 2898 AD', 'Salaar', 'Project K', 'Baahubali: The Beginning'] 
  },
  { 
    id: 'm27', 
    emojis: '⛓️🩸🦖🏰⏳', 
    title: 'Salaar: Part 1 - Ceasefire', 
    category: 'TOLLYWOOD / ACTION', 
    difficulty: 'HARD',
    hint: 'A mechanical exile vows to protect his childhood prince friend during an explosive voting ceasefire in the lawless city of Khansaar.', 
    options: ['Salaar: Part 1 - Ceasefire', 'KGF: Chapter 2', 'Kalki 2898 AD', 'Devara: Part 1'] 
  },
  { 
    id: 'm28', 
    emojis: '📦💊💉🐶📺', 
    title: 'Mathu Vadalara', 
    category: 'TOLLYWOOD / COMEDY THRILLER', 
    difficulty: 'EXPERT',
    hint: 'An underpaid delivery courier tries to steal small cash from an elderly woman who suddenly collapses dead, leading to a drug maze.', 
    options: ['Mathu Vadalara', 'Agent Sai Srinivasa Athreya', 'Jathi Ratnalu', 'Brochevarevarura'] 
  },
  { 
    id: 'm29', 
    emojis: '🥃🗿🧕👓❤️', 
    title: 'C/o Kancharapalem', 
    category: 'TOLLYWOOD / INDIE', 
    difficulty: 'EXPERT',
    hint: 'Four non-traditional love stories spanning childhood, youth, mid-life, and an unmarried 49-year-old attendant in a single Vizag locality.', 
    options: ['C/o Kancharapalem', 'Cinema Bandi', 'Mallesham', 'Colour Photo'] 
  },
  { 
    id: 'm30', 
    emojis: '⏳💍🐎🪨🦅', 
    title: 'Magadheera', 
    category: 'TOLLYWOOD / FANTASY', 
    difficulty: 'HARD',
    hint: 'A motocross stuntman remembers his 400-year-old warrior past at the Bhairavakona cliff to reclaim his reincarnated princess.', 
    options: ['Magadheera', 'Baahubali: The Beginning', 'Eega', 'Arundhati'] 
  },
  { 
    id: 'm31', 
    emojis: '🗡️🔮🐍🏰🩸', 
    title: 'Arundhati', 
    category: 'TOLLYWOOD / HORROR', 
    difficulty: 'HARD',
    hint: 'A young bride visits her ancestral Gadwal fortress where the vengeful spirit of an evil tantrik sorcerer breaks free from his underground tomb.', 
    options: ['Arundhati', 'Chandramukhi', 'Nagavalli', 'Bhaagamathie'] 
  },
  { 
    id: 'm32', 
    emojis: '🕵️‍♂️🔍🚊🪙🥩', 
    title: 'Agent Sai Srinivasa Athreya', 
    category: 'TOLLYWOOD / MYSTERY', 
    difficulty: 'EXPERT',
    hint: 'A quirky Nellore private detective investigating an unidentified female body on railway tracks unravels a massive dead-body theft racket.', 
    options: ['Agent Sai Srinivasa Athreya', 'Goodachari', 'HIT: The First Case', 'Mathu Vadalara'] 
  },

  // --- 3. KOLLYWOOD (TAMIL) ---
  { 
    id: 'm3', 
    emojis: '👶🍼🎭🕶️🔫', 
    title: 'Vikram', 
    category: 'KOLLYWOOD / ACTION', 
    difficulty: 'HARD',
    hint: 'A retired black-ops ghost protects his infant grandson’s milk bottle while orchestrating war on a drug kingpin.', 
    options: ['Vikram', 'Kaithi', 'Leo', 'Master'] 
  },
  { 
    id: 'm9', 
    emojis: '🚚🍲💉👮‍♂️⏳', 
    title: 'Kaithi', 
    category: 'KOLLYWOOD / ACTION', 
    difficulty: 'EXPERT',
    hint: 'A freshly paroled convict eats a giant bucket of Biryani before driving an antidote truck of poisoned cops through a siege.', 
    options: ['Kaithi', 'Vikram', 'Thani Oruvan', 'Jailer'] 
  },
  { 
    id: 'm12', 
    emojis: '📺🛸💄📦📼', 
    title: 'Super Deluxe', 
    category: 'KOLLYWOOD / DARK COMEDY', 
    difficulty: 'EXPERT',
    hint: 'Four bizarre tales intersect around a trans woman named Shilpa, an unfaithful wife hiding an accidental corpse, and a boy seeking aliens.', 
    options: ['Super Deluxe', 'Jigarthanda DoubleX', 'Aaranya Kaandam', 'Vada Chennai'] 
  },
  { 
    id: 'm17', 
    emojis: '🐕🎨🌧️🚊🩸', 
    title: 'Anbe Sivam', 
    category: 'KOLLYWOOD / DRAMA', 
    difficulty: 'EXPERT',
    hint: 'A scarred, limping communist painter and an arrogant ad filmmaker cross paths during floods, discovering god in selfless love.', 
    options: ['Anbe Sivam', 'Hey Ram', 'Nayakan', 'Thevar Magan'] 
  },
  { 
    id: 'm33', 
    emojis: '🌊🔫👵🤝👶', 
    title: 'Nayakan', 
    category: 'KOLLYWOOD / CLASSIC CRIME', 
    difficulty: 'EXPERT',
    hint: 'A young runaway boy from Tamil Nadu kills an abusive policeman in Bombay and rises as godfather Velu Naicker for slum dwellers.', 
    options: ['Nayakan', 'Thalapathi', 'Baashha', 'Thevar Magan'] 
  },
  { 
    id: 'm34', 
    emojis: '🚂☀️🤝⚔️🍂', 
    title: 'Thalapathi', 
    category: 'KOLLYWOOD / DRAMA', 
    difficulty: 'EXPERT',
    hint: 'An abandoned infant born on Bhogi day grows up into slum protector Surya and forms a legendary bond with underworld leader Devaraj.', 
    options: ['Thalapathi', 'Nayakan', 'Karnan', 'Vada Chennai'] 
  },
  { 
    id: 'm35', 
    emojis: '🌾🩸🪓🐂🧒', 
    title: 'Asuran', 
    category: 'KOLLYWOOD / DRAMA', 
    difficulty: 'EXPERT',
    hint: 'A pacifist peasant father is forced to dig up his buried weapons when his hot-headed teenage son kills a wealthy, oppressive landlord.', 
    options: ['Asuran', 'Karnan', 'Pariyerum Perumal', 'Vada Chennai'] 
  },
  { 
    id: 'm36', 
    emojis: '⚖️⛓️🐍🔦✊', 
    title: 'Jai Bhim', 
    category: 'KOLLYWOOD / LEGAL DRAMA', 
    difficulty: 'EXPERT',
    hint: 'An uncompromising High Court advocate files a habeas corpus petition to uncover the custodial torture and disappearance of a tribal snake-catcher.', 
    options: ['Jai Bhim', 'Visaranai', 'Soorarai Pottru', 'Viduthalai Part 1'] 
  },
  { 
    id: 'm37', 
    emojis: '🐎🗡️📜⛵👑', 
    title: 'Ponniyin Selvan: I', 
    category: 'KOLLYWOOD / HISTORICAL', 
    difficulty: 'HARD',
    hint: 'A charming warrior messenger journeys through medieval Chola lands carrying secret royal messages amidst a regicide conspiracy.', 
    options: ['Ponniyin Selvan: I', 'Aayirathil Oruvan', 'Baahubali 2: The Conclusion', 'Kochadaiiyaan'] 
  },
  { 
    id: 'm38', 
    emojis: '🤖🧠❤️🕶️🧲', 
    title: 'Enthiran', 
    category: 'KOLLYWOOD / SCI-FI', 
    difficulty: 'HARD',
    hint: 'A humanoid robot with artificial intelligence falls in love with his maker’s fiancée and turns destructive after a red memory chip upgrade.', 
    options: ['Enthiran', '2.0', '7aum Arivu', 'I'] 
  },
  { 
    id: 'm39', 
    emojis: '🎁🎹🪓🧒🩸', 
    title: 'Ratsasan', 
    category: 'KOLLYWOOD / PSYCHOLOGICAL THRILLER', 
    difficulty: 'EXPERT',
    hint: 'An aspiring movie director turned sub-inspector pursues an elusive serial killer who leaves disfigured dolls and piano music boxes at crime scenes.', 
    options: ['Ratsasan', 'Por Thozhil', 'Thupparivaalan', 'Dhuruvangal Pathinaaru'] 
  },
  { 
    id: 'm40', 
    emojis: '🪙⚖️🎲🔫🚬', 
    title: 'Vikram Vedha', 
    category: 'KOLLYWOOD / NOIR', 
    difficulty: 'HARD',
    hint: 'A righteous encounter policeman has his morality shattered by a philosophizing gangster who narrates riddles based on King Vikramaditya.', 
    options: ['Vikram Vedha', 'Kaithi', 'Master', 'Petta'] 
  },
  { 
    id: 'm41', 
    emojis: '🐕🚂🎓💙📘', 
    title: 'Pariyerum Perumal', 
    category: 'KOLLYWOOD / DRAMA', 
    difficulty: 'EXPERT',
    hint: 'A village youth enters law college with his murdered dog Karuppi’s memories, facing relentless humiliation from casteist classmates.', 
    options: ['Pariyerum Perumal', 'Asuran', 'Karnan', 'Maamannan'] 
  },
  { 
    id: 'm42', 
    emojis: '♟️🎯🔪⛵🏢', 
    title: 'Vada Chennai', 
    category: 'KOLLYWOOD / CRIME', 
    difficulty: 'EXPERT',
    hint: 'A skilled carrom player dreaming of a national tournament is sucked into thirty years of gang turf warfare across coastal North Madras.', 
    options: ['Vada Chennai', 'Pudhupettai', 'Polladhavan', 'Aadukalam'] 
  },
  { 
    id: 'm43', 
    emojis: '🗡️🐴🚌🐟👧', 
    title: 'Karnan', 
    category: 'KOLLYWOOD / DRAMA', 
    difficulty: 'HARD',
    hint: 'A fiery village youth mounted on a horse revolts against systemic state oppression when authorities refuse to grant his village a bus stop.', 
    options: ['Karnan', 'Asuran', 'Maamannan', 'Jai Bhim'] 
  },
  { 
    id: 'm44', 
    emojis: '📷💛🧣🎒✈️', 
    title: '96', 
    category: 'KOLLYWOOD / ROMANCE', 
    difficulty: 'HARD',
    hint: 'A nomadic nature photographer reunites with his childhood sweetheart at a high school reunion night in Chennai after 22 years of silence.', 
    options: ['96', 'Vinnaithaandi Varuvaayaa', 'Dada', 'Hey Sinamika'] 
  },
  { 
    id: 'm45', 
    emojis: '🪙🪞💻🕶️💵', 
    title: 'Sivaji: The Boss', 
    category: 'KOLLYWOOD / ACTION', 
    difficulty: 'HARD',
    hint: 'An NRI systems architect whose wealth is swindled by a corrupt education baron returns from the dead as an untouchable white-suited vigilante.', 
    options: ['Sivaji: The Boss', 'Enthiran', 'Padayappa', 'Anniyan'] 
  },
  { 
    id: 'm46', 
    emojis: '🎬🐘🎥🔫🌲', 
    title: 'Jigarthanda DoubleX', 
    category: 'KOLLYWOOD / WESTERN', 
    difficulty: 'EXPERT',
    hint: 'A tribal gangster aspiring to become a movie hero hires a former cop posing as Satyajit Ray’s assistant to film a Clint Eastwood-style Western.', 
    options: ['Jigarthanda DoubleX', 'Jigarthanda', 'Super Deluxe', 'Mahaan'] 
  },

  // --- 4. MOLLYWOOD (MALAYALAM) ---
  { 
    id: 'm4', 
    emojis: '🚗🪨2️⃣3️⃣🚓', 
    title: 'Drishyam', 
    category: 'MOLLYWOOD / THRILLER', 
    difficulty: 'EXPERT',
    hint: 'A cinema-obsessed cable operator constructs an airtight 2nd & 3rd October alibi beneath a police station floor.', 
    options: ['Drishyam', 'Memories', 'Joseph', 'Iratta'] 
  },
  { 
    id: 'm8', 
    emojis: '🕳️🦇🧗‍♂️🪢🌧️', 
    title: 'Manjummel Boys', 
    category: 'MOLLYWOOD / SURVIVAL', 
    difficulty: 'EXPERT',
    hint: 'A gang of vacationing friends defy police warnings to pull their friend from the pitch-black abyss of Guna Cave.', 
    options: ['Manjummel Boys', 'Romancham', 'Aavesham', 'Malikappuram'] 
  },
  { 
    id: 'm14', 
    emojis: '🏝️🎣🪞🧔‍♀️🧹', 
    title: 'Kumbalangi Nights', 
    category: 'MOLLYWOOD / DRAMA', 
    difficulty: 'EXPERT',
    hint: 'Four fractured brothers in a broken backwater home unite against a creepy, smiling brother-in-law obsessed with traditional masculine perfection.', 
    options: ['Kumbalangi Nights', 'Maheshinte Prathikaaram', 'Joji', 'Sudani from Nigeria'] 
  },
  { 
    id: 'm15', 
    emojis: '🎲⛓️🗝️🏚️🍚', 
    title: 'Bramayugam', 
    category: 'MOLLYWOOD / FOLK HORROR', 
    difficulty: 'EXPERT',
    hint: 'A fleeing Paanan folk singer is held prisoner in a cursed aristocratic manor where the host plays loaded dice games with destiny.', 
    options: ['Bramayugam', 'Kummatty', 'Manichitrathazhu', 'Tumbbad'] 
  },
  { 
    id: 'm47', 
    emojis: '🕺🕶️🥃🥊🧃', 
    title: 'Aavesham', 
    category: 'MOLLYWOOD / ACTION COMEDY', 
    difficulty: 'HARD',
    hint: 'Three bullied Malayali engineering students in Bangalore ally with a gold-toothed, all-white-wearing gangster named Ranga who loves karaoke.', 
    options: ['Aavesham', 'Romancham', 'Thallumaala', 'Bheeshma Parvam'] 
  },
  { 
    id: 'm48', 
    emojis: '🦋🦋🦋🎸👓', 
    title: 'Premam', 
    category: 'MOLLYWOOD / COMEDY', 
    difficulty: 'HARD',
    hint: 'George navigates three distinct chapters of romance: butterfly teenage school crush, college lecturer Malar, and a pastry bakery owner Celine.', 
    options: ['Premam', 'Bangalore Days', 'Hridayam', 'Om Shanti Oshana'] 
  },
  { 
    id: 'm49', 
    emojis: '🕶️🚗♟️🩸📿', 
    title: 'Lucifer', 
    category: 'MOLLYWOOD / POLITICAL THRILLER', 
    difficulty: 'HARD',
    hint: 'Following a Chief Minister’s demise, an enigmatic foster son steps into Kerala’s drug-funded politics, revealed to be global cartel lord Khureshi Ab\'raam.', 
    options: ['Lucifer', 'Bheeshma Parvam', 'Empuraan', 'Kurup'] 
  },
  { 
    id: 'm50', 
    emojis: '🫀🐴🩸🔪💊', 
    title: 'Joji', 
    category: 'MOLLYWOOD / CRIME DRAMA', 
    difficulty: 'EXPERT',
    hint: 'An engineering dropout and timid youngest son seizes on his tyrannical father’s stroke to commit a poisoned patricide in an isolated plantation.', 
    options: ['Joji', 'Kumbalangi Nights', 'Iratta', 'Malik'] 
  },
  { 
    id: 'm51', 
    emojis: '👟📷🥊🥋🎨', 
    title: 'Maheshinte Prathikaaram', 
    category: 'MOLLYWOOD / DRAMA', 
    difficulty: 'HARD',
    hint: 'An Idukki wedding photographer is publicly stripped and beaten in the marketplace, vowing to walk barefoot until he exacts revenge.', 
    options: ['Maheshinte Prathikaaram', 'Kumbalangi Nights', 'Thondimuthalum Driksakshiyum', 'Sudani from Nigeria'] 
  },
  { 
    id: 'm52', 
    emojis: '🏍️🎒🛹💍✈️', 
    title: 'Bangalore Days', 
    category: 'MOLLYWOOD / DRAMA', 
    difficulty: 'HARD',
    hint: 'Three close cousins leave Kerala for Bangalore chasing corporate dreams, bike motocross racing, and healing from bitter marriages.', 
    options: ['Bangalore Days', 'Premam', 'Charlie', 'Ustad Hotel'] 
  },
  { 
    id: 'm53', 
    emojis: '🌀🥃🌲🛸🤫', 
    title: 'Churuli', 
    category: 'MOLLYWOOD / SCI-FI MYSTERY', 
    difficulty: 'EXPERT',
    hint: 'Two undercover cops cross a rickety wooden bridge into a misty forest settlement where time loops and law-abiding speech vanishes.', 
    options: ['Churuli', 'Jallikattu', 'Nanpakal Nerathu Mayakkam', 'Amen'] 
  },
  { 
    id: 'm54', 
    emojis: '⚡🧵🦸‍♂️🌾🐮', 
    title: 'Minnal Murali', 
    category: 'MOLLYWOOD / SUPERHERO', 
    difficulty: 'HARD',
    hint: 'A humble village tailor struck by lightning on Christmas Eve develops telekinetic superpowers and faces a fellow lightning survivor turned arsonist.', 
    options: ['Minnal Murali', 'Maaveeran', 'Krrish', 'Lokah Samastha'] 
  },
  { 
    id: 'm55', 
    emojis: '🥊💍🕺👔📱', 
    title: 'Thallumaala', 
    category: 'MOLLYWOOD / ACTION', 
    difficulty: 'EXPERT',
    hint: 'An internet-famous groom with an obsessive addiction to fistfights sparks a catastrophic wedding-day riot told in colorful, non-linear music-video chapters.', 
    options: ['Thallumaala', 'Aavesham', 'RDX', 'Bheeshma Parvam'] 
  },
  { 
    id: 'm56', 
    emojis: '🗝️💃🪞🏰📿', 
    title: 'Manichitrathazhu', 
    category: 'MOLLYWOOD / PSYCHOLOGICAL HORROR', 
    difficulty: 'EXPERT',
    hint: 'A rational psychiatrist investigates a newly married bride who unlocks the forbidden southern room of an ancient manor and channels a murdered courtesan.', 
    options: ['Manichitrathazhu', 'Bramayugam', 'Aakasha Ganga', 'Anandabhadram'] 
  },
  { 
    id: 'm57', 
    emojis: '👮‍♂️👮‍♂️🚗🩸🧩', 
    title: 'Iratta', 
    category: 'MOLLYWOOD / MYSTERY', 
    difficulty: 'EXPERT',
    hint: 'Twin brothers who grew up under childhood trauma become police officers, only for one to be found dead inside a police station with three bullet wounds.', 
    options: ['Iratta', 'Joseph', 'Nayattu', 'Cold Case'] 
  },

  // --- 5. SANDALWOOD (KANNADA) ---
  { 
    id: 'm5', 
    emojis: '🔥🐗👑🪓🌳', 
    title: 'Kantara', 
    category: 'SANDALWOOD / FOLK', 
    difficulty: 'HARD',
    hint: 'The divine forest spirit of Panjurli possesses a hot-tempered Kambala racer to settle an ancient land treaty.', 
    options: ['Kantara', 'Garuda Gamana Vrishabha Vahana', 'Ulidavaru Kandanthe', 'KGF: Chapter 1'] 
  },
  { 
    id: 'm10', 
    emojis: '⛏️🪙🧔🔥⏳', 
    title: 'KGF: Chapter 1', 
    category: 'SANDALWOOD / ACTION', 
    difficulty: 'HARD',
    hint: 'A boy forged in Bombay slums honors his mother’s dying promise by infiltrating a subterranean gold mine as an enslaved rebel.', 
    options: ['KGF: Chapter 1', 'Kabzaa', 'Ugramm', 'Kantara'] 
  },
  { 
    id: 'm68', 
    emojis: '👑🪙🏛️🚢🔥', 
    title: 'KGF: Chapter 2', 
    category: 'SANDALWOOD / ACTION', 
    difficulty: 'HARD',
    hint: 'Having conquered Narachi, Rocky faces a brutal barbarian warlord Adheera and a fiercely determined Indian Prime Minister who declares him the country’s biggest threat.', 
    options: ['KGF: Chapter 2', 'KGF: Chapter 1', 'Salaar', 'Kantara'] 
  },
  { 
    id: 'm69', 
    emojis: '📻🌊🐯🔫🎣', 
    title: 'Ulidavaru Kandanthe', 
    category: 'SANDALWOOD / NOIR', 
    difficulty: 'EXPERT',
    hint: 'A coastal murder during the Sri Krishna Janmashtami tiger dance festival is unraveled from five character perspectives around a missing antique box.', 
    options: ['Ulidavaru Kandanthe', 'Garuda Gamana Vrishabha Vahana', 'Kirik Party', 'Lucia'] 
  },
  { 
    id: 'm70', 
    emojis: '🐂🦚🩸🤝👑', 
    title: 'Garuda Gamana Vrishabha Vahana', 
    category: 'SANDALWOOD / GANGSTER', 
    difficulty: 'EXPERT',
    hint: 'Two childhood friends representing the cosmic archetypes of Shiva and Hari take control of Mangalore’s underworld before pride tears them apart.', 
    options: ['Garuda Gamana Vrishabha Vahana', 'Ulidavaru Kandanthe', 'Kantara', 'Toby'] 
  },
  { 
    id: 'm71', 
    emojis: '💊😴📺🎭🪞', 
    title: 'Lucia', 
    category: 'SANDALWOOD / PSYCHOLOGICAL', 
    difficulty: 'EXPERT',
    hint: 'An insomniac cinema usher consumes a black-market dream pill that plunges him into an alternate reality as an acclaimed film superstar.', 
    options: ['Lucia', 'U Turn', 'Kavaludaari', 'RangiTaranga'] 
  },
  { 
    id: 'm72', 
    emojis: '🐕🍺🏍️🏔️🐾', 
    title: '777 Charlie', 
    category: 'SANDALWOOD / ADVENTURE', 
    difficulty: 'HARD',
    hint: 'A lonely, suicidal factory laborer’s grim existence is revitalized when a runaway Labrador puppy enters his life, leading to a motorcycle ride to Kashmir.', 
    options: ['777 Charlie', 'Kirik Party', 'Dia', 'Love Mocktail'] 
  },
  { 
    id: 'm73', 
    emojis: '🛢️🩸🚂🔫🤝', 
    title: 'Ugramm', 
    category: 'SANDALWOOD / ACTION', 
    difficulty: 'HARD',
    hint: 'A hardened former underworld enforcer hiding as an auto mechanic breaks his non-violence pledge to protect an NRI girl from a ruthless gang.', 
    options: ['Ugramm', 'KGF: Chapter 1', 'Mufti', 'Tagaru'] 
  },
  { 
    id: 'm74', 
    emojis: '🎭🌧️🚗👻✍️', 
    title: 'RangiTaranga', 
    category: 'SANDALWOOD / MYSTERY', 
    difficulty: 'EXPERT',
    hint: 'An anonymous novelist and his pregnant wife move to her remote ancestral village of Kamarottu, plagued by unexplained accidents and a mysterious ritual.', 
    options: ['RangiTaranga', 'Avane Srimannarayana', 'Kantara', 'Vikrant Rona'] 
  }
];

const BUILT_IN_TRIVIA = [
  { q: "What animal actually has rectangular pupils?", options: ["Goat", "Platypus", "Sloth", "Chameleon"], answer: "Goat", category: "Weird Nature" },
  { q: "Which planet in our solar system rotates clockwise (retrograde)?", options: ["Venus", "Mars", "Jupiter", "Mercury"], answer: "Venus", category: "Retro Space" },
  { q: "What was the first commercial arcade video game released in 1971?", options: ["Computer Space", "Pong", "Space Invaders", "Pac-Man"], answer: "Computer Space", category: "Arcade History" },
  { q: "How many hearts does an octopus have?", options: ["3", "1", "2", "8"], answer: "3", category: "Weird Nature" },
  { q: "In what year was the legendary arcade game Pac-Man first released?", options: ["1980", "1978", "1982", "1984"], answer: "1980", category: "Arcade History" },
  { q: "Which human bone is the smallest in the body?", options: ["Stapes (in the ear)", "Pinky toe", "Tailbone", "Kneecap"], answer: "Stapes (in the ear)", category: "Science" },
  { q: "What is the national animal of Scotland?", options: ["Unicorn", "Loch Ness Monster", "Highland Cow", "Red Lion"], answer: "Unicorn", category: "Weird Facts" },
  { q: "Which fruit is botanically a berry, while strawberries are not?", options: ["Banana", "Raspberry", "Blackberry", "Peach"], answer: "Banana", category: "Food Facts" },
  { q: "What color is a hippopotamus's sweat?", options: ["Red / Pink", "Clear", "Blue", "Yellow"], answer: "Red / Pink", category: "Weird Nature" },
  { q: "In Nintendo lore, what was Mario's original profession in Donkey Kong?", options: ["Carpenter", "Plumber", "Electrician", "Chef"], answer: "Carpenter", category: "Arcade Gaming" }
];

const BUILT_IN_DILEMMAS = [
  { id: 'd1', optionA: "Have fingers as long as your legs", optionB: "Have legs as short as your fingers", votesA: 642, votesB: 819, tag: "Absurd Anatomy" },
  { id: 'd2', optionA: "Always speak in rhymes like a bard", optionB: "Loud 8-bit boss music plays whenever you enter a room", votesA: 310, votesB: 1290, tag: "Arcade Chaos" },
  { id: 'd3', optionA: "Fight 100 duck-sized horses in a pixel arena", optionB: "Fight 1 horse-sized duck with a vendetta", votesA: 980, votesB: 420, tag: "Boss Fight" },
  { id: 'd4', optionA: "Teleport anywhere, but arrive soaking wet", optionB: "Fly, but only at a slow jogging speed (4 mph)", votesA: 540, votesB: 710, tag: "Flawed Powers" },
  { id: 'd5', optionA: "Never have to sleep again & feel 100% rested", optionB: "Eat anything you want with zero health consequence", votesA: 890, votesB: 920, tag: "Power-Ups" }
];

const BADGE_DEFINITIONS = [
  { id: 'first_play', name: 'ROOKIE COIN', desc: 'Inserted your first arcade coin', icon: '🪙', check: (s) => s.gamesPlayed >= 1 },
  { id: 'cinephile', name: 'PIXEL CINEPHILE', desc: 'Score 300+ in Emoji Cinema', icon: '🎬', check: (s) => (s.movieBest || 0) >= 300 },
  { id: 'trivia_wiz', name: 'TURBO GENIUS', desc: 'Score 400+ in Trivia Blitz', icon: '⚡', check: (s) => (s.triviaBest || 0) >= 400 },
  { id: 'cyber_reflex', name: 'LIGHTNING REFLEX', desc: 'Reaction speed score 350+ pts', icon: '⚡', check: (s) => (s.reflexBest || 0) >= 350 },
  { id: 'philosopher', name: 'ARENA DUELIST', desc: 'Vote on 5+ Absurd Dilemmas', icon: '🥊', check: (s) => (s.dilemmasVoted || 0) >= 5 },
  { id: 'hyped_100', name: 'OVERDRIVE HYPED!', desc: 'Crush Boredom Meter to 0%', icon: '🔥', check: (s) => (s.boredomLevel ?? 100) <= 0 },
  { id: 'streak_5', name: 'COMBO MASTER', desc: 'Achieve a 5x Combo Streak', icon: '🌟', check: (s) => (s.bestStreak || 0) >= 5 }
];

const DEFAULT_LEADERBOARD = [
  { tag: 'NEO', nickname: 'NeoPixel', score: 3850, streak: 9, badges: 6 },
  { tag: 'MKG', nickname: 'CyberViper', score: 2940, streak: 7, badges: 5 },
  { tag: 'RET', nickname: 'ArcadeQueen', score: 2450, streak: 6, badges: 4 },
  { tag: '8BT', nickname: 'BitMaster', score: 1820, streak: 5, badges: 3 },
  { tag: 'PAC', nickname: 'PixelGhost', score: 1210, streak: 4, badges: 2 }
];

// ==========================================
// 4. MAIN ARCADE APPLICATION
// ==========================================
export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [soundOn, setSoundOn] = useState(true);
  const [crtFilter, setCrtFilter] = useState(true);
  const [credits, setCredits] = useState(() => Number(localStorage.getItem('arcade_credits') || 10));
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => localStorage.getItem('arcade_gemini_key') || '');
  const [tagInput, setTagInput] = useState(() => localStorage.getItem('arcade_player_tag') || 'YOU');
  const [editingTag, setEditingTag] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Player Stats with LocalStorage Persistence
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('arcade_stats_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      tag: 'YOU',
      nickname: 'ArcadeHero',
      score: 0,
      streak: 0,
      bestStreak: 0,
      boredomLevel: 100, // 100% (bored) -> 0% (OVERDRIVE HYPED!)
      gamesPlayed: 0,
      movieBest: 0,
      triviaBest: 0,
      reflexBest: 0,
      dilemmasVoted: 0,
      badges: []
    };
  });

  // Save Stats
  useEffect(() => {
    localStorage.setItem('arcade_stats_v2', JSON.stringify(stats));
  }, [stats]);

  // Sync Audio Setting
  useEffect(() => {
    sfx.enabled = soundOn;
  }, [soundOn]);

  // Insert Coin Interaction
  const handleInsertCoin = () => {
    sfx.coin();
    setCredits((prev) => {
      const next = prev + 1;
      localStorage.setItem('arcade_credits', next);
      return next;
    });
    // Dropping boredom by 5% simply by inserting coin!
    setStats((prev) => ({
      ...prev,
      score: prev.score + 25,
      boredomLevel: Math.max(0, prev.boredomLevel - 5)
    }));
    triggerPixelConfetti();
    showToast('COIN INSERTED! +1 CREDIT & +25 PTS', '🪙');
  };

  const triggerPixelConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00f3ff', '#ff0055', '#ffe600', '#39ff14', '#bc13fe'],
      shapes: ['square'],
      scalar: 1.2
    });
  };

  const showToast = (msg, icon = '🕹️') => {
    setToastMessage({ msg, icon });
    setTimeout(() => setToastMessage(null), 2800);
  };

  // Game Action Score Processor
  const recordGameAction = ({
    scoreGain = 0,
    boredomDrop = 15,
    incrementStreak = false,
    resetStreak = false,
    gameType = null,
    sessionScore = 0
  }) => {
    setStats((prev) => {
      const newScore = prev.score + scoreGain;
      const newStreak = resetStreak ? 0 : incrementStreak ? prev.streak + 1 : prev.streak;
      const newBestStreak = Math.max(prev.bestStreak || 0, newStreak);
      const newBoredom = Math.max(0, prev.boredomLevel - boredomDrop);
      const newGamesPlayed = prev.gamesPlayed + 1;

      const updated = {
        ...prev,
        score: newScore,
        streak: newStreak,
        bestStreak: newBestStreak,
        boredomLevel: newBoredom,
        gamesPlayed: newGamesPlayed,
        movieBest: gameType === 'movie' ? Math.max(prev.movieBest || 0, sessionScore) : prev.movieBest,
        triviaBest: gameType === 'trivia' ? Math.max(prev.triviaBest || 0, sessionScore) : prev.triviaBest,
        reflexBest: gameType === 'reflex' ? Math.max(prev.reflexBest || 0, sessionScore) : prev.reflexBest,
        dilemmasVoted: gameType === 'dilemma' ? prev.dilemmasVoted + 1 : prev.dilemmasVoted
      };

      // Check badges
      const currentBadges = new Set(updated.badges || []);
      let newlyUnlocked = null;
      BADGE_DEFINITIONS.forEach((b) => {
        if (!currentBadges.has(b.id) && b.check(updated)) {
          currentBadges.add(b.id);
          newlyUnlocked = b;
        }
      });
      updated.badges = Array.from(currentBadges);

      if (newlyUnlocked) {
        sfx.levelUp();
        triggerPixelConfetti();
        showToast(`ACHIEVEMENT: ${newlyUnlocked.name}!`, newlyUnlocked.icon);
      }

      return updated;
    });
  };

  const handleSurpriseMe = () => {
    sfx.coin();
    const gameRoutes = ['/bomma', '/trivia', '/reflex', '/duel'];
    const currentPath = location.pathname;
    const otherGames = gameRoutes.filter((r) => r !== currentPath);
    const pick = otherGames[Math.floor(Math.random() * otherGames.length)] || '/bomma';
    navigate(pick);
    showToast('RANDOM BOOSTER ENGAGED!', '🎲');
  };

  const handleSaveTag = () => {
    const clean = tagInput.trim().toUpperCase().slice(0, 4) || 'YOU';
    setTagInput(clean);
    setEditingTag(false);
    localStorage.setItem('arcade_player_tag', clean);
    setStats((prev) => ({ ...prev, tag: clean }));
    sfx.click();
    showToast(`PLAYER TAG: [${clean}]`, '👾');
  };

  const handleSaveApiKey = () => {
    localStorage.setItem('arcade_gemini_key', apiKeyInput.trim());
    setShowSettings(false);
    sfx.coin();
    showToast('GEMINI API KEY SAVED! AI MODES ONLINE', '🔑');
  };

  // Boredom gauge segmented LEDs (10 segments)
  const boredomSegments = useMemo(() => {
    const totalSegments = 10;
    const hypedPercentage = Math.max(0, 100 - (stats.boredomLevel ?? 100));
    const activeCount = Math.ceil((hypedPercentage / 100) * totalSegments);
    return Array.from({ length: totalSegments }).map((_, i) => ({
      lit: i < activeCount,
      type: i < 3 ? 'lit-danger' : i < 6 ? 'lit-warning' : i < 9 ? 'lit-good' : 'lit-hyped'
    }));
  }, [stats.boredomLevel]);

  return (
    <div className={`min-h-screen ${crtFilter ? 'crt-active crt-flicker' : ''}`}>
      {/* ==========================================================================
          RETRO ARCADE CABINET MARQUEE HEADER
         ========================================================================== */}
      <header className="arcade-marquee-header">
        {/* Animated Marquee Bulb Chase */}
        <div className="marquee-chaser">
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              className={`bulb ${
                i % 3 === 0 ? 'active-cyan' : i % 3 === 1 ? 'active-pink' : 'active-yellow'
              }`}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Cabinet Brand & Logo */}
          <div 
            onClick={() => { sfx.click(); navigate('/'); }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-lg bg-black border-2 border-[#ff0055] flex items-center justify-center shadow-[0_0_15px_#ff0055]">
              <Gamepad2 className="w-7 h-7 text-[#00f3ff] group-hover:rotate-12 transition-transform" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-pixel text-base sm:text-xl text-white neon-text-pink tracking-wider">
                  GALATTA
                </span>
              </div>
            </div>
          </div>

          {/* Center: 10-Segment LED Boredom Meter */}
          <div className="hidden lg:flex flex-col items-center gap-1">
            <div className="flex items-center justify-between w-full text-xs font-pixel">
              <span className="text-slate-400 text-[10px]">
                BOREDOM: <span className="neon-text-yellow">{stats.boredomLevel}%</span>
              </span>
              <span className="text-[10px] neon-text-cyan">
                {stats.boredomLevel <= 0 ? 'OVERDRIVE!' : stats.boredomLevel <= 40 ? 'HYPED' : 'YAWNING'}
              </span>
            </div>
            <div className="segmented-meter w-64">
              {boredomSegments.map((seg, idx) => (
                <div
                  key={idx}
                  className={`meter-segment ${seg.lit ? seg.type : ''}`}
                  title={`${(idx + 1) * 10}% Hyped`}
                />
              ))}
            </div>
          </div>

          {/* Right Controls: Insert Coin, High Score, CRT & Sound toggles */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Score Screen Pill */}
            <div className="bg-[#080814] border-2 border-[#ffe600] px-3 py-1.5 rounded flex items-center gap-2 shadow-[0_0_10px_rgba(255,230,0,0.3)]">
              <Trophy className="w-4 h-4 text-[#ffe600]" />
              <div className="text-right">
                <div className="font-pixel text-[8px] text-slate-400">HI-SCORE</div>
                <div className="font-pixel text-xs text-[#ffe600]">{stats.score}</div>
              </div>
            </div>

            {/* Streak Multiplier */}
            <div className="bg-[#080814] border-2 border-[#ff7700] px-3 py-1.5 rounded flex items-center gap-1.5 shadow-[0_0_10px_rgba(255,119,0,0.3)]">
              <Flame className={`w-4 h-4 ${stats.streak > 0 ? 'text-[#ff7700] arcade-pulse' : 'text-slate-600'}`} />
              <span className="font-pixel text-xs text-[#ff7700]">{stats.streak}x</span>
            </div>

            {/* Retro INSERT COIN Button */}
            <button
              onClick={handleInsertCoin}
              className="arcade-btn arcade-btn-yellow insert-coin-blink"
              title="Click to insert coin, gain credits and boost score!"
            >
              <Coins className="w-4 h-4" />
              <span>COIN ({credits})</span>
            </button>

            {/* CRT Monitor Shader Toggle */}
            <button
              onClick={() => { sfx.click(); setCrtFilter(!crtFilter); }}
              className={`p-2 rounded border-2 transition-all cursor-pointer ${
                crtFilter
                  ? 'bg-[#00f3ff]/20 border-[#00f3ff] text-[#00f3ff]'
                  : 'bg-[#121224] border-slate-700 text-slate-400'
              }`}
              title={crtFilter ? "CRT Scanlines: ON" : "CRT Scanlines: OFF"}
            >
              <Monitor className="w-4 h-4" />
            </button>

            {/* Sound Mute Toggle */}
            <button
              onClick={() => {
                const next = !soundOn;
                setSoundOn(next);
                if (next) sfx.coin();
              }}
              className="p-2 rounded border-2 border-slate-700 bg-[#121224] text-slate-300 hover:text-white cursor-pointer"
              title={soundOn ? "Mute 8-Bit Audio" : "Unmute 8-Bit Audio"}
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-[#00f3ff]" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Settings Modal */}
            <button
              onClick={() => { sfx.click(); setShowSettings(true); }}
              className="p-2 rounded border-2 border-slate-700 bg-[#121224] text-slate-300 hover:text-white cursor-pointer"
              title="Arcade Machine Settings & Gemini API Key"
            >
              <Settings className="w-4 h-4 text-[#bc13fe]" />
            </button>
          </div>
        </div>

        {/* Scrolling Arcade Ticker */}
        <div className="ticker-wrap">
          <div className="ticker-move font-pixel text-[10px] text-cyan-300 flex items-center gap-8">
            <span>🕹️ WELCOME TO GALATTA</span>
            <span>⚡ PRESS [INSERT COIN] FOR CREDITS</span>
            <span>🎬 BOMMA PADINDI: CRYPTIC INDIAN CINEMA RIDDLES</span>
            <span>⏱️ 10S TURBO TRIVIA BLITZ</span>
            <span>🧠 MATRIX MEMORY & WHACK-A-SPARK</span>
            <span>🥊 VERSUS DUEL ABSURD WOULD YOU RATHER</span>
            <span>🔥 PLAY GALATTA • UNLOCK OVERDRIVE</span>
          </div>
        </div>

        {/* Navigation Tabs Styled as Arcade Buttons */}
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { path: '/', label: 'MAIN CABINET', icon: Gamepad2, color: 'arcade-btn-primary' },
            { path: '/bomma', label: 'BOMMA (సినిమా)', icon: Film, color: 'arcade-btn-yellow' },
            { path: '/trivia', label: 'TURBO TRIVIA', icon: Zap, color: 'arcade-btn-cyan' },
            { path: '/reflex', label: 'REFLEX GRID', icon: Brain, color: 'arcade-btn-primary' },
            { path: '/duel', label: 'VERSUS DUEL', icon: HelpCircle, color: 'arcade-btn-yellow' },
            { path: '/hall-of-fame', label: 'HALL OF FAME', icon: Trophy, color: 'arcade-btn-cyan' }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.path === '/' ? location.pathname === '/' : location.pathname.startsWith(tab.path);
            return (
              <button
                key={tab.path}
                onClick={() => { sfx.click(); navigate(tab.path); }}
                className={`arcade-btn text-[10px] sm:text-[11px] whitespace-nowrap ${
                  isActive ? tab.color : 'arcade-btn-dark'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Floating Retro Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#080816] border-2 border-[#00f3ff] text-white px-5 py-3 rounded-lg shadow-[0_0_20px_#00f3ff] font-pixel text-xs animate-bounce">
          <span className="text-xl">{toastMessage.icon}</span>
          <span className="text-[#00f3ff]">{toastMessage.msg}</span>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="arcade-modal-backdrop" onClick={() => setShowSettings(false)}>
          <div className="arcade-modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b-2 border-[#202040] pb-3 mb-4">
              <h3 className="font-pixel text-sm text-[#00f3ff] flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                <span>ARCADE MACHINE SETTINGS</span>
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="font-pixel text-xs text-rose-500 hover:text-white"
              >
                [X]
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block font-pixel text-[10px] text-amber-400 mb-1">
                  GEMINI AI API KEY (OPTIONAL FOR ENDLESS MODES):
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="arcade-input flex-1 text-sm font-mono"
                  />
                  <button
                    onClick={handleSaveApiKey}
                    className="arcade-btn arcade-btn-cyan text-[10px]"
                  >
                    SAVE
                  </button>
                </div>
                <p className="font-crt text-sm text-slate-400 mt-1">
                  * Note: All 4 games work 100% offline out-of-the-box with built-in retro databases. An API key unlocks live endless generative questions!
                </p>
              </div>

              <div className="pt-3 border-t-2 border-[#202040] flex items-center justify-between">
                <span className="font-pixel text-[10px] text-slate-300">CRT SCANLINE SHADER</span>
                <button
                  onClick={() => { sfx.click(); setCrtFilter(!crtFilter); }}
                  className={`arcade-btn text-[10px] ${crtFilter ? 'arcade-btn-primary' : 'arcade-btn-dark'}`}
                >
                  {crtFilter ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-pixel text-[10px] text-slate-300">8-BIT SYNTHESIZER AUDIO</span>
                <button
                  onClick={() => {
                    const next = !soundOn;
                    setSoundOn(next);
                    if (next) sfx.coin();
                  }}
                  className={`arcade-btn text-[10px] ${soundOn ? 'arcade-btn-cyan' : 'arcade-btn-dark'}`}
                >
                  {soundOn ? 'SOUND ON' : 'MUTED'}
                </button>
              </div>

              <div className="pt-3 border-t-2 border-[#202040] flex justify-end">
                <button
                  onClick={() => setShowSettings(false)}
                  className="arcade-btn arcade-btn-yellow"
                >
                  RETURN TO GAME
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MAIN ARCADE VIEWS
         ========================================================================== */}
      <main className="arcade-container">
        <Routes>
          <Route
            path="/"
            element={
              <ArcadeHubView
                stats={stats}
                boredomSegments={boredomSegments}
                onSelectGame={(g) => {
                  sfx.click();
                  const target = g === 'movies' || g === 'bomma' ? '/bomma' : g === 'dilemma' || g === 'duel' ? '/duel' : `/${g}`;
                  navigate(target);
                }}
                onSurpriseMe={handleSurpriseMe}
                onInsertCoin={handleInsertCoin}
                credits={credits}
                tagInput={tagInput}
                setTagInput={setTagInput}
                editingTag={editingTag}
                setEditingTag={setEditingTag}
                onSaveTag={handleSaveTag}
              />
            }
          />
          <Route
            path="/bomma"
            element={
              <CinePixelGame
                stats={stats}
                recordGameAction={recordGameAction}
                triggerConfetti={triggerPixelConfetti}
                showToast={showToast}
                onBack={() => navigate('/')}
              />
            }
          />
          <Route path="/movies" element={<Navigate to="/bomma" replace />} />
          <Route
            path="/trivia"
            element={
              <TurboTriviaGame
                stats={stats}
                recordGameAction={recordGameAction}
                triggerConfetti={triggerPixelConfetti}
                showToast={showToast}
                onBack={() => navigate('/')}
              />
            }
          />
          <Route
            path="/reflex"
            element={
              <ReflexMatrixGame
                stats={stats}
                recordGameAction={recordGameAction}
                triggerConfetti={triggerPixelConfetti}
                showToast={showToast}
                onBack={() => navigate('/')}
              />
            }
          />
          <Route
            path="/duel"
            element={
              <VersusDilemmaGame
                stats={stats}
                recordGameAction={recordGameAction}
                showToast={showToast}
                onBack={() => navigate('/')}
              />
            }
          />
          <Route path="/dilemma" element={<Navigate to="/duel" replace />} />
          <Route
            path="/hall-of-fame"
            element={
              <HallOfFameView
                stats={stats}
                onSelectGame={(g) => {
                  sfx.click();
                  const target = g === 'movies' || g === 'bomma' ? '/bomma' : g === 'dilemma' || g === 'duel' ? '/duel' : `/${g}`;
                  navigate(target);
                }}
              />
            }
          />
          <Route path="/leaderboard" element={<Navigate to="/hall-of-fame" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

// ==========================================
// 5. ARCADE HUB CABINET VIEW
// ==========================================
function ArcadeHubView({
  stats,
  boredomSegments,
  onSelectGame,
  onSurpriseMe,
  onInsertCoin,
  credits,
  tagInput,
  setTagInput,
  editingTag,
  setEditingTag,
  onSaveTag
}) {
  const cabinets = [
    {
      id: 'movies',
      title: 'BOMMA (బొమ్మ)',
      subtitle: '74 Cryptic Plot Riddles across Tollywood, Bollywood, Kollywood, Mollywood & Sandalwood',
      badge: '74 MOVIES • EXPERT',
      highScore: `${stats.movieBest || 0} PTS`,
      borderClass: 'arcade-card-yellow',
      headerBg: 'bg-gradient-to-r from-amber-600 to-yellow-500',
      icon: Film,
      actionBtn: 'arcade-btn-yellow',
      marquee: '74 MOVIES • TOLLYWOOD • KOLLYWOOD • MOLLYWOOD • BOLLYWOOD • SANDALWOOD'
    },
    {
      id: 'trivia',
      title: 'TURBO TRIVIA 10S',
      subtitle: 'High-Velocity 10-Second Countdown with Combo Multipliers',
      badge: 'SPEED BLITZ',
      highScore: `${stats.triviaBest || 0} PTS`,
      borderClass: '',
      headerBg: 'bg-gradient-to-r from-cyan-600 to-blue-500',
      icon: Zap,
      actionBtn: 'arcade-btn-cyan',
      marquee: '⏱️ 10.0s • 3X COMBO'
    },
    {
      id: 'reflex',
      title: 'REFLEX & MATRIX',
      subtitle: 'Whack-a-Spark millisecond reaction test + 9-Pad Memory Sequence',
      badge: 'NEURO-GRID',
      highScore: `${stats.reflexBest || 0} PTS`,
      borderClass: 'arcade-card-green',
      headerBg: 'bg-gradient-to-r from-emerald-600 to-teal-500',
      icon: Brain,
      actionBtn: 'arcade-btn-primary',
      marquee: '⚡ ms TIMER • SIMON RECALL'
    },
    {
      id: 'dilemma',
      title: 'VERSUS DUEL DILEMMA',
      subtitle: 'Player 1 vs Player 2 Absurd Scenarios & Community Tug-of-War',
      badge: 'VERSUS FIGHT',
      highScore: `${stats.dilemmasVoted || 0} VOTED`,
      borderClass: 'arcade-card-pink',
      headerBg: 'bg-gradient-to-r from-pink-600 to-purple-600',
      icon: HelpCircle,
      actionBtn: 'arcade-btn-primary',
      marquee: '🥊 P1 vs P2 TUG-OF-WAR'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Arcade Cabinet Display */}
      <div className="arcade-card p-6 sm:p-8 border-4 border-[#ff0055] shadow-[0_0_30px_rgba(255,0,85,0.35)] relative">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="pixel-badge pixel-badge-pink">PLAYER 1 READY</span>
              <span className="pixel-badge pixel-badge-cyan">CREDITS: {credits}</span>
            </div>
            <h1 className="font-pixel text-xl sm:text-3xl text-white leading-relaxed">
              CHALLENGER:{' '}
              {editingTag ? (
                <span className="inline-flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={4}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && onSaveTag()}
                    className="arcade-input w-24 text-center uppercase"
                    autoFocus
                  />
                  <button onClick={onSaveTag} className="arcade-btn arcade-btn-cyan text-[10px] py-1 px-3">
                    SET
                  </button>
                </span>
              ) : (
                <span 
                  onClick={() => setEditingTag(true)}
                  className="neon-text-cyan cursor-pointer hover:underline inline-flex items-center gap-2"
                  title="Click to edit player initials"
                >
                  [{stats.tag || 'YOU'}]
                  <Edit3 className="w-4 h-4 text-slate-400" />
                </span>
              )}
            </h1>
            <p className="font-crt text-xl sm:text-2xl text-slate-300 leading-normal">
              INSERT COINS, ENGAGE ANY RETRO MINI-GAME, AND ENJOY GALATTA!
            </p>
          </div>

          {/* Boredom Status Cockpit Card */}
          <div className="bg-[#070712] border-2 border-[#00f3ff] p-5 rounded-lg w-full lg:w-80 shadow-[0_0_15px_rgba(0,243,255,0.25)] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-pixel text-[10px] text-slate-400">BOREDOM GAUGE</span>
              <span className="font-pixel text-[10px] neon-text-pink">
                {stats.boredomLevel <= 0 ? 'HYPED 100%' : `${stats.boredomLevel}% BORED`}
              </span>
            </div>

            <div className="segmented-meter">
              {boredomSegments.map((seg, idx) => (
                <div key={idx} className={`meter-segment ${seg.lit ? seg.type : ''}`} />
              ))}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={onSurpriseMe}
                className="arcade-btn arcade-btn-cyan flex-1 text-[10px]"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>RANDOM BOOSTER</span>
              </button>
              <button
                onClick={onInsertCoin}
                className="arcade-btn arcade-btn-yellow text-[10px]"
                title="Drop Coin"
              >
                +🪙
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Arcade Cabinet Machines */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-pixel text-sm sm:text-base text-white flex items-center gap-2 neon-text-cyan">
            <Gamepad2 className="w-5 h-5 text-[#00f3ff]" />
            <span>SELECT ARCADE CABINET</span>
          </h2>
          <span className="font-pixel text-[10px] text-slate-400">4 COIN-OP GAMES READY</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cabinets.map((cab) => {
            const Icon = cab.icon;
            return (
              <div
                key={cab.id}
                onClick={() => onSelectGame(cab.id)}
                className={`arcade-card ${cab.borderClass} p-6 flex flex-col justify-between cursor-pointer group`}
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="w-12 h-12 rounded bg-[#090916] border-2 border-slate-700 flex items-center justify-center text-white group-hover:border-[#00f3ff] transition-colors">
                      <Icon className="w-6 h-6 text-[#00f3ff]" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="pixel-badge pixel-badge-cyan">{cab.badge}</span>
                      <span className="font-pixel text-[9px] text-amber-400">BEST: {cab.highScore}</span>
                    </div>
                  </div>

                  <h3 className="font-pixel text-base text-white group-hover:neon-text-cyan transition-colors mb-2">
                    {cab.title}
                  </h3>
                  <p className="font-crt text-xl text-slate-300 leading-snug mb-4">
                    {cab.subtitle}
                  </p>
                </div>

                <div className="pt-4 border-t-2 border-[#1a1a36] flex items-center justify-between">
                  <span className="font-pixel text-[9px] text-slate-400 bg-[#06060f] px-2.5 py-1 rounded">
                    {cab.marquee}
                  </span>
                  <button className={`arcade-btn ${cab.actionBtn} text-[10px]`}>
                    <span>PLAY NOW</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Retro Badges Showcase */}
      <div className="arcade-card p-6 border-2 border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-pixel text-xs sm:text-sm text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>ARCADE BADGES & TROPHIES ({(stats.badges || []).length}/{BADGE_DEFINITIONS.length})</span>
          </h3>
          <span className="font-crt text-lg text-slate-400">COLLECT THEM ALL!</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {BADGE_DEFINITIONS.map((b) => {
            const unlocked = (stats.badges || []).includes(b.id);
            return (
              <div
                key={b.id}
                className={`p-3 rounded border-2 text-center transition-all ${
                  unlocked
                    ? 'bg-[#150a24] border-[#bc13fe] text-white shadow-[0_0_10px_rgba(188,19,254,0.3)]'
                    : 'bg-[#070712] border-slate-800/60 text-slate-600 opacity-50'
                }`}
              >
                <div className="text-2xl mb-1">{b.icon}</div>
                <div className="font-pixel text-[8px] text-slate-200 truncate">{b.name}</div>
                <div className="font-crt text-sm text-slate-400 leading-tight mt-1">{b.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5.5 REGIONAL LANGUAGE APPRECIATION ENGINE
// ==========================================
function getLanguageFeedback(category = '', isCorrect = true, points = 100) {
  const cat = (category || '').toUpperCase();

  // 1. TELUGU (TOLLYWOOD) - 100% Pure Telugu
  if (cat.includes('TOLLYWOOD') || cat.includes('TELUGU')) {
    if (isCorrect) {
      const teluguPraises = [
        {
          headline: 'రచ్చ లేపావు మావా! తోపు సమాధానం! 🔥',
          subText: 'పూనకాలు తెప్పించావు! థియేటర్ మొత్తం దద్దరిల్లింది!',
          toast: 'రచ్చ లేపావు మావా! తోపు సమాధానం! 🔥'
        },
        {
          headline: 'అదిరా లెక్క! సరైన సమాధానం బాసూ! 💥',
          subText: 'సూపర్ సిక్స్ కొట్టావు! మైండ్ బ్లోయింగ్ రచ్చ!',
          toast: 'అదిరా లెక్క! సరైన సమాధానం! 💥'
        },
        {
          headline: 'దిమ్మతిరిగే ఆన్సర్! కేక అంతే మావా! ⚡',
          subText: 'సినిమా పిచ్చోడు అంటే నువ్వే బాస్! అదిరిపోయింది!',
          toast: 'దిమ్మతిరిగే సమాధానం బాసూ! ⚡'
        },
        {
          headline: 'బొమ్మ బ్లాక్‌బస్టర్! తగ్గేదే లే! 🦁',
          subText: 'బాక్సాఫీస్ బద్దలైపోయింది! అసలైన సినీ వీరుడివి!',
          toast: 'బొమ్మ బ్లాక్‌బస్టర్! తగ్గేదే లే! 🦁'
        }
      ];
      const pick = teluguPraises[Math.floor(Math.random() * teluguPraises.length)];
      return {
        lang: 'Telugu',
        icon: '🦁',
        badge: '⚡ తెలుగు సినిమా',
        badgeColor: 'border-[#00f3ff] text-[#00f3ff] bg-[#00f3ff]/15',
        headline: pick.headline,
        subText: pick.subText,
        pointsLabel: `+${points} పాయింట్లు లభించాయి!`,
        answerLabel: 'సరైన సినిమా:',
        nextButtonLabel: 'తదుపరి బొమ్మ ➔',
        toast: pick.toast
      };
    } else {
      const teluguErrors = [
        {
          headline: 'తప్పు సమాధానం మావా! అసలు ఊహించలేదు! ❌',
          subText: 'పర్లేదు బాస్! నిజమైన సినిమా అభిమాని ఎప్పుడూ తగ్గడు!',
          toast: 'తప్పు సమాధానం! మళ్లీ ప్రయత్నించు మావా! ❌'
        },
        {
          headline: 'అయ్యో తప్పు సమాధానం! కొద్దిలో మిస్సయ్యింది! ❌',
          subText: 'ధైర్యం కోల్పోవద్దు! మరోసారి గట్టిగా ప్రయత్నించు!',
          toast: 'అయ్యో తప్పు సమాధానం! ❌'
        }
      ];
      const pick = teluguErrors[Math.floor(Math.random() * teluguErrors.length)];
      return {
        lang: 'Telugu',
        icon: '❌',
        badge: '⚠️ తప్పు సమాధానం',
        badgeColor: 'border-[#ff0055] text-[#ff0055] bg-[#ff0055]/15',
        headline: pick.headline,
        subText: pick.subText,
        pointsLabel: '',
        answerLabel: 'సరైన సినిమా:',
        nextButtonLabel: 'తదుపరి బొమ్మ ➔',
        toast: pick.toast
      };
    }
  }

  // 2. TAMIL (KOLLYWOOD) - 100% Pure Tamil
  if (cat.includes('KOLLYWOOD') || cat.includes('TAMIL')) {
    if (isCorrect) {
      const tamilPraises = [
        {
          headline: 'அட்டகாசம் தலைவா! வேற மாறி பதில்! 🔥',
          subText: 'பாக்ஸ் ஆபீஸ் வசூல் வேட்டை! தரமான சம்பவம்!',
          toast: 'அட்டகாசம் தலைவா! வேற மாறி பதில்! 🔥'
        },
        {
          headline: 'செம்ம மாஸ்! தூள் கிளப்பிட்டீங்க! 💥',
          subText: 'தமிழ் சினிமா தலைவன் நீங்க தான்! அப்ரூவல் கன்ஃபர்ம்!',
          toast: 'செம்ம மாஸ்! தூள் கிளப்பிட்டீங்க! 💥'
        },
        {
          headline: 'மரண வெயிட்டு பதில் தலைவா! ⚡',
          subText: 'நெருப்புடா! திரையரங்கே அதிரும் அதிரடி பதில்!',
          toast: 'மரண வெயிட்டு பதில் தலைவா! ⚡'
        },
        {
          headline: 'நெருப்புடா! சரியான குறி பார்த்தீங்க! 🦁',
          subText: 'உண்மையான சினிமா ரசிகன் நீங்க தான் தலைவா!',
          toast: 'நெருப்புடா! தரமான சம்பவம்! 🦁'
        }
      ];
      const pick = tamilPraises[Math.floor(Math.random() * tamilPraises.length)];
      return {
        lang: 'Tamil',
        icon: '🔥',
        badge: '🔥 தமிழ் திரைப்படம்',
        badgeColor: 'border-[#ff0055] text-[#ff0055] bg-[#ff0055]/15',
        headline: pick.headline,
        subText: pick.subText,
        pointsLabel: `+${points} புள்ளிகள் கிடைத்தன!`,
        answerLabel: 'சரியான திரைப்படம்:',
        nextButtonLabel: 'அடுத்த படம் ➔',
        toast: pick.toast
      };
    } else {
      const tamilErrors = [
        {
          headline: 'தவறான பதில் தலைவா! ஏமாந்துட்டீங்க! ❌',
          subText: 'கவலைப்படாதீங்க! உண்மையான சினிமா ரசிகன் தளர மாட்டான்!',
          toast: 'தவறான பதில்! அடுத்த முறை பாத்துக்கலாம்! ❌'
        },
        {
          headline: 'ஐயோ தவறு! கொஞ்சம் குறி தவறிடுச்சு! ❌',
          subText: 'மீண்டும் முழு வெறியோடு அடுத்த படத்தில் முயற்சி பண்ணுங்க!',
          toast: 'தவறான பதில் தலைவா! ❌'
        }
      ];
      const pick = tamilErrors[Math.floor(Math.random() * tamilErrors.length)];
      return {
        lang: 'Tamil',
        icon: '❌',
        badge: '⚠️ தவறான பதில்',
        badgeColor: 'border-[#ff0055] text-[#ff0055] bg-[#ff0055]/15',
        headline: pick.headline,
        subText: pick.subText,
        pointsLabel: '',
        answerLabel: 'சரியான திரைப்படம்:',
        nextButtonLabel: 'அடுத்த படம் ➔',
        toast: pick.toast
      };
    }
  }

  // 3. MALAYALAM (MOLLYWOOD) - 100% Pure Malayalam
  if (cat.includes('MOLLYWOOD') || cat.includes('MALAYALAM')) {
    if (isCorrect) {
      const malayalamPraises = [
        {
          headline: 'പൊളി സാനം! കിടു ആന്‍സര്‍ അളിയാ! 🔥',
          subText: 'തിയേറ്റർ ഇളക്കിമറിച്ച പക്കാ ക്ലാസിക് മറുപടി!',
          toast: 'പൊളി സാനം അളിയാ! കിടു ആന്‍സര്‍! 🔥'
        },
        {
          headline: 'വേറെ ലെവൽ മച്ചാനെ! തകര്‍ത്തു! 💥',
          subText: 'നിങ്ങളാണ് യഥാർത്ഥ സിനിമാ പ്രേമി! ഒരു രക്ഷയുമില്ല!',
          toast: 'വേറെ ലെവൽ മച്ചാനെ! തകര്‍ത്തു! 💥'
        },
        {
          headline: 'പക്കാ സംഭവം! ഉഗ്രൻ ഉത്തരം! ⚡',
          subText: 'സിനിമയുടെ നാഡിമിടിപ്പ് അറിയുന്ന പക്കാ മാസ്റ്റർ!',
          toast: 'പക്കാ സംഭവം മച്ചാനെ! ⚡'
        }
      ];
      const pick = malayalamPraises[Math.floor(Math.random() * malayalamPraises.length)];
      return {
        lang: 'Malayalam',
        icon: '🌿',
        badge: '🌿 മലയാള സിനിമ',
        badgeColor: 'border-[#39ff14] text-[#39ff14] bg-[#39ff14]/15',
        headline: pick.headline,
        subText: pick.subText,
        pointsLabel: `+${points} പോയിന്റുകൾ ലഭിച്ചു!`,
        answerLabel: 'ശരിയായ സിനിമ:',
        nextButtonLabel: 'അടുത്ത സിനിമ ➔',
        toast: pick.toast
      };
    } else {
      const malayalamErrors = [
        {
          headline: 'തെറ്റായ ഉത്തരം അളിയാ! പിഴച്ചുപോയി! ❌',
          subText: 'സാരമില്ല മച്ചാനെ! അടുത്ത പടത്തിൽ തകർക്കാം!',
          toast: 'തെറ്റായ ഉത്തരം! വീണ്ടും ശ്രമിക്കൂ! ❌'
        },
        {
          headline: 'അയ്യോ തെറ്റിപ്പോയി! ചെറിയൊരു വ്യത്യാസം! ❌',
          subText: 'സിനിമാ പ്രേമികൾ ഒരിക്കലും പിന്മാറില്ല!',
          toast: 'തെറ്റായ ഉത്തരം അളിയാ! ❌'
        }
      ];
      const pick = malayalamErrors[Math.floor(Math.random() * malayalamErrors.length)];
      return {
        lang: 'Malayalam',
        icon: '❌',
        badge: '⚠️ തെറ്റായ ഉത്തരം',
        badgeColor: 'border-[#ff0055] text-[#ff0055] bg-[#ff0055]/15',
        headline: pick.headline,
        subText: pick.subText,
        pointsLabel: '',
        answerLabel: 'ശരിയായ സിനിമ:',
        nextButtonLabel: 'അടുത്ത സിനിമ ➔',
        toast: pick.toast
      };
    }
  }

  // 4. HINDI (BOLLYWOOD) - 100% Pure Hindi
  if (cat.includes('BOLLYWOOD') || cat.includes('HINDI')) {
    if (isCorrect) {
      const hindiPraises = [
        {
          headline: 'एकदम झकास! छा गए गुरु! 🔥',
          subText: 'कड़क जवाब! पूरा पैसा वसूल! असली फिल्मी कीड़ा आप ही हो!',
          toast: 'एकदम झकास जवाब गुरु! 🔥'
        },
        {
          headline: 'सुपरहिट जवाब! दिल खुश कर दिया! 💥',
          subText: 'थिएटर में सीटियां बज गईं! क्या शानदार दिमाग पाया है!',
          toast: 'सुपरहिट जवाब गुरु! 💥'
        },
        {
          headline: 'धमाकेदार निशाना! तालियों की गड़गड़ाहट! ⚡',
          subText: 'सिनेमा का असली सुल्तान हाजिर है!',
          toast: 'धमाकेदार निशाना! ⚡'
        }
      ];
      const pick = hindiPraises[Math.floor(Math.random() * hindiPraises.length)];
      return {
        lang: 'Hindi',
        icon: '🎭',
        badge: '🎭 हिंदी सिनेमा',
        badgeColor: 'border-[#ffe600] text-[#ffe600] bg-[#ffe600]/15',
        headline: pick.headline,
        subText: pick.subText,
        pointsLabel: `+${points} अंक प्राप्त हुए!`,
        answerLabel: 'सही फिल्म:',
        nextButtonLabel: 'अगली फिल्म ➔',
        toast: pick.toast
      };
    } else {
      const hindiErrors = [
        {
          headline: 'गलत जवाब यार! निशाना चूक गया! ❌',
          subText: 'कोई बात नहीं दोस्त! असली सिनेमा लवर कभी हार नहीं मानता!',
          toast: 'गलत जवाब! फिर से कोशिश करो! ❌'
        },
        {
          headline: 'अरे यार! थोड़ा सा गलत हो गया! ❌',
          subText: 'अगली फिल्म में पूरा धमाका करेंगे, हिम्मत मत हारना!',
          toast: 'गलत जवाब दोस्त! ❌'
        }
      ];
      const pick = hindiErrors[Math.floor(Math.random() * hindiErrors.length)];
      return {
        lang: 'Hindi',
        icon: '❌',
        badge: '⚠️ गलत जवाब',
        badgeColor: 'border-[#ff0055] text-[#ff0055] bg-[#ff0055]/15',
        headline: pick.headline,
        subText: pick.subText,
        pointsLabel: '',
        answerLabel: 'सही फिल्म:',
        nextButtonLabel: 'अगली फिल्म ➔',
        toast: pick.toast
      };
    }
  }

  // 5. KANNADA (SANDALWOOD) - 100% Pure Kannada
  if (cat.includes('SANDALWOOD') || cat.includes('KANNADA')) {
    if (isCorrect) {
      const kannadaPraises = [
        {
          headline: 'ಸಖತ್ ಗುರು! ಧೂಳ್ ಎಬ್ಬಿಸಿದ್ರಿ! 🔥',
          subText: 'ಖತರ್ನಾಕ್ ಆನ್ಸರ್ ಬಾಸ್! ಬೆಂಕಿ! ಥಿಯೇಟರ್ ದೂಳೆಬ್ಬಿಸಿದ್ರಿ!',
          toast: 'ಸಖತ್ ಗುರು! ಧೂಳ್ ಎಬ್ಬಿಸಿದ್ರಿ! 🔥'
        },
        {
          headline: 'ಸೂಪರ್ ಗುರು! ಮಾಸ್ ಲೆವೆಲ್ ಗೆಸ್! 💥',
          subText: 'ನಿಜವಾದ ಸಿನಿಮಾ ಪ್ರೇಮಿ ನೀವು ಬಾಸ್! ಜಬರ್ದಸ್ತ್ ಆನ್ಸರ್!',
          toast: 'ಸೂಪರ್ ಗುರು! ಮಾಸ್ ಲೆವೆಲ್! 💥'
        },
        {
          headline: 'ಪಕ್ಕಾ ಆನ್ಸರ್ ಬಾಸ್! ಸಿಂಹದ ಹೆಜ್ಜೆ! ⚡',
          subText: 'ಸ್ಯಾಂಡಲ್‌ವುಡ್ ಬಾಕ್ಸ್ ಆಫೀಸ್ ಧೂಳಿಪಟ!',
          toast: 'ಪಕ್ಕಾ ಆನ್ಸರ್ ಬಾಸ್! ⚡'
        }
      ];
      const pick = kannadaPraises[Math.floor(Math.random() * kannadaPraises.length)];
      return {
        lang: 'Kannada',
        icon: '⛏️',
        badge: '⛏️ ಕನ್ನಡ ಚಿತ್ರರಂಗ',
        badgeColor: 'border-[#bc13fe] text-[#bc13fe] bg-[#bc13fe]/15',
        headline: pick.headline,
        subText: pick.subText,
        pointsLabel: `+${points} ಅಂಕಗಳು ಬಂದಿವೆ!`,
        answerLabel: 'ಸರಿಯಾದ ಚಿತ್ರ:',
        nextButtonLabel: 'ಮುಂದಿನ ಚಿತ್ರ ➔',
        toast: pick.toast
      };
    } else {
      const kannadaErrors = [
        {
          headline: 'ತಪ್ಪು ಉತ್ತರ ಬಾಸ್! ಮಿಸ್ ಆಯ್ತು! ❌',
          subText: 'ಚಿಂತೆ ಬೇಡ ಗುರು! ನಿಜವಾದ ಸಿನಿಮಾ ಪ್ರೇಮಿ ಯಾವತ್ತೂ ಬಿಡಲ್ಲ!',
          toast: 'ತಪ್ಪು ಉತ್ತರ! ಇನ್ನೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ! ❌'
        },
        {
          headline: 'ಅಯ್ಯೋ ತಪ್ಪು! ಸ್ವಲ್ಪದರಲ್ಲೇ ಕೈತಪ್ಪಿತು! ❌',
          subText: 'ಮುಂದಿನ ಸಿನಿಮಾದಲ್ಲಿ ಖಂಡಿತ ಧೂಳೆಬ್ಬಿಸೋಣ!',
          toast: 'ತಪ್ಪು ಉತ್ತರ ಬಾಸ್! ❌'
        }
      ];
      const pick = kannadaErrors[Math.floor(Math.random() * kannadaErrors.length)];
      return {
        lang: 'Kannada',
        icon: '❌',
        badge: '⚠️ ತಪ್ಪು ಉತ್ತರ',
        badgeColor: 'border-[#ff0055] text-[#ff0055] bg-[#ff0055]/15',
        headline: pick.headline,
        subText: pick.subText,
        pointsLabel: '',
        answerLabel: 'ಸರಿಯಾದ ಚಿತ್ರ:',
        nextButtonLabel: 'ಮುಂದಿನ ಚಿತ್ರ ➔',
        toast: pick.toast
      };
    }
  }

  // Fallback (Defaults to Telugu flavor)
  return {
    lang: 'Telugu',
    icon: isCorrect ? '🦁' : '❌',
    badge: isCorrect ? '⚡ భారతీయ సినిమా' : '⚠️ తప్పు సమాధానం',
    badgeColor: isCorrect ? 'border-[#00f3ff] text-[#00f3ff] bg-[#00f3ff]/15' : 'border-[#ff0055] text-[#ff0055] bg-[#ff0055]/15',
    headline: isCorrect ? 'రచ్చ లేపావు మావా! కరెక్ట్ ఆన్సర్! 🔥' : 'తప్పు సమాధానం! మళ్లీ ప్రయత్నించు! ❌',
    subText: isCorrect ? 'సినిమా పిచ్చోడు అంటే నువ్వే బాస్!' : 'పర్లేదు బాస్! నిజమైన సినిమా లవర్ ఎప్పుడూ తగ్గడు!',
    pointsLabel: isCorrect ? `+${points} పాయింట్లు వచ్చాయి!` : '',
    answerLabel: 'సరైన సినిమా:',
    nextButtonLabel: 'తదుపరి బొమ్మ ➔',
    toast: isCorrect ? 'రచ్చ లేపావు మావా! 🔥' : 'తప్పు సమాధానం! ❌'
  };
}

// ==========================================
// 6. MINI-GAME 1: BOMMA (EMOJI MOVIES)
// ==========================================
function CinePixelGame({ stats, recordGameAction, triggerConfetti, showToast, onBack }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialIndustry = (searchParams.get('industry') || 'ALL').toUpperCase();
  const [selectedIndustry, setSelectedIndustryState] = useState(initialIndustry);

  useEffect(() => {
    const q = (searchParams.get('industry') || 'ALL').toUpperCase();
    setSelectedIndustryState(q);
  }, [searchParams]);

  const setSelectedIndustry = (ind) => {
    setSelectedIndustryState(ind);
    const next = new URLSearchParams(searchParams);
    if (ind === 'ALL') {
      next.delete('industry');
    } else {
      next.set('industry', ind);
    }
    setSearchParams(next, { replace: true });
  };
  const [puzzles, setPuzzles] = useState(BUILT_IN_MOVIES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [sessionScore, setSessionScore] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [genre, setGenre] = useState('Pan-Indian Master Riddles (All Industries)');

  // Filter puzzles based on selected industry tab
  const activePuzzles = useMemo(() => {
    if (selectedIndustry === 'ALL') return puzzles;
    return puzzles.filter((p) => (p.category || '').toUpperCase().includes(selectedIndustry));
  }, [puzzles, selectedIndustry]);

  const puzzle = activePuzzles[currentIndex % activePuzzles.length] || activePuzzles[0] || puzzles[0];

  const handleShuffle = () => {
    sfx.coin();
    setPuzzles((prev) => [...prev].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setFeedback(null);
    setSelectedOption(null);
    setShowHint(false);
    showToast('SHUFFLED 74 INDIAN MOVIES!', '🔀');
  };

  const handleGuess = (guess) => {
    if (feedback) return;
    setSelectedOption(guess);
    const isCorrect = guess.toLowerCase().trim() === puzzle.title.toLowerCase().trim();

    if (isCorrect) {
      sfx.win();
      const points = showHint ? 50 : 100;
      const nextScore = sessionScore + points;
      setSessionScore(nextScore);
      const feedbackData = getLanguageFeedback(puzzle.category, true, points);
      setFeedback({ 
        correct: true, 
        answer: puzzle.title, 
        points, 
        data: feedbackData 
      });
      triggerConfetti();
      showToast(feedbackData.toast, feedbackData.icon);
      recordGameAction({
        scoreGain: points,
        boredomDrop: 20,
        incrementStreak: true,
        gameType: 'movie',
        sessionScore: nextScore
      });
    } else {
      sfx.lose();
      const feedbackData = getLanguageFeedback(puzzle.category, false, 0);
      setFeedback({ 
        correct: false, 
        answer: puzzle.title, 
        points: 0, 
        data: feedbackData 
      });
      showToast(feedbackData.toast, feedbackData.icon);
      recordGameAction({
        scoreGain: 10,
        boredomDrop: 6,
        resetStreak: true,
        gameType: 'movie',
        sessionScore
      });
    }
  };

  const nextPuzzle = () => {
    sfx.click();
    setFeedback(null);
    setSelectedOption(null);
    setShowHint(false);
    setCurrentIndex((prev) => prev + 1);
  };

  // Keyboard controls for ultra-smooth arcade experience (1-4 keys + Enter/Space)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (feedback) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
          e.preventDefault();
          nextPuzzle();
        }
        return;
      }
      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (puzzle && puzzle.options && puzzle.options[idx]) {
          e.preventDefault();
          handleGuess(puzzle.options[idx]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [feedback, puzzle]);

  const generateAiMovies = async () => {
    sfx.click();
    setAiLoading(true);
    try {
      const schema = {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            emojis: { type: "STRING" },
            title: { type: "STRING" },
            category: { type: "STRING" },
            difficulty: { type: "STRING" },
            hint: { type: "STRING" },
            options: { type: "ARRAY", items: { type: "STRING" } }
          },
          propertyOrdering: ["emojis", "title", "category", "difficulty", "hint", "options"]
        }
      };
      const sys = "You are an elite Indian Cinema quizmaster and cryptic puzzle designer for a retro arcade machine. You ONLY generate riddles for Indian movies across Tollywood, Bollywood, Kollywood, Mollywood, and Sandalwood. Riddles MUST be DIFFICULT and CRYPTIC, encoding pivotal plot twists, symbolic scene metaphors, obscure character props, or philosophic themes into 4-5 emojis. NEVER use literal or obvious title translations. Provide 4 very close, plausible options from the same industry/genre to make guessing genuinely challenging, plus a clever cryptic hint.";
      const prompt = `Generate 4 difficult, cryptic Indian cinema movie riddles for the industry/theme: "${genre}". Ensure options are confusing and from the same cinematic landscape.`;

      const aiData = await fetchGeminiStructured(sys, prompt, schema);
      if (Array.isArray(aiData) && aiData.length > 0) {
        setPuzzles((prev) => [...prev.slice(0, currentIndex + 1), ...aiData, ...prev.slice(currentIndex + 1)]);
        setFeedback(null);
        setShowHint(false);
        setCurrentIndex((i) => i + 1);
        sfx.levelUp();
        showToast('AI LOADED 4 CRYPTIC INDIAN CINEMA PUZZLES!', '🇮🇳');
      }
    } catch {
      showToast('Offline Mode: Switched to next Indian cinema puzzle!', '🎞️');
      nextPuzzle();
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Top Controls & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button onClick={() => { sfx.click(); onBack(); }} className="arcade-btn arcade-btn-dark text-[10px]">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>RETURN TO CABINET</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="pixel-badge pixel-badge-yellow">SESSION: {sessionScore} PTS</span>
          <span className="pixel-badge pixel-badge-cyan">74 MOVIES LOADED</span>
        </div>
      </div>

      {/* Quick Industry Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {[
          { id: 'ALL', label: `ALL (${puzzles.length})` },
          { id: 'TOLLYWOOD', label: `TOLLYWOOD (${puzzles.filter(p => (p.category || '').includes('TOLLYWOOD')).length})` },
          { id: 'KOLLYWOOD', label: `KOLLYWOOD (${puzzles.filter(p => (p.category || '').includes('KOLLYWOOD')).length})` },
          { id: 'MOLLYWOOD', label: `MOLLYWOOD (${puzzles.filter(p => (p.category || '').includes('MOLLYWOOD')).length})` },
          { id: 'BOLLYWOOD', label: `BOLLYWOOD (${puzzles.filter(p => (p.category || '').includes('BOLLYWOOD')).length})` },
          { id: 'SANDALWOOD', label: `SANDALWOOD (${puzzles.filter(p => (p.category || '').includes('SANDALWOOD')).length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              sfx.click();
              setSelectedIndustry(tab.id);
              setCurrentIndex(0);
              setFeedback(null);
              setShowHint(false);
            }}
            className={`px-3 py-1.5 rounded text-[9px] font-pixel transition-all cursor-pointer whitespace-nowrap ${
              selectedIndustry === tab.id
                ? 'bg-[#ffe600] text-black font-black shadow-[0_0_10px_#ffe600]'
                : 'bg-[#121226] text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <button
          onClick={handleShuffle}
          className="px-3 py-1.5 rounded text-[9px] font-pixel bg-[#bc13fe]/20 border border-[#bc13fe] text-[#bc13fe] hover:bg-[#bc13fe] hover:text-white transition-all cursor-pointer whitespace-nowrap ml-auto"
          title="Shuffle Movie Deck"
        >
          🔀 SHUFFLE
        </button>
      </div>

      <div className="arcade-card p-6 sm:p-8 border-4 border-[#ffe600] text-center shadow-[0_0_25px_rgba(255,230,0,0.25)]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <span className="pixel-badge pixel-badge-pink">{puzzle.category}</span>
          <span className="pixel-badge pixel-badge-yellow">DIFFICULTY: {puzzle.difficulty || 'EXPERT'}</span>
          <span className="font-pixel text-[10px] text-slate-400">
            STAGE {(currentIndex % activePuzzles.length) + 1}/{activePuzzles.length}
          </span>
        </div>

        {/* Big Retro Emoji Stage */}
        <div className="my-6 py-8 px-4 rounded-lg bg-[#06060f] border-2 border-[#2b2b4d] shadow-inner">
          <div className="text-6xl sm:text-7xl tracking-widest select-none filter drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
            {puzzle.emojis}
          </div>
          <p className="font-crt text-xl text-[#00f3ff] mt-4 tracking-wider">
            DECODE THE CRYPTIC INDIAN CINEMA SCENARIO
          </p>
          <p className="font-pixel text-[9px] text-amber-400/80 mt-1">
            * Riddles encode pivotal plot twists & symbolic motifs (Not literal titles!)
          </p>
        </div>

        {/* Clue Revealer */}
        <div className="mb-6">
          {!showHint ? (
            <button
              onClick={() => { sfx.click(); setShowHint(true); }}
              className="arcade-btn arcade-btn-dark text-[10px]"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>INSERT COIN FOR CRYPTIC CLUE (-50 PTS PENALTY)</span>
            </button>
          ) : (
            <div className="bg-[#101026] border-2 border-amber-400/50 p-4 rounded font-crt text-xl text-amber-300 text-left">
              💡 <strong>CRYPTIC PLOT CLUE:</strong> {puzzle.hint}
            </div>
          )}
        </div>

        {/* 4 Arcade Push Buttons - Stays solid and stable (no clumsy layout jumping) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
          {puzzle.options.map((opt, idx) => {
            const isChosen = selectedOption === opt;
            const isCorrectAnswer = opt.toLowerCase().trim() === puzzle.title.toLowerCase().trim();

            let btnVariant = 'arcade-btn-dark hover:border-[#00f3ff] hover:text-[#00f3ff]';
            let numColor = 'text-[#00f3ff]';
            let IconComponent = ChevronRight;
            let iconColor = 'text-slate-500 group-hover:text-[#00f3ff]';

            if (feedback) {
              if (isCorrectAnswer) {
                btnVariant = 'bg-[#062914] border-[#39ff14] text-[#39ff14] shadow-[0_0_18px_rgba(57,255,20,0.45)] ring-1 ring-[#39ff14]';
                numColor = 'text-[#39ff14]';
                IconComponent = CheckCircle2;
                iconColor = 'text-[#39ff14]';
              } else if (isChosen && !feedback.correct) {
                btnVariant = 'bg-[#2b0612] border-[#ff0055] text-[#ff0055] shadow-[0_0_18px_rgba(255,0,85,0.45)] ring-1 ring-[#ff0055]';
                numColor = 'text-[#ff0055]';
                IconComponent = XCircle;
                iconColor = 'text-[#ff0055]';
              } else {
                btnVariant = 'bg-[#080814] border-slate-800 text-slate-500 opacity-35';
                numColor = 'text-slate-600';
                IconComponent = null;
              }
            }

            return (
              <button
                key={idx}
                disabled={!!feedback}
                onClick={() => handleGuess(opt)}
                className={`arcade-btn p-4 text-left justify-start font-pixel text-[11px] group transition-all duration-200 ${btnVariant} ${
                  feedback ? 'cursor-default' : 'cursor-pointer hover:scale-[1.01]'
                }`}
              >
                <span className={`mr-2.5 font-bold ${numColor}`}>[{idx + 1}]</span>
                <span className="flex-1 truncate">{opt}</span>
                {IconComponent && <IconComponent className={`w-4 h-4 shrink-0 transition-transform ${iconColor}`} />}
              </button>
            );
          })}
        </div>

        {/* Native Regional Feedback Drawer - Zero English */}
        {feedback && (
          <div className={`p-5 rounded-xl border-2 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
            feedback.correct 
              ? 'bg-[#062414]/95 border-[#39ff14] text-[#39ff14] shadow-[0_0_30px_rgba(57,255,20,0.3)]' 
              : 'bg-[#260610]/95 border-[#ff0055] text-[#ff0055] shadow-[0_0_30px_rgba(255,0,85,0.3)]'
          }`}>
            <div className="flex items-start gap-3.5 text-left w-full sm:w-auto flex-1">
              {feedback.correct ? (
                <div className="w-12 h-12 rounded-lg bg-[#39ff14]/20 border-2 border-[#39ff14] flex items-center justify-center shrink-0 shadow-[0_0_12px_#39ff14]">
                  <CheckCircle2 className="w-7 h-7 text-[#39ff14]" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-[#ff0055]/20 border-2 border-[#ff0055] flex items-center justify-center shrink-0 shadow-[0_0_12px_#ff0055]">
                  <XCircle className="w-7 h-7 text-[#ff0055]" />
                </div>
              )}

              <div className="space-y-2 flex-1">
                {feedback.data && (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-1 rounded text-[11px] font-black border ${feedback.data.badgeColor}`}>
                        {feedback.data.badge}
                      </span>
                      {feedback.correct && feedback.data.pointsLabel && (
                        <span className="text-xs font-black text-[#ffe600] neon-text-yellow">
                          {feedback.data.pointsLabel}
                        </span>
                      )}
                    </div>

                    {/* Prominent Native Language Script Header (Telugu/Tamil/Malayalam/Hindi/Kannada) */}
                    <div 
                      className={`text-xl sm:text-2xl font-black tracking-wide leading-tight ${
                        feedback.correct ? 'text-[#ffe600] filter drop-shadow-[0_0_10px_rgba(255,230,0,0.6)]' : 'text-[#ff0055] filter drop-shadow-[0_0_10px_rgba(255,0,85,0.6)]'
                      }`}
                      style={{ fontFamily: "'Noto Sans Telugu', 'Noto Sans Tamil', 'Noto Sans Malayalam', 'Noto Sans Devanagari', 'Noto Sans Kannada', sans-serif" }}
                    >
                      {feedback.data.headline}
                    </div>

                    {/* Native Dialogue / Punchline in Native Script */}
                    <div 
                      className="text-base sm:text-lg text-slate-200 leading-snug italic"
                      style={{ fontFamily: "'Noto Sans Telugu', 'Noto Sans Tamil', 'Noto Sans Malayalam', 'Noto Sans Devanagari', 'Noto Sans Kannada', sans-serif" }}
                    >
                      "{feedback.data.subText}"
                    </div>

                    {/* Film Title Label in Native Script */}
                    <div 
                      className="text-base text-slate-300 pt-1"
                      style={{ fontFamily: "'Noto Sans Telugu', 'Noto Sans Tamil', 'Noto Sans Malayalam', 'Noto Sans Devanagari', 'Noto Sans Kannada', sans-serif" }}
                    >
                      {feedback.data.answerLabel}{' '}
                      <span className="text-white font-black underline decoration-[#00f3ff] decoration-2">
                        {feedback.answer}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <button onClick={nextPuzzle} className="arcade-btn arcade-btn-yellow text-xs shrink-0 w-full sm:w-auto px-5 py-3 font-black shadow-[0_0_15px_rgba(255,230,0,0.4)]">
              {feedback.data?.nextButtonLabel || 'తదుపరి బొమ్మ ➔'}
            </button>
          </div>
        )}
      </div>

      {/* Endless AI Generator Bar */}
      <div className="arcade-card p-4 border-2 border-[#bc13fe] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#bc13fe]" />
          <span className="font-pixel text-[10px] text-white">AI INDIAN CINEMA SYNTH:</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="arcade-input text-xs py-1.5 px-3 flex-1 sm:flex-none"
          >
            <option value="Pan-Indian Master Riddles (All Industries)">🇮🇳 All Indian Industries (Hard)</option>
            <option value="Tollywood (Telugu Cult & Blockbusters)">💥 Tollywood (Telugu)</option>
            <option value="Bollywood (Hindi Neo-Noir, Crime & Drama)">🎭 Bollywood (Hindi)</option>
            <option value="Kollywood (Tamil Gritty Action & Epics)">⚔️ Kollywood (Tamil)</option>
            <option value="Mollywood (Malayalam Realism & Folk Horror)">🌿 Mollywood (Malayalam)</option>
            <option value="Sandalwood (Kannada Epics & Folklore)">⛏️ Sandalwood (Kannada)</option>
          </select>
          <button
            onClick={generateAiMovies}
            disabled={aiLoading}
            className="arcade-btn arcade-btn-primary text-[10px] shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
            <span>{aiLoading ? 'SUMMONING...' : 'GENERATE AI RIDDLES'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 7. MINI-GAME 2: TURBO TRIVIA 10S
// ==========================================
function TurboTriviaGame({ stats, recordGameAction, triggerConfetti, showToast, onBack }) {
  const [questions, setQuestions] = useState(BUILT_IN_TRIVIA);
  const [qIndex, setQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [selected, setSelected] = useState(null);
  const [sessionScore, setSessionScore] = useState(0);
  const [localCombo, setLocalCombo] = useState(0);
  const [aiTopic, setAiTopic] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const currentQ = questions[qIndex % questions.length];

  // 10s Timer
  useEffect(() => {
    if (selected !== null || aiLoading) return;
    if (timeLeft <= 0) {
      sfx.lose();
      setSelected('__TIMEOUT__');
      setLocalCombo(0);
      recordGameAction({ scoreGain: 0, boredomDrop: 5, resetStreak: true, gameType: 'trivia', sessionScore });
      return;
    }
    const timer = setTimeout(() => {
      setTimeLeft((t) => +(t - 0.1).toFixed(1));
    }, 100);
    return () => clearTimeout(timer);
  }, [timeLeft, selected, aiLoading]);

  const handleSelectOption = (opt) => {
    if (selected !== null) return;
    setSelected(opt);
    const isCorrect = opt === currentQ.answer;

    if (isCorrect) {
      sfx.win();
      const newCombo = localCombo + 1;
      setLocalCombo(newCombo);
      const speedBonus = Math.round(timeLeft * 6);
      const multiplier = Math.min(3, 1 + newCombo * 0.3);
      const earned = Math.round((50 + speedBonus) * multiplier);
      const nextScore = sessionScore + earned;
      setSessionScore(nextScore);
      triggerConfetti();
      recordGameAction({
        scoreGain: earned,
        boredomDrop: 18,
        incrementStreak: true,
        gameType: 'trivia',
        sessionScore: nextScore
      });
    } else {
      sfx.lose();
      setLocalCombo(0);
      recordGameAction({
        scoreGain: 5,
        boredomDrop: 5,
        resetStreak: true,
        gameType: 'trivia',
        sessionScore
      });
    }
  };

  const handleNext = () => {
    sfx.click();
    setSelected(null);
    setTimeLeft(10);
    setQIndex((i) => i + 1);
  };

  // Keyboard controls for rapid gameplay (1-4 keys + Enter/Space)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (selected !== null) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
          e.preventDefault();
          handleNext();
        }
        return;
      }
      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (currentQ && currentQ.options && currentQ.options[idx]) {
          e.preventDefault();
          handleSelectOption(currentQ.options[idx]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, currentQ]);

  const generateAiTrivia = async (e) => {
    if (e) e.preventDefault();
    sfx.click();
    setAiLoading(true);
    try {
      const topic = aiTopic.trim() || "80s Arcade Games & Weird Facts";
      const schema = {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            q: { type: "STRING" },
            options: { type: "ARRAY", items: { type: "STRING" } },
            answer: { type: "STRING" },
            category: { type: "STRING" }
          },
          propertyOrdering: ["q", "options", "answer", "category"]
        }
      };
      const sys = "You are a fast-paced retro arcade trivia host. Generate 4 clever trivia questions with 4 options each.";
      const prompt = `Generate 4 rapid trivia questions about: "${topic}".`;

      const pack = await fetchGeminiStructured(sys, prompt, schema);
      if (Array.isArray(pack) && pack.length > 0) {
        setQuestions((prev) => [...prev.slice(0, qIndex + 1), ...pack, ...prev.slice(qIndex + 1)]);
        setSelected(null);
        setTimeLeft(10);
        setQIndex((i) => i + 1);
        setAiTopic('');
        sfx.levelUp();
        showToast(`AI LOADED TRIVIA ON "${topic.toUpperCase()}"!`, '⚡');
      }
    } catch {
      showToast('Loaded next built-in question!', '⚡');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => { sfx.click(); onBack(); }} className="arcade-btn arcade-btn-dark text-[10px]">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>RETURN TO CABINET</span>
        </button>
        <div className="flex gap-2">
          <span className="pixel-badge pixel-badge-cyan">SCORE: {sessionScore}</span>
          <span className="pixel-badge pixel-badge-pink">COMBO: {localCombo}x</span>
        </div>
      </div>

      <div className="arcade-card p-6 sm:p-8 border-4 border-[#00f3ff] shadow-[0_0_25px_rgba(0,243,255,0.25)]">
        {/* Countdown Timer Gauge */}
        <div className="mb-6">
          <div className="flex items-center justify-between font-pixel text-xs mb-2">
            <span className="pixel-badge pixel-badge-yellow">{currentQ.category}</span>
            <span className={`flex items-center gap-1 font-mono text-base ${timeLeft <= 3 ? 'text-rose-500 animate-ping' : 'text-[#00f3ff]'}`}>
              <Clock className="w-4 h-4" />
              {timeLeft.toFixed(1)}S
            </span>
          </div>

          <div className="w-full h-3 bg-[#080814] border border-[#202040] rounded overflow-hidden">
            <div
              className={`h-full transition-all duration-100 ${
                timeLeft > 5 ? 'bg-[#00f3ff]' : timeLeft > 2.5 ? 'bg-[#ffe600]' : 'bg-[#ff0055]'
              }`}
              style={{ width: `${(timeLeft / 10) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Text */}
        <h2 className="font-pixel text-sm sm:text-lg text-white leading-relaxed mb-6">
          {currentQ.q}
        </h2>

        {/* Choices */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
          {currentQ.options.map((opt, idx) => {
            const isCorrect = opt === currentQ.answer;
            const isChosen = selected === opt;

            let btnClass = 'arcade-btn-dark';
            if (selected !== null) {
              if (isCorrect) btnClass = 'arcade-btn-cyan text-black';
              else if (isChosen) btnClass = 'arcade-btn-primary';
            }

            return (
              <button
                key={idx}
                disabled={selected !== null}
                onClick={() => handleSelectOption(opt)}
                className={`arcade-btn ${btnClass} p-4 text-left justify-start font-pixel text-[11px] group`}
              >
                <span className="mr-2">[{idx + 1}]</span>
                <span className="flex-1 truncate">{opt}</span>
              </button>
            );
          })}
        </div>

        {selected !== null && (
          <div className="pt-4 border-t-2 border-[#1a1a36] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="font-pixel text-[10px]">
              {selected === '__TIMEOUT__' ? (
                <span className="text-rose-500">TIME OVER! ANSWER: {currentQ.answer}</span>
              ) : selected === currentQ.answer ? (
                <span className="text-[#39ff14]">TURBO SPEED BONUS AWARDED!</span>
              ) : (
                <span className="text-rose-500">INCORRECT! ANSWER: {currentQ.answer}</span>
              )}
            </div>
            <button onClick={handleNext} className="arcade-btn arcade-btn-cyan text-[10px]">
              NEXT QUESTION →
            </button>
          </div>
        )}
      </div>

      {/* AI Topic Prompt */}
      <form onSubmit={generateAiTrivia} className="arcade-card p-4 border-2 border-slate-700 flex gap-2">
        <input
          type="text"
          value={aiTopic}
          onChange={(e) => setAiTopic(e.target.value)}
          placeholder="Enter custom AI topic (e.g. 90s Gaming, Anime, Space...)"
          className="arcade-input flex-1 text-sm"
        />
        <button type="submit" disabled={aiLoading} className="arcade-btn arcade-btn-yellow text-[10px] shrink-0">
          <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
          <span>{aiLoading ? 'GENERATING...' : 'GENERATE AI TRIVIA'}</span>
        </button>
      </form>
    </div>
  );
}

// ==========================================
// 8. MINI-GAME 3: REFLEX & MEMORY MATRIX
// ==========================================
function ReflexMatrixGame({ stats, recordGameAction, triggerConfetti, showToast, onBack }) {
  const [mode, setMode] = useState('whack'); // 'whack' | 'memory'

  // Whack-a-Spark States
  const [whackRunning, setWhackRunning] = useState(false);
  const [activeTile, setActiveTile] = useState(null);
  const [spawnTimestamp, setSpawnTimestamp] = useState(0);
  const [reactionLog, setReactionLog] = useState([]);
  const [whackScore, setWhackScore] = useState(0);
  const [whackTimer, setWhackTimer] = useState(15);

  // Memory Sequence States
  const [memSeq, setMemSeq] = useState([]);
  const [userStep, setUserStep] = useState(0);
  const [litTile, setLitTile] = useState(null);
  const [memPhase, setMemPhase] = useState('idle'); // 'idle' | 'showing' | 'playing' | 'gameover'
  const [memLevel, setMemLevel] = useState(1);

  // Whack Timer
  useEffect(() => {
    if (!whackRunning) return;
    if (whackTimer <= 0) {
      setWhackRunning(false);
      setActiveTile(null);
      sfx.win();
      triggerConfetti();
      recordGameAction({
        scoreGain: Math.max(30, Math.round(whackScore / 2)),
        boredomDrop: 20,
        incrementStreak: true,
        gameType: 'reflex',
        sessionScore: whackScore
      });
      showToast(`REFLEX STAGE CLEAR! ${whackScore} PTS`, '⚡');
      return;
    }
    const t = setTimeout(() => setWhackTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [whackRunning, whackTimer]);

  const spawnSpark = () => {
    const next = Math.floor(Math.random() * 16);
    setActiveTile(next);
    setSpawnTimestamp(performance.now());
  };

  const startWhack = () => {
    sfx.coin();
    setWhackScore(0);
    setReactionLog([]);
    setWhackTimer(15);
    setWhackRunning(true);
    spawnSpark();
  };

  const handleHitTile = (idx) => {
    if (!whackRunning) return;
    if (idx === activeTile) {
      const ms = Math.max(80, Math.round(performance.now() - spawnTimestamp));
      sfx.tileBeep(idx);
      setReactionLog((prev) => [...prev, ms]);
      const pts = Math.max(25, Math.round(550 - ms * 0.6));
      setWhackScore((s) => s + pts);
      spawnSpark();
    } else {
      sfx.lose();
      setWhackScore((s) => Math.max(0, s - 30));
    }
  };

  const avgReaction = useMemo(() => {
    if (reactionLog.length === 0) return null;
    return Math.round(reactionLog.reduce((a, b) => a + b, 0) / reactionLog.length);
  }, [reactionLog]);

  // Memory Game
  const showSequence = async (seq) => {
    setMemPhase('showing');
    await new Promise((r) => setTimeout(r, 400));
    for (let i = 0; i < seq.length; i++) {
      setLitTile(seq[i]);
      sfx.tileBeep(seq[i]);
      await new Promise((r) => setTimeout(r, 400));
      setLitTile(null);
      await new Promise((r) => setTimeout(r, 160));
    }
    setUserStep(0);
    setMemPhase('playing');
  };

  const startMemory = () => {
    sfx.coin();
    const first = Math.floor(Math.random() * 9);
    setMemSeq([first]);
    setMemLevel(1);
    showSequence([first]);
  };

  const handleMemPadClick = (idx) => {
    if (memPhase !== 'playing') return;
    sfx.tileBeep(idx);
    setLitTile(idx);
    setTimeout(() => setLitTile(null), 180);

    if (idx === memSeq[userStep]) {
      const nextStep = userStep + 1;
      if (nextStep === memSeq.length) {
        sfx.win();
        const nextLevel = memLevel + 1;
        setMemLevel(nextLevel);
        recordGameAction({
          scoreGain: 40,
          boredomDrop: 15,
          incrementStreak: true,
          gameType: 'reflex',
          sessionScore: memSeq.length * 100
        });
        const nextSeq = [...memSeq, Math.floor(Math.random() * 9)];
        setMemSeq(nextSeq);
        setTimeout(() => showSequence(nextSeq), 500);
      } else {
        setUserStep(nextStep);
      }
    } else {
      sfx.lose();
      setMemPhase('gameover');
      recordGameAction({
        scoreGain: 10,
        boredomDrop: 5,
        resetStreak: true,
        gameType: 'reflex',
        sessionScore: (memLevel - 1) * 100
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => { sfx.click(); onBack(); }} className="arcade-btn arcade-btn-dark text-[10px]">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>RETURN TO CABINET</span>
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => { sfx.click(); setMode('whack'); setWhackRunning(false); }}
            className={`arcade-btn text-[10px] ${mode === 'whack' ? 'arcade-btn-cyan' : 'arcade-btn-dark'}`}
          >
            ⚡ 15S WHACK-A-SPARK
          </button>
          <button
            onClick={() => { sfx.click(); setMode('memory'); setWhackRunning(false); }}
            className={`arcade-btn text-[10px] ${mode === 'memory' ? 'arcade-btn-primary' : 'arcade-btn-dark'}`}
          >
            🧠 MATRIX SIMON RECALL
          </button>
        </div>
      </div>

      {mode === 'whack' ? (
        <div className="arcade-card p-6 sm:p-8 border-4 border-[#39ff14] text-center space-y-6 shadow-[0_0_25px_rgba(57,255,20,0.25)]">
          <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
            <div className="text-left">
              <h2 className="font-pixel text-sm text-white">WHACK-A-SPARK REFLEX TEST</h2>
              <p className="font-crt text-lg text-slate-400">SMASH THE NEON TILES BEFORE THEY EXPIRE!</p>
            </div>
            <div className="flex gap-2 font-pixel text-xs">
              <span className="pixel-badge pixel-badge-cyan">AVG: {avgReaction ? `${avgReaction}ms` : '--'}</span>
              <span className="pixel-badge pixel-badge-yellow">SCORE: {whackScore}</span>
              <span className="pixel-badge pixel-badge-pink">TIME: {whackTimer}S</span>
            </div>
          </div>

          {/* 4x4 Grid */}
          <div className="grid grid-cols-4 gap-3 max-w-xs mx-auto aspect-square">
            {Array.from({ length: 16 }).map((_, idx) => {
              const isTarget = whackRunning && activeTile === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleHitTile(idx)}
                  className={`rounded border-2 transition-all duration-75 flex items-center justify-center cursor-pointer select-none ${
                    isTarget
                      ? 'bg-[#39ff14] border-white shadow-[0_0_20px_#39ff14] scale-105'
                      : 'bg-[#090918] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isTarget && <Zap className="w-7 h-7 text-black animate-bounce" />}
                </button>
              );
            })}
          </div>

          {!whackRunning && (
            <button onClick={startWhack} className="arcade-btn arcade-btn-yellow">
              <Play className="w-4 h-4" />
              <span>{whackScore > 0 ? 'REPLAY 15S BLITZ' : 'START REFLEX TEST'}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="arcade-card p-6 sm:p-8 border-4 border-[#bc13fe] text-center space-y-6 shadow-[0_0_25px_rgba(188,19,254,0.25)]">
          <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
            <div className="text-left">
              <h2 className="font-pixel text-sm text-white">MATRIX SIMON MEMORY</h2>
              <p className="font-crt text-lg text-slate-400">MEMORIZE AND REPEAT THE TILE PATTERN SEQUENCE</p>
            </div>
            <span className="pixel-badge pixel-badge-pink">LEVEL {memLevel}</span>
          </div>

          <div className="font-pixel text-xs text-amber-400">
            {memPhase === 'idle' && 'PRESS START TO ENGAGE MEMORY MATRIX'}
            {memPhase === 'showing' && '👀 WATCHING NEON SEQUENCE...'}
            {memPhase === 'playing' && `👉 REPEAT TILE ${userStep + 1} OF ${memSeq.length}`}
            {memPhase === 'gameover' && '💥 SEQUENCE BROKEN! RETRY?'}
          </div>

          {/* 3x3 Memory Grid */}
          <div className="grid grid-cols-3 gap-3.5 max-w-xs mx-auto aspect-square">
            {Array.from({ length: 9 }).map((_, idx) => {
              const isLit = litTile === idx;
              return (
                <button
                  key={idx}
                  disabled={memPhase !== 'playing'}
                  onClick={() => handleMemPadClick(idx)}
                  className={`rounded-lg border-2 transition-all duration-150 cursor-pointer ${
                    isLit
                      ? 'bg-[#bc13fe] border-white shadow-[0_0_25px_#bc13fe] scale-105'
                      : 'bg-[#090918] border-slate-800 hover:border-[#bc13fe]/50'
                  }`}
                />
              );
            })}
          </div>

          {(memPhase === 'idle' || memPhase === 'gameover') && (
            <button onClick={startMemory} className="arcade-btn arcade-btn-primary">
              <Play className="w-4 h-4" />
              <span>{memPhase === 'gameover' ? 'RETRY SEQUENCE' : 'START MATRIX'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 9. MINI-GAME 4: VERSUS DUEL DILEMMA
// ==========================================
function VersusDilemmaGame({ stats, recordGameAction, showToast, onBack }) {
  const [dilemmas, setDilemmas] = useState(BUILT_IN_DILEMMAS);
  const [dIndex, setDIndex] = useState(0);
  const [voted, setVoted] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [theme, setTheme] = useState('Absurd Gaming Dilemmas');

  const currentD = dilemmas[dIndex % dilemmas.length];

  const handleVote = (choice) => {
    if (voted) return;
    sfx.coin();
    setVoted(choice);
    recordGameAction({
      scoreGain: 35,
      boredomDrop: 15,
      incrementStreak: true,
      gameType: 'dilemma'
    });
  };

  const nextDilemma = () => {
    sfx.click();
    setVoted(null);
    setDIndex((i) => i + 1);
  };

  const generateAiDilemmas = async () => {
    sfx.click();
    setAiLoading(true);
    try {
      const schema = {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            optionA: { type: "STRING" },
            optionB: { type: "STRING" },
            votesA: { type: "INTEGER" },
            votesB: { type: "INTEGER" },
            tag: { type: "STRING" }
          },
          propertyOrdering: ["optionA", "optionB", "votesA", "votesB", "tag"]
        }
      };
      const sys = "You are an arcade fight announcer creating hilarious 'Would You Rather' face-off dilemmas.";
      const prompt = `Generate 4 hilarious dilemmas with theme: "${theme}".`;

      const res = await fetchGeminiStructured(sys, prompt, schema);
      if (Array.isArray(res) && res.length > 0) {
        setDilemmas((prev) => [...prev.slice(0, dIndex + 1), ...res, ...prev.slice(dIndex + 1)]);
        setVoted(null);
        setDIndex((i) => i + 1);
        sfx.levelUp();
        showToast('AI SYNTHESIZED 4 VERSUS DILEMMAS!', '🥊');
      }
    } catch {
      nextDilemma();
    } finally {
      setAiLoading(false);
    }
  };

  const totalVotes = (currentD.votesA || 500) + (currentD.votesB || 500) + (voted ? 1 : 0);
  const pctA = Math.round((((currentD.votesA || 500) + (voted === 'A' ? 1 : 0)) / totalVotes) * 100);
  const pctB = 100 - pctA;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => { sfx.click(); onBack(); }} className="arcade-btn arcade-btn-dark text-[10px]">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>RETURN TO CABINET</span>
        </button>
        <span className="pixel-badge pixel-badge-pink">DUELS VOTED: {stats.dilemmasVoted || 0}</span>
      </div>

      <div className="arcade-card p-6 sm:p-8 border-4 border-[#ff0055] space-y-6 shadow-[0_0_25px_rgba(255,0,85,0.25)]">
        <div className="text-center space-y-2">
          <span className="pixel-badge pixel-badge-yellow">{currentD.tag}</span>
          <h2 className="font-pixel text-lg sm:text-2xl text-white">ROUND {dIndex + 1}: WOULD YOU RATHER...</h2>
        </div>

        {/* Versus Split Duel Arena */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative">
          {/* Corner A (Red/Pink Fighter) */}
          <button
            onClick={() => handleVote('A')}
            disabled={voted !== null}
            className={`p-6 rounded-lg border-2 text-left flex flex-col justify-between min-h-[220px] transition-all cursor-pointer ${
              voted === 'A'
                ? 'bg-[#2a0614] border-[#ff0055] shadow-[0_0_20px_#ff0055]'
                : 'bg-[#090918] border-slate-800 hover:border-[#ff0055]'
            }`}
          >
            <div>
              <span className="pixel-badge pixel-badge-pink mb-3">PLAYER 1 (CORNER A)</span>
              <p className="font-crt text-2xl text-white leading-normal mt-2">
                {currentD.optionA}
              </p>
            </div>

            {voted && (
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-1">
                <div className="flex justify-between font-pixel text-xs text-[#ff0055]">
                  <span>{pctA}% COMMITTED</span>
                  <span>{(currentD.votesA + (voted === 'A' ? 1 : 0)).toLocaleString()} VOTES</span>
                </div>
                <div className="w-full h-3 bg-[#080814] rounded overflow-hidden">
                  <div className="h-full bg-[#ff0055] transition-all duration-700" style={{ width: `${pctA}%` }} />
                </div>
              </div>
            )}
          </button>

          {/* Corner B (Cyan Fighter) */}
          <button
            onClick={() => handleVote('B')}
            disabled={voted !== null}
            className={`p-6 rounded-lg border-2 text-left flex flex-col justify-between min-h-[220px] transition-all cursor-pointer ${
              voted === 'B'
                ? 'bg-[#062028] border-[#00f3ff] shadow-[0_0_20px_#00f3ff]'
                : 'bg-[#090918] border-slate-800 hover:border-[#00f3ff]'
            }`}
          >
            <div>
              <span className="pixel-badge pixel-badge-cyan mb-3">PLAYER 2 (CORNER B)</span>
              <p className="font-crt text-2xl text-white leading-normal mt-2">
                {currentD.optionB}
              </p>
            </div>

            {voted && (
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-1">
                <div className="flex justify-between font-pixel text-xs text-[#00f3ff]">
                  <span>{pctB}% COMMITTED</span>
                  <span>{(currentD.votesB + (voted === 'B' ? 1 : 0)).toLocaleString()} VOTES</span>
                </div>
                <div className="w-full h-3 bg-[#080814] rounded overflow-hidden">
                  <div className="h-full bg-[#00f3ff] transition-all duration-700" style={{ width: `${pctB}%` }} />
                </div>
              </div>
            )}
          </button>
        </div>

        {voted && (
          <div className="flex justify-center pt-2">
            <button onClick={nextDilemma} className="arcade-btn arcade-btn-yellow">
              NEXT ABSURD DUEL →
            </button>
          </div>
        )}
      </div>

      {/* AI Scenario Synth */}
      <div className="arcade-card p-4 border-2 border-[#ff0055] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="font-pixel text-[10px] text-white">AI DILEMMA GENERATOR:</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="arcade-input text-sm py-1.5 px-3 flex-1 sm:flex-none"
          >
            <option value="Absurd Gaming Dilemmas">Absurd Gaming Dilemmas</option>
            <option value="Useless Superpowers">Useless Superpowers</option>
            <option value="Mild Daily Annoyances">Mild Annoyances</option>
            <option value="Sci-Fi & Time Travel Paradoxes">Time Travel Paradoxes</option>
          </select>
          <button
            onClick={generateAiDilemmas}
            disabled={aiLoading}
            className="arcade-btn arcade-btn-primary text-[10px] shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
            <span>{aiLoading ? 'SYNTHESIZING...' : 'SUMMON AI DUELS'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 10. ARCADE HALL OF FAME & HIGH SCORE BOARD
// ==========================================
function HallOfFameView({ stats, onSelectGame }) {
  const mergedLeaderboard = useMemo(() => {
    const list = [...DEFAULT_LEADERBOARD];
    // Insert user into board
    const userEntry = {
      tag: stats.tag || 'YOU',
      nickname: 'You (Challenger)',
      score: stats.score || 0,
      streak: stats.bestStreak || 0,
      badges: (stats.badges || []).length,
      isMe: true
    };
    list.push(userEntry);
    list.sort((a, b) => b.score - a.score);
    return list.slice(0, 10);
  }, [stats]);

  return (
    <div className="space-y-6">
      <div className="arcade-card p-6 border-4 border-[#ffe600] text-center shadow-[0_0_30px_rgba(255,230,0,0.3)]">
        <h2 className="font-pixel text-lg sm:text-2xl text-white neon-text-yellow mb-2">
          🏆 ALL-TIME ARCADE HALL OF FAME 🏆
        </h2>
        <p className="font-crt text-xl text-slate-300">
          TOP PILOTS WHO TOPPED THE GALATTA CHARTS
        </p>
      </div>

      <div className="arcade-card p-6 border-2 border-slate-800">
        <div className="space-y-3">
          <div className="grid grid-cols-12 font-pixel text-[10px] text-slate-400 border-b-2 border-slate-800 pb-2 px-3">
            <span className="col-span-2">RANK</span>
            <span className="col-span-2">TAG</span>
            <span className="col-span-4">PILOT</span>
            <span className="col-span-2 text-right">STREAK</span>
            <span className="col-span-2 text-right">SCORE</span>
          </div>

          {mergedLeaderboard.map((entry, idx) => (
            <div
              key={idx}
              className={`grid grid-cols-12 items-center p-3 rounded border font-pixel text-xs transition-all ${
                entry.isMe
                  ? 'bg-[#1a1200] border-[#ffe600] text-[#ffe600] shadow-[0_0_15px_rgba(255,230,0,0.25)]'
                  : 'bg-[#080814] border-slate-800 text-slate-200'
              }`}
            >
              <span className="col-span-2 font-black">
                {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `   #${idx + 1}`}
              </span>
              <span className="col-span-2 text-[#00f3ff]">[{entry.tag}]</span>
              <span className="col-span-4 truncate">{entry.nickname}</span>
              <span className="col-span-2 text-right text-orange-400">{entry.streak}x</span>
              <span className="col-span-2 text-right text-[#ffe600] font-mono">{entry.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
