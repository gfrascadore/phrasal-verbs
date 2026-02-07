import React, { useState, useEffect, useMemo } from 'react';
import { Search, Shuffle, BookOpen, RefreshCw, X, Sparkles, Loader2, MessageSquare, Settings, Key, AlertCircle, CheckCircle2, Volume2, Star, ThumbsUp, ThumbsDown, Bookmark } from 'lucide-react';

// --- CONFIGURAZIONE CHIAVE ---
// Nota: Per sicurezza, la chiave è stata rimossa dal codice sorgente diretto.
// Puoi inserirla nelle impostazioni dell'interfaccia utente (icona ingranaggio).
const MANUAL_API_KEY = ""; 

// Chiave di sistema (Iniettata dall'ambiente se disponibile)
const systemApiKey = typeof apiKey !== 'undefined' ? apiKey : "";

// Funzione helper per chiamare Gemini
async function callGemini(prompt, userStorageKey) {
  // ORDINE DI PRIORITÀ:
  // 1. Chiave salvata nelle impostazioni (localStorage)
  // 2. Chiave scritta manualmente nel codice (MANUAL_API_KEY)
  // 3. Chiave di sistema (systemApiKey)
  const keyToUse = userStorageKey || MANUAL_API_KEY || systemApiKey;

  if (!keyToUse) {
    return { error: true, message: "Chiave API mancante. Inseriscila nelle impostazioni." };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${keyToUse}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
        if (response.status === 400 || response.status === 403) {
            return { error: true, message: "Chiave API non valida o scaduta." };
        }
        throw new Error(`Errore API: ${response.status}`);
    }
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
        return { error: true, message: "L'AI non ha restituito testo." };
    }

    return { error: false, text: text };

  } catch (error) {
    console.error("Gemini Error:", error);
    return { error: true, message: "Errore di connessione. Riprova." };
  }
}

// --- DATASET COMPLETO ---
const ALL_DATA = [
  // TO
  { category: "TO", term: "Amount to", definition: "Equivalere a", example: "The total losses amount to millions of dollars." },

  // ASIDE
  { category: "ASIDE", term: "Brush aside", definition: "Sminuire", example: "The critic was brushed aside." }, 

  // AT
  { category: "AT", term: "Put at", definition: "Stimare (età/prezzo)", example: "I would put his age at about 50." },

  // FORWARD
  { category: "FORWARD", term: "Bring forward", definition: "Anticipare", example: "The meeting has been brought forward to Monday." },

  // UP
  { category: "UP", term: "Add up", definition: "Quadrare / Avere senso", example: "The suspect's story just doesn't add up." },
  { category: "UP", term: "Back up", definition: "Sostenere / Fare retromarcia", example: "The data backs up the theory. / Can you back up the car?" },
  { category: "UP", term: "Blow up", definition: "Ingigantire / Esplodere (bomba)", example: "The media blew the scandal up. / The bridge was blown up during the war." },
  { category: "UP", term: "Boot up", definition: "Avviare (PC)", example: "The system takes minutes to boot up." },
  { category: "UP", term: "Bring up", definition: "Menzionare", example: "She brought up the issue during the meeting." },
  { category: "UP", term: "Build up", definition: "Rafforzare / Costruire", example: "The army is building up its presence." },
  { category: "UP", term: "Catch up", definition: "Mettersi in pari", example: "Europe is trying to catch up with the US in AI." },
  { category: "UP", term: "Cheer up", definition: "Incoraggiare / Rallegrarsi", example: "The news failed to cheer up the markets. / Cheer up! It's not that bad." },
  { category: "UP", term: "Clean up", definition: "Ripulire", example: "The new mayor vows to clean up the streets." },
  { category: "UP", term: "Come up with", definition: "Ideare / Inventare", example: "They came up with a new peace plan." },
  { category: "UP", term: "Dig up", definition: "Scovare segreti / Dissotterrare", example: "Reporters dug up old files on the minister. / The dog dug up a bone." },
  { category: "UP", term: "Dress up", definition: "Abbellire / Vestirsi bene", example: "The stats were dressed up to look better. / They dressed up for the party." },
  { category: "UP", term: "End up", definition: "Finire per", example: "The talks could end up in total failure." },
  { category: "UP", term: "Face up to", definition: "Affrontare", example: "We must face up to the climate crisis." },
  { category: "UP", term: "Follow up", definition: "Approfondire", example: "Police are following up new leads." },
  { category: "UP", term: "Give up", definition: "Arrendersi", example: "Eventually I gave up" },
  { category: "UP", term: "Grow up", definition: "Maturare / Crescere", example: "The tech market has grown up quickly." },
  { category: "UP", term: "Harness up", definition: "Sfruttare", example: "We must harness up wind energy." },
  { category: "UP", term: "Heal up", definition: "Guarire", example: "The rift in the party will take time to heal up." },
  { category: "UP", term: "Hold up", definition: "Ritardare", example: "Protests held up the construction." },
  { category: "UP", term: "Keep up", definition: "Restare al passo", example: "It’s hard to keep up with the news." },
  { category: "UP", term: "Lock up", definition: "Incarcerare / Chiudere a chiave", example: "The rioters were locked up for 30 days. / Don't forget to lock up the house." },
  { category: "UP", term: "Look up to", definition: "Ammirare", example: "Young voters look up to the candidate." },
  { category: "UP", term: "Make up", definition: "Costituire / Inventare", example: "Women make up 50% of the workforce. / He made up the whole story." },
  { category: "UP", term: "Mess up", definition: "Pasticciare / Rovinare", example: "The crisis messed up the election plans." },
  { category: "UP", term: "Mix up", definition: "Confondere", example: "The two laws are often mixed up." },
  { category: "UP", term: "Move up", definition: "Anticipare", example: "Can we move the deadline up to Friday?" },
  { category: "UP", term: "Open up", definition: "Aprirsi", example: "The market is opening up to foreign firms." },
  { category: "UP", term: "Own up", definition: "Confessare", example: "The hacker finally owned up to the attack." },
  { category: "UP", term: "Patch up", definition: "Aggiustare alla meglio", example: "They tried to patch up the coalition." },
  { category: "UP", term: "Pick up", definition: "Migliorare / Raccogliere", example: "Sales started to pick up in June. / He picked up the pen from the floor." },
  { category: "UP", term: "Put up", definition: "Ospitare / Appendere / Costruire", example: "We can put you up for the night. / She put up a poster on the wall. / They put up a new fence." },
  { category: "UP", term: "Put up with", definition: "Sopportare", example: "I can't put up with this noise anymore." },
  { category: "UP", term: "Ramp up", definition: "Aumentare prod.", example: "The factory is ramping up production." },
  { category: "UP", term: "Save up", definition: "Risparmiare", example: "The state is saving up for the pension fund." },
  { category: "UP", term: "Set up", definition: "Fondare / Configurare", example: "The UN set up a new refugee camp. / I need to set up the new Wi-Fi." },
  { category: "UP", term: "Show up", definition: "Presentarsi", example: "The witness didn't show up in court." },
  { category: "UP", term: "Speed up", definition: "Accelerare", example: "The government wants to speed up the reform." },
  { category: "UP", term: "Stand up for", definition: "Difendere", example: "He stood up for human rights." },
  { category: "UP", term: "Step up", definition: "Intensificare", example: "Security has been stepped up at the border." },
  { category: "UP", term: "Sum up", definition: "Riassumere", example: "To sum up, the economy is stable." },
  { category: "UP", term: "Take up", definition: "Iniziare un hobby / Occupare spazio", example: "I took up tennis. / This desk takes up too much room." },
  { category: "UP", term: "Turn up", definition: "Accadere / Apparire", example: "Don't worry, something good will turn up. / He turned up at the party uninvited." },
  { category: "UP", term: "Use up", definition: "Esaurire", example: "We have used up all our resources." },
  { category: "UP", term: "Warm up", definition: "Riscaldarsi", example: "The candidates are warming up for the debate." },

  // DOWN
  { category: "DOWN", term: "Back down", definition: "Ritirarsi", example: "The union refused to back down." },
  { category: "DOWN", term: "Bring down", definition: "Far cadere (gov.)", example: "The scandal brought down the government." },
  { category: "DOWN", term: "Calm down", definition: "Calmarsi", example: "The situation has finally calmed down." },
  { category: "DOWN", term: "Clamp down", definition: "Reprimere", example: "Police are clamping down on crime." },
  { category: "DOWN", term: "Close down", definition: "Chiudere definitivo", example: "The factory was closed down last year." },
  { category: "DOWN", term: "Crack down", definition: "Giro di vite", example: "A crackdown on tax evasion has begun." },
  { category: "DOWN", term: "Cut down", definition: "Ridurre consumo", example: "The company will cut down on costs." },
  { category: "DOWN", term: "Die down", definition: "Attenuarsi", example: "The protests are starting to die down." },
  { category: "DOWN", term: "Drive down", definition: "Abbassare prezzi", example: "Surplus stock is driving down prices." },
  { category: "DOWN", term: "Get down", definition: "Buttare giù / Deprimere", example: "The bad news is getting investors down." },
  { category: "DOWN", term: "Jot down", definition: "Annotare", example: "The reporter jotted down the quote." },
  { category: "DOWN", term: "Knock down", definition: "Abbattere", example: "The old slums were knocked down." },
  { category: "DOWN", term: "Lay down", definition: "Stabilire regole", example: "The treaty lays down new trade rules." },
  { category: "DOWN", term: "Let down", definition: "Deludere", example: "The president let down his supporters." },
  { category: "DOWN", term: "Mark down", definition: "Scontare", example: "The currency was marked down by 2%." },
  { category: "DOWN", term: "Narrow down", definition: "Restringere campo", example: "They narrowed down the list of suspects." },
  { category: "DOWN", term: "Note down", definition: "Scrivere / Annotare", example: "Please note down the following figures." },
  { category: "DOWN", term: "Put down", definition: "Sopprimere / Appoggiare / Mettere giù", example: "The rebellion was put down. / Put that heavy box down. / He put the phone down." },
  { category: "DOWN", term: "Scale down", definition: "Ridimensionare", example: "The project was scaled down due to costs." },
  { category: "DOWN", term: "Settle down", definition: "Stabilizzarsi", example: "The market will settle down next week." },
  { category: "DOWN", term: "Shut down", definition: "Spegnere / Cessare", example: "The website was shut down by hackers." },
  { category: "DOWN", term: "Slow down", definition: "Rallentare", example: "The economy is starting to slow down." },
  { category: "DOWN", term: "Step down", definition: "Dimettersi", example: "The CEO will step down in January." },
  { category: "DOWN", term: "Write down", definition: "Mettere per iscritto", example: "The bank wrote down its bad debts." },

  // FROM
  { category: "FROM", term: "Flee from", definition: "Fuggire", example: "Thousands are fleeing from the city." },

  // OUT
  { category: "OUT", term: "Bail out", definition: "Salvare finanz.", example: "The government bailed out the bank." },
  { category: "OUT", term: "Beat out", definition: "Vincere di poco", example: "The firm beat out its rivals for the bid." },
  { category: "OUT", term: "Blow out", definition: "Spegnere (fiamma) / Scoppiare (gomma)", example: "She blew out the candle. / The car tire blew out at high speed." },
  { category: "OUT", term: "Blurt out", definition: "Lasciarsi sfuggire", example: "The aide blurted out the secret plan." },
  { category: "OUT", term: "Bow out", definition: "Ritirarsi con onore", example: "The senator will bow out after this term." },
  { category: "OUT", term: "Break out", definition: "Scoppiare (guerra) / Evadere", example: "Violence broke out in the capital. / Three prisoners broke out of jail." },
  { category: "OUT", term: "Buy out", definition: "Rilevare quote", example: "The company was bought out for $1 billion." },
  { category: "OUT", term: "Carry out", definition: "Eseguire", example: "They carried out a secret operation." },
  { category: "OUT", term: "Check out", definition: "Verificare / Guardare", example: "We need to check out these claims. / Check out that cool car!" },
  { category: "OUT", term: "Cross out", definition: "Cancellare (con una riga)", example: "His name was crossed out from the list." },
  { category: "OUT", term: "Cut out", definition: "Eliminare / Ritagliare", example: "They cut out unnecessary spending. / She cut out a picture from the magazine." },
  { category: "OUT", term: "Die out", definition: "Estinguersi", example: "The old tradition is slowly dying out." },
  { category: "OUT", term: "Drop out", definition: "Ritirarsi / Abbandonare", example: "The candidate dropped out of the race." },
  { category: "OUT", term: "Eat out", definition: "Mangiare fuori", example: "Fewer people are eating out these days." },
  { category: "OUT", term: "Fall out", definition: "Litigare", example: "The two allies have fallen out." },
  { category: "OUT", term: "Figure out", definition: "Risolvere / Capire", example: "Analysts are trying to figure out the cause." },
  { category: "OUT", term: "Filter out", definition: "Filtrare", example: "The app filters out fake news." },
  { category: "OUT", term: "Find out", definition: "Scoprire", example: "The public wants to find out the truth." },
  { category: "OUT", term: "Get out", definition: "Trapelare / Uscire", example: "The news got out before the embargo. / Get out of the car!" },
  { category: "OUT", term: "Give out", definition: "Esaurirsi / Distribuire", example: "The water supplies are giving out. / They gave out free samples." },
  { category: "OUT", term: "Help out", definition: "Dare una mano", example: "Volunteers helped out after the flood." },
  { category: "OUT", term: "Hire out", definition: "Affittare (dare in nolo)", example: "The agency hires out security staff." },
  { category: "OUT", term: "Lay out", definition: "Esporre (piano)", example: "He laid out his vision for the future." },
  { category: "OUT", term: "Leave out", definition: "Escludere / Omettere", example: "They left him out of the team. / Facts were left out of the report." },
  { category: "OUT", term: "Look out", definition: "Fare attenzione", example: "Investors must look out for risks." },
  { category: "OUT", term: "Pan out", definition: "Svilupparsi / Andare a finire", example: "We’ll see how the deal pans out." },
  { category: "OUT", term: "Phase out", definition: "Eliminare gradualmente", example: "Coal plants will be phased out." },
  { category: "OUT", term: "Point out", definition: "Far notare", example: "The report points out several errors." },
  { category: "OUT", term: "Pull out", definition: "Ritirarsi da trattato", example: "The firm pulled out of the market." },
  { category: "OUT", term: "Put out", definition: "Spegnere / Incomodare", example: "Firefighters put out the fire. / I hope I'm not putting you out." },
  { category: "OUT", term: "Rule out", definition: "Escludere (possibilità)", example: "Police ruled out any foul play." },
  { category: "OUT", term: "Run out", definition: "Finire scorte", example: "The country is running out of cash." },
  { category: "OUT", term: "Sell out", definition: "Tradire / Esaurire", example: "The politician sold out to lobbyists. / The concert sold out in minutes." },
  { category: "OUT", term: "Sort out", definition: "Risolvere caos", example: "They need to sort out the legal issues." },
  { category: "OUT", term: "Speak out", definition: "Parlare apertamente", example: "More victims spoke out against him." },
  { category: "OUT", term: "Spell out", definition: "Spiegare chiaramente", example: "The treaty spells out the conditions." },
  { category: "OUT", term: "Stand out", definition: "Eccellere / Spiccare", example: "One candidate stands out from the rest." },
  { category: "OUT", term: "Wash out", definition: "Annullare per pioggia", example: "The final match was washed out." },
  { category: "OUT", term: "Wear out", definition: "Logorarsi", example: "Public patience is wearing out." },
  { category: "OUT", term: "Wipe out", definition: "Spazzare via", example: "The storm wiped out the crops." },
  { category: "OUT", term: "Work out", definition: "Elaborare / Risolvere / Allenarsi", example: "Experts must work out a new strategy. / I can't work out this math problem. / I work out at the gym." },

  // OFF
  { category: "OFF", term: "Back off", definition: "Desistere / Arretrare", example: "The protesters told the police to back off." },
  { category: "OFF", term: "Call off", definition: "Annullare", example: "The meeting was called off last minute." },
  { category: "OFF", term: "Cast off", definition: "Liberarsi", example: "The country cast off its colonial past." },
  { category: "OFF", term: "Cut off", definition: "Isolare / Tagliare", example: "The town was cut off by the snow. / They cut off the electricity." },
  { category: "OFF", term: "Dash off", definition: "Scrivere in fretta", example: "The editor dashed off a quick note." },
  { category: "OFF", term: "Get off", definition: "Evitare pena / Scendere", example: "The thief got off with a small fine. / Get off the bus here." },
  { category: "OFF", term: "Give off", definition: "Emettere (odore/luce)", example: "The plant gives off a strange smell." },
  { category: "OFF", term: "Go off", definition: "Esplodere / Suonare", example: "The bomb went off. / The alarm went off at midnight." },
  { category: "OFF", term: "Keep off", definition: "Stare alla larga", example: "Keep off the grass." },
  { category: "OFF", term: "Lay off", definition: "Licenziare", example: "The airline laid off 2,000 workers." },
  { category: "OFF", term: "Log off", definition: "Uscire da account", example: "Don't forget to log off the system." },
  { category: "OFF", term: "Pass off", definition: "Spacciare per", example: "He tried to pass off the fake as real." },
  { category: "OFF", term: "Pay off", definition: "Ripagare / Fruttare", example: "He finally paid off his debts. / The strategy is starting to pay off." },
  { category: "OFF", term: "Put off", definition: "Rimandare", example: "The vote was put off until next week." },
  { category: "OFF", term: "See off", definition: "Salutare alla partenza", example: "The army saw off the invaders." },
  { category: "OFF", term: "Set off", definition: "Innescare / Partire", example: "The news set off a panic on the market. / We set off at dawn for the trip." },
  { category: "OFF", term: "Show off", definition: "Ostentare", example: "The city is showing off its new park." },
  { category: "OFF", term: "Spark off", definition: "Scatenare", example: "The tax set off a wave of protests." },
  { category: "OFF", term: "Turn off", definition: "Spegnere", example: "Turn off the power before repair." },
  { category: "OFF", term: "Write off", definition: "Cancellare debito", example: "The debt was written off by the bank." },

  // ON
  { category: "ON", term: "Add on", definition: "Aggiungere", example: "There is an add-on cost for delivery." },
  { category: "ON", term: "Bank on", definition: "Fare affidamento", example: "Don't bank on a quick recovery." },
  { category: "ON", term: "Base on", definition: "Basare su", example: "The report is based on official data." },
  { category: "ON", term: "Call on", definition: "Fare appello / Visitare", example: "The UN called on leaders to act. / Let's call on grandma this afternoon." },
  { category: "ON", term: "Carry on", definition: "Continuare", example: "They decided to carry on with the plan." },
  { category: "ON", term: "Cash in on", definition: "Approfittare", example: "Firms are cashing in on the AI boom." },
  { category: "ON", term: "Catch on", definition: "Diventare popolare", example: "The new trend is starting to catch on." },
  { category: "ON", term: "Count on", definition: "Contare su", example: "We can count on their support." },
  { category: "ON", term: "Depend on", definition: "Dipendere", example: "The future depends on this vote." },
  { category: "ON", term: "Drag on", definition: "Trascinarsi", example: "The trial is expected to drag on." },
  { category: "ON", term: "Feed on", definition: "Nutrirsi / Alimentarsi", example: "Anger feeds on social inequality." },
  { category: "ON", term: "Get on", definition: "Andare d'accordo", example: "The two ministers don't get on." },
  { category: "ON", term: "Go on", definition: "Proseguire / Succedere", example: "The protest went on for three days. / What is going on here?" },
  { category: "ON", term: "Hold on", definition: "Aspettare / Resistere", example: "Hold on a minute. / The rebels are holding on to the city." },
  { category: "ON", term: "Keep on", definition: "Continuare a", example: "The bank keeps on raising rates." },
  { category: "ON", term: "Let on", definition: "Rivelare / Lasciar trapelare", example: "He didn't let on that he knew the truth." },
  { category: "ON", term: "Live on", definition: "Vivere di", example: "Many live on less than $2 a day." },
  { category: "ON", term: "Log on", definition: "Accedere", example: "Thousands logged on to watch the stream." },
  { category: "ON", term: "Pass on", definition: "Trasmettere", example: "Costs are passed on to consumers." },
  { category: "ON", term: "Put on", definition: "Indossare / Accendere / Ingrassare", example: "Put your coat on. / Put the light on. / He put on weight." },
  { category: "ON", term: "Rely on", definition: "Affidarsi", example: "We rely on imports for energy." },
  { category: "ON", term: "Take on", definition: "Assumere / Affrontare", example: "They are taking on new staff. / The hero took on the giant firm." },

  // BACK
  { category: "BACK", term: "Answer back", definition: "Rispondere male", example: "The aide was fired for answering back." },
  { category: "BACK", term: "Back up", definition: "Supportare / Fare retromarcia", example: "His alibi was backed up by video. / Can you back up the car?" },
  { category: "BACK", term: "Date back", definition: "Risalire a", example: "The law dates back to 1920." },
  { category: "BACK", term: "Fall back", definition: "Ripiegare", example: "The troops were forced to fall back." },
  { category: "BACK", term: "Fight back", definition: "Reagire", example: "The patient is fighting back against cancer." },
  { category: "BACK", term: "Give back", definition: "Restituire", example: "The museum gave back the artifacts." },
  { category: "BACK", term: "Hold back", definition: "Trattenere (info/emozioni)", example: "He held back tears during the speech." },
  { category: "BACK", term: "Keep back", definition: "Tenersi a distanza", example: "The police kept the crowd back." },
  { category: "BACK", term: "Look back", definition: "Guardare al passato", example: "Looking back, the signs were there." },
  { category: "BACK", term: "Pay back", definition: "Vendicarsi / Restituire", example: "I will pay him back for this. / The loan must be paid back by May." },
  { category: "BACK", term: "Plow back", definition: "Reinvestire", example: "Profits were plowed back into research." },
  { category: "BACK", term: "Pull back", definition: "Ritirarsi", example: "Investors are pulling back from tech." },
  { category: "BACK", term: "Put back", definition: "Rimettere a posto / Posticipare", example: "Please put the book back on the shelf. / The meeting was put back to 4 PM." },
  { category: "BACK", term: "Set back", definition: "Ostacolare / Ritardare", example: "The rain set back the harvest." },
  
  // IN / INTO
  { category: "IN/INTO", term: "Break into", definition: "Scassinare", example: "Thieves broke into the palace." },
  { category: "IN/INTO", term: "Bring in", definition: "Introdurre (legge)", example: "The govt will bring in new taxes." },
  { category: "IN/INTO", term: "Cave in", definition: "Cedere (tetto/pressione)", example: "The roof caved in after the blast." },
  { category: "IN/INTO", term: "Check in", definition: "Accettare / Registrare", example: "Passengers are checking in now." },
  { category: "IN/INTO", term: "Dive into", definition: "Tuffarsi in un tema", example: "Let's dive into the details." },
  { category: "IN/INTO", term: "Fill in", definition: "Compilare / Informare / Sostituire", example: "Please fill in this form. / Can you fill me in on the news? / She's filling in for the teacher." }, 
  { category: "IN/INTO", term: "Fit in", definition: "Integrarsi", example: "The law doesn't fit in with the treaty." },
  { category: "IN/INTO", term: "Get in", definition: "Essere eletti / Entrare", example: "The party got in with a landslide. / Get in the car!" },
  { category: "IN/INTO", term: "Get into", definition: "Entrare / Interessarsi", example: "How did the hacker get into the files? / I'm really getting into jazz music." },
  { category: "IN/INTO", term: "Hack into", definition: "Hackerare", example: "Foreign spies hacked into the site." },
  { category: "IN/INTO", term: "Join in", definition: "Partecipare", example: "Crowds joined in the national anthem." },
  { category: "IN/INTO", term: "Let in", definition: "Far entrare", example: "The club refused to let in the media." },
  { category: "IN/INTO", term: "Look into", definition: "Investigare", example: "The FBI is looking into the fraud." },
  { category: "IN/INTO", term: "Move in", definition: "Trasferirsi / Intervenire", example: "Our new neighbors moved in today. / The police moved in to clear the park." },
  { category: "IN/INTO", term: "Put in", definition: "Inserire / Fare sforzo", example: "Put in your password. / He put in a lot of work for this bill." },
  { category: "IN/INTO", term: "Run into", definition: "Imbattersi", example: "The project ran into difficulties." },
  { category: "IN/INTO", term: "Take in", definition: "Comprendere (notizia) / Ammirare (vista) / Ingannare", example: "It was hard to take in the news. / We took in the view. / Don't be taken in by his lies." },
  { category: "IN/INTO", term: "Turn in", definition: "Consegnare / Denunciare", example: "He turned himself in to the police." },

  // OVER
  { category: "OVER", term: "Blow over", definition: "Passare / Sgonfiarsi", example: "The controversy will soon blow over." },
  { category: "OVER", term: "Carry over", definition: "Trasferire", example: "The debt was carried over to 2024." },
  { category: "OVER", term: "Get over", definition: "Superare (malattia/shock)", example: "She is still getting over the shock." },
  { category: "OVER", term: "Go over", definition: "Esaminare", example: "The judge went over the evidence." },
  { category: "OVER", term: "Hand over", definition: "Consegnare", example: "The keys were handed over to the heir." },
  { category: "OVER", term: "Look over", definition: "Dare un'occhiata", example: "The lawyer looked over the contract." },
  { category: "OVER", term: "Mull over", definition: "Rimuginare", example: "The PM is mulling over his options." },
  { category: "OVER", term: "Rule over", definition: "Governare", example: "He ruled over the nation for decades." },
  { category: "OVER", term: "Take over", definition: "Prendere controllo", example: "The vice-chair will take over." },
  { category: "OVER", term: "Talk over", definition: "Discutere", example: "They talked over the issue for hours." },

  // THROUGH
  { category: "THROUGH", term: "Carry through", definition: "Completare", example: "He carried through his reforms." },
  { category: "THROUGH", term: "Follow through", definition: "Dar seguito", example: "The govt must follow through." },
  { category: "THROUGH", term: "Get through", definition: "Far approvare (legge) / Superare", example: "The bill finally got through the Senate. / We got through a tough time." },
  { category: "THROUGH", term: "Go through", definition: "Subire / Esaminare", example: "The nation is going through a crisis. / We need to go through the details." },
  { category: "THROUGH", term: "Look through", definition: "Scorrere con gli occhi", example: "I looked through the morning papers." },
  { category: "THROUGH", term: "Pull through", definition: "Cavarsela (guarire)", example: "The patient is expected to pull through." },
  { category: "THROUGH", term: "Push through", definition: "Far approvare a forza", example: "They pushed through the new law." },
  { category: "THROUGH", term: "See through", definition: "Capire l'inganno", example: "I saw through his fake smile." },
  { category: "THROUGH", term: "Sift through", definition: "Analizzare minuziosamente", example: "Experts are sifting through the debris." },

  // AWAY
  { category: "AWAY", term: "Break away", definition: "Separarsi / Fuggire", example: "Scotland wants to break away." },
  { category: "AWAY", term: "Die away", definition: "Svanire (suono)", example: "The cheers slowly died away." },
  { category: "AWAY", term: "Drive away", definition: "Allontanare", example: "The noise drives away tourists." },
  { category: "AWAY", term: "Fade away", definition: "Dissolversi", example: "Public interest is fading away." },
  { category: "AWAY", term: "Get away", definition: "Scappare", example: "The gunman got away on a bike." },
  { category: "AWAY", term: "Give away", definition: "Rivelare / Regalare", example: "He gave away the secret location. / She gave away her old clothes." },
  { category: "AWAY", term: "Pass away", definition: "Morire", example: "The queen passed away peacefully." },
  { category: "AWAY", term: "Run away", definition: "Darsi alla fuga", example: "The child ran away from home." },
  { category: "AWAY", term: "Stay away", definition: "Restare lontano", example: "Voters stayed away from the polls." },
];

const CATEGORIES = ['TUTTI', 'PREFERITI', 'DA RIVEDERE', ...new Set(ALL_DATA.map(d => d.category))];

const Flashcard = ({ data, isFlipped, onFlip, userApiKey, isFavorite, onToggleFavorite, isInReview, onSetReview }) => {
  const [aiExample, setAiExample] = useState(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (!isFlipped) {
      // Keep state if needed, or reset.
    }
  }, [isFlipped]);

  useEffect(() => {
    setAiExample(null);
    setErrorMsg(null);
  }, [data]);

  const handleAiExample = async (e) => {
    e.stopPropagation(); 
    if (aiExample || isLoadingAi) return;

    setIsLoadingAi(true);
    setErrorMsg(null);
    
    // Safely construct prompt
    const prompt = `Generate 1 simple, benign, modern English sentence using the phrasal verb "${data.term}" (meaning: ${data.definition}). The sentence must be different from: "${data.example}". Just the sentence.`;
    
    const result = await callGemini(prompt, userApiKey);
    
    if (result.error) {
      setErrorMsg(result.message);
    } else {
      setAiExample(result.text);
    }
    
    setIsLoadingAi(false);
  };

  return (
    <div 
      className="group h-72 w-full perspective-1000 cursor-pointer" // Increased height slightly for footer buttons
      onClick={onFlip}
    >
      <div className={`relative h-full w-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* Front */}
        <div className="absolute inset-0 h-full w-full backface-hidden bg-white border-2 border-indigo-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-300 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
          
          {/* Review Indicator */}
          {isInReview && (
            <div className="absolute top-0 left-0 w-full h-1 bg-orange-400"></div>
          )}
          {isInReview && (
            <div className="absolute top-3 left-14 bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Bookmark className="w-3 h-3" /> DA RIVEDERE
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className="absolute top-4 left-4 p-2 rounded-full hover:bg-slate-100 transition-colors z-20 group-hover:scale-110"
            title={isFavorite ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
          >
            <Star className={`w-6 h-6 transition-colors ${isFavorite ? "fill-amber-400 text-amber-400" : "text-slate-300 hover:text-amber-300"}`} />
          </button>

          <span className="absolute top-4 right-4 text-xs font-bold text-indigo-400 bg-indigo-50 px-2 py-1 rounded-full">
            {data.category}
          </span>
          <h3 className="text-2xl font-bold text-slate-800 break-words mt-4">{data.term}</h3>
          <p className="mt-4 text-sm text-slate-400 font-medium">Tocca per scoprire</p>
        </div>

        {/* Back */}
        <div className="absolute inset-0 h-full w-full backface-hidden rotate-y-180 bg-indigo-50 border-2 border-indigo-200 rounded-2xl shadow-inner flex flex-col items-center p-5 text-center">
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <h4 className="text-xl font-bold text-indigo-700 mb-2">{data.definition}</h4>
            <div className="w-12 h-1 bg-indigo-200 rounded-full mb-3"></div>
            
            <div className="overflow-y-auto max-h-[100px] w-full px-2 custom-scrollbar">
              {data.example.includes(" / ") ? (
                data.example.split(" / ").map((ex, i) => (
                  <p key={i} className="text-slate-600 italic mb-2 text-sm">"{ex}"</p>
                ))
              ) : (
                <p className="text-slate-600 italic mb-2 text-sm">"{data.example}"</p>
              )}

              {/* AI Generated Example Area */}
              {aiExample && (
                <div className="mt-2 pt-2 border-t border-indigo-100 animate-in fade-in slide-in-from-bottom-2">
                  <p className="text-indigo-600 font-medium text-xs uppercase mb-1 flex items-center justify-center gap-1">
                    <Sparkles className="w-3 h-3" /> Gemini AI Example
                  </p>
                  <p className="text-slate-700 italic text-sm">"{aiExample}"</p>
                </div>
              )}
              
              {errorMsg && (
                <div className="mt-2 pt-2 border-t border-red-100 animate-in fade-in">
                  <p className="text-red-500 text-xs italic flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errorMsg}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Review Buttons Footer */}
          <div className="mt-2 w-full pt-3 border-t border-indigo-200/50 grid grid-cols-2 gap-2">
             <button 
               onClick={(e) => { e.stopPropagation(); onSetReview(true); }}
               className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${isInReview ? 'bg-orange-200 text-orange-800 ring-2 ring-orange-300' : 'bg-white text-slate-500 hover:bg-orange-50 hover:text-orange-600'}`}
             >
                <ThumbsDown className="w-4 h-4" /> Da Rivedere
             </button>
             <button 
               onClick={(e) => { e.stopPropagation(); onSetReview(false); }}
               className="py-2 px-2 rounded-lg text-xs font-bold bg-white text-slate-500 hover:bg-green-50 hover:text-green-600 transition-colors flex items-center justify-center gap-1"
             >
                <ThumbsUp className="w-4 h-4" /> Lo sapevo
             </button>
          </div>

          {/* AI Button (Absolute positioned again, but smaller/adjusted) */}
          {!aiExample && (
            <button
              onClick={handleAiExample}
              disabled={isLoadingAi}
              className="absolute top-2 right-2 p-1.5 bg-indigo-100/50 hover:bg-indigo-200 text-indigo-600 rounded-full transition-colors flex items-center justify-center"
              title="Genera nuovo esempio con AI"
            >
              {isLoadingAi ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            </button>
          )}

        </div>

      </div>
    </div>
  );
};

export default function PhrasalVerbsApp() {
  const [activeCategory, setActiveCategory] = useState('TUTTI');
  const [searchQuery, setSearchQuery] = useState('');
  const [flippedIndices, setFlippedIndices] = useState(new Set());
  const [displayData, setDisplayData] = useState([]);

  // Favorites State (Lazy init from localStorage)
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('phrasal_favorites');
      return new Set(saved ? JSON.parse(saved) : []);
    } catch (e) {
      console.warn("Errore lettura preferiti:", e);
      return new Set();
    }
  });

  const toggleFavorite = (term) => {
    const newFavs = new Set(favorites);
    if (newFavs.has(term)) {
      newFavs.delete(term);
    } else {
      newFavs.add(term);
    }
    setFavorites(newFavs);
    try {
      localStorage.setItem('phrasal_favorites', JSON.stringify([...newFavs]));
    } catch (e) {
      console.warn("Errore salvataggio preferiti:", e);
    }
  };

  // Review List State (Lazy init from localStorage)
  const [reviewList, setReviewList] = useState(() => {
    try {
      const saved = localStorage.getItem('phrasal_review_list');
      return new Set(saved ? JSON.parse(saved) : []);
    } catch (e) {
      console.warn("Errore lettura lista revisione:", e);
      return new Set();
    }
  });

  const setReviewStatus = (term, shouldReview) => {
    const newList = new Set(reviewList);
    if (shouldReview) {
      newList.add(term);
    } else {
      newList.delete(term);
    }
    setReviewList(newList);
    try {
      localStorage.setItem('phrasal_review_list', JSON.stringify([...newList]));
    } catch (e) {
      console.warn("Errore salvataggio lista revisione:", e);
    }
  };

  // Story Mode State
  const [story, setStory] = useState(null);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [storyError, setStoryError] = useState(null);

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  
  // INIZIALIZZAZIONE PIGRA (LAZY INIT): Legge il localStorage subito all'avvio
  const [userApiKey, setUserApiKey] = useState(() => {
    try {
      const stored = localStorage.getItem('gemini_api_key');
      return stored || '';
    } catch (e) {
      console.warn("Local storage non accessibile:", e);
      return '';
    }
  });

  const saveApiKey = (key) => {
    setUserApiKey(key);
    try {
      localStorage.setItem('gemini_api_key', key);
    } catch (e) {
      console.warn("Impossibile salvare nel local storage:", e);
    }
  };

  // Inizializza i dati
  useEffect(() => {
    setDisplayData([...ALL_DATA]);
  }, []);

  // Filtra i dati
  const filteredData = useMemo(() => {
    let result = displayData;

    // Filtro Categoria
    if (activeCategory === 'PREFERITI') {
      result = result.filter(item => favorites.has(item.term));
    } else if (activeCategory === 'DA RIVEDERE') {
      result = result.filter(item => reviewList.has(item.term));
    } else if (activeCategory !== 'TUTTI') {
      result = result.filter(item => item.category === activeCategory);
    }

    // Filtro Ricerca
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.term.toLowerCase().includes(q) || 
        item.definition.toLowerCase().includes(q)
      );
    }

    return result;
  }, [displayData, activeCategory, searchQuery, favorites, reviewList]);

  const handleFlip = (index) => {
    const newFlipped = new Set(flippedIndices);
    if (newFlipped.has(index)) {
      newFlipped.delete(index);
    } else {
      newFlipped.add(index);
    }
    setFlippedIndices(newFlipped);
  };

  const shuffleCards = () => {
    const shuffled = [...displayData].sort(() => Math.random() - 0.5);
    setDisplayData(shuffled);
    setFlippedIndices(new Set()); // Resetta i flip quando mischi
  };

  const resetFilters = () => {
    setSearchQuery('');
    setActiveCategory('TUTTI');
    setDisplayData([...ALL_DATA]); // Ripristina ordine originale
    setFlippedIndices(new Set());
  };

  // Funzione per generare la storia
  const generateStory = async () => {
    if (filteredData.length === 0) return;
    setIsGeneratingStory(true);
    setStoryError(null);
    setShowStoryModal(true);
    setStory(null);

    // Pick random verbs (max 5)
    const shuffled = [...filteredData].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5).map(i => i.term);

    const prompt = `Write a short, funny, benign story (max 60 words) in English using these phrasal verbs: ${selected.join(', ')}. Highlight the phrasal verbs in the text by wrapping them in **asterisks**.`;

    const result = await callGemini(prompt, userApiKey);
    
    if (result.error) {
      setStoryError(result.message);
    } else {
      setStory(result.text);
    }
    setIsGeneratingStory(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 relative">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="text-indigo-600 w-8 h-8" />
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500">
                Phrasal Verbs Master
              </h1>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Cerca verbo o significato..." 
                  className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <button 
                onClick={generateStory}
                className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:opacity-90 transition-opacity shadow-md flex items-center gap-1 px-3"
                title="Crea storia con AI"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium">Storia AI</span>
              </button>

              <button 
                onClick={shuffleCards}
                className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                title="Mescola carte"
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button 
                onClick={() => setShowSettings(true)}
                className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors relative"
                title="Impostazioni & Chiave API"
              >
                <Settings className="w-5 h-5" />
                {MANUAL_API_KEY && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                )}
              </button>
            </div>
          </div>

          {/* Categories - Modified to wrap instead of scroll for better visibility */}
          <div className="mt-4 flex flex-wrap gap-2 pb-2 justify-center md:justify-start">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold transition-colors border ${
                  activeCategory === cat 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-indigo-50 hover:border-indigo-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Stats Bar */}
        <div className="flex justify-between items-center mb-6 text-sm text-slate-500">
          <p>Mostrando <span className="font-bold text-slate-800">{filteredData.length}</span> carte</p>
          {(activeCategory !== 'TUTTI' || searchQuery) && (
             <button 
               onClick={resetFilters}
               className="flex items-center gap-1 text-indigo-600 hover:underline"
             >
               <RefreshCw className="w-3 h-3" /> Resetta filtri
             </button>
          )}
        </div>

        {/* Grid */}
        {filteredData.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredData.map((item, index) => (
              <Flashcard 
                key={`${item.term}-${index}`} // Unique key helps with shuffle animation
                data={item} 
                isFlipped={flippedIndices.has(index)}
                onFlip={() => handleFlip(index)}
                userApiKey={userApiKey}
                isFavorite={favorites.has(item.term)}
                onToggleFavorite={() => toggleFavorite(item.term)}
                isInReview={reviewList.has(item.term)}
                onSetReview={(status) => setReviewStatus(item.term, status)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400">
            {activeCategory === 'PREFERITI' ? (
              <div className="flex flex-col items-center gap-2">
                <Star className="w-12 h-12 text-slate-200" />
                <p className="text-lg">Non hai ancora nessun preferito.</p>
                <p className="text-sm">Tocca la stella sulle carte per aggiungerle qui.</p>
                <button onClick={() => setActiveCategory('TUTTI')} className="mt-4 text-indigo-600 font-medium hover:underline">
                  Torna a tutti i verbi
                </button>
              </div>
            ) : activeCategory === 'DA RIVEDERE' ? (
              <div className="flex flex-col items-center gap-2">
                <Bookmark className="w-12 h-12 text-slate-200" />
                <p className="text-lg">Nessun verbo da rivedere.</p>
                <p className="text-sm">Gira le carte e segna "Da Rivedere" se non ricordi il significato.</p>
                <button onClick={() => setActiveCategory('TUTTI')} className="mt-4 text-indigo-600 font-medium hover:underline">
                  Torna a tutti i verbi
                </button>
              </div>
            ) : (
              <>
                <p className="text-lg">Nessun verbo trovato per la tua ricerca.</p>
                <button onClick={resetFilters} className="mt-4 text-indigo-600 font-medium hover:underline">
                  Torna a tutti i verbi
                </button>
              </>
            )}
          </div>
        )}
      </main>

      {/* Story Modal */}
      {showStoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative">
            <button 
              onClick={() => setShowStoryModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Storia AI</h2>
            </div>

            <div className="min-h-[100px] flex items-center justify-center">
              {isGeneratingStory ? (
                <div className="flex flex-col items-center gap-3 text-purple-600">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <p className="text-sm font-medium animate-pulse">Scrivendo una storia divertente...</p>
                </div>
              ) : storyError ? (
                <div className="text-red-500 text-center px-4">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>{storyError}</p>
                  <button onClick={() => setShowSettings(true)} className="mt-2 text-sm underline hover:text-red-700">Controlla Impostazioni</button>
                </div>
              ) : (
                <div className="text-slate-700 leading-relaxed text-lg">
                  {/* Rendering sicuro del markdown semplice (grassetto) */}
                  {story && story.split('**').map((part, index) => 
                    index % 2 === 1 ? <strong key={index} className="text-purple-600">{part}</strong> : part
                  )}
                </div>
              )}
            </div>
            
            {!isGeneratingStory && !storyError && (
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={generateStory}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors text-sm"
                >
                  Genera un'altra
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-500" /> Impostazioni
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-500" /> Google Gemini API Key
              </label>
              
              {MANUAL_API_KEY ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Chiave incorporata nel codice (Attiva)
                </div>
              ) : (
                <input 
                  type="password" 
                  placeholder="Incolla qui la tua API Key..." 
                  className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={userApiKey}
                  onChange={(e) => saveApiKey(e.target.value)}
                />
              )}
              
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Necessaria per le funzioni AI (Storie ed Esempi) se usi l'app fuori dall'anteprima.
                <br/>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">Ottieni una chiave gratis qui</a>.
              </p>
            </div>

            <div className="flex justify-end">
              <button onClick={() => setShowSettings(false)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm">
                Salva e Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-auto py-8 text-center text-slate-400 text-sm">
        <p>Generato per lo studio dei Phrasal Verbs con Gemini AI ✨</p>
      </footer>

      {/* Custom Styles */}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        /* Custom scrollbar for example text area */
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}