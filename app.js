// ==========================================
// 1. IMPORTATIONS DES MODULES FIREBASE CORRIGÉS
// ==========================================
import { initializeApp } from "https://gstatic.com";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, collection, onSnapshot } from "https://gstatic.com";

// ==========================================
// 2. CONFIGURATION DE VOTRE BASE DE DONNÉES CORRIGÉE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCTZFFQ1BbNS2AhY2My3FoxE3iMF2VrRso",
  authDomain: "police-bw.firebaseapp.com",
  projectId: "police-bw",
  storageBucket: "police-bw.firebasestorage.app",
  messagingSenderId: "606303723293",
  appId: "1:606303723293:web:2df34f7a461d42d1580bf4",
  measurementId: "G-20HRYJBSP0"
};

// INITIALISATION UNIQUE
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// ==========================================
// 3. LOGIQUE ET FONCTIONS DE L'APPLICATION
// ==========================================

/**
 * Récupère et valide les données de l'agent depuis le formulaire
 */
const getAgentData = () => {
    const nom = document.getElementById('agentNom').value.trim().toUpperCase();
    const prenom = document.getElementById('agentPrenom').value.trim();
    const grade = document.getElementById('agentGrade').value.trim();
    const cadena = document.getElementById('agentCadena').value.trim();

    if (!nom || !prenom || !grade || !cadena) {
        alert("Halte ! Vous devez remplir tous les champs de l'officier.");
        return null;
    }
    
    const agentId = `${prenom.toLowerCase()}_${nom.toLowerCase()}`;
    return { 
        id: agentId,
        signature: `${grade} ${prenom} ${nom}`, 
        code: cadena,
        grade: grade,
        nom: nom,
        prenom: prenom
    };
};

/**
 * Contrôle ou bloque un agent existant si son code secret est erroné
 */
async function EnregistrerOuVerifierAgent(agent) {
    const agentRef = doc(db, "agents_blackwater", agent.id);
    const agentSnap = await getDoc(agentRef);

    if (agentSnap.exists()) {
        if (agentSnap.data().code !== agent.code) {
            alert("Accès refusé ! Le code de cadenas ne correspond pas à cet officier.");
            return { valide: false, approuve: false };
        }
        return { valide: true, approuve: agentSnap.data().approuve };
    } else {
        await setDoc(agentRef, {
            nom: agent.nom,
            prenom: agent.prenom,
            grade: agent.grade,
            code: agent.code,
            approuve: false
        });
        alert(`Nouvel officier ajouté en attente de validation.`);
        return { valide: true, approuve: false };
    }
}

// ==========================================
// BOUTON : INSCRIPTION MANUELLE DE L'AGENT
// ==========================================
document.getElementById('btnInscrireAgent').addEventListener('click', async () => {
    const agent = getAgentData();
    if (!agent) return;

    const agentRef = doc(db, "agents_blackwater", agent.id);
    const agentSnap = await getDoc(agentRef);

    if (agentSnap.exists()) {
        alert("Cet officier figure déjà dans les archives du classeur !");
        return;
    }

    await setDoc(agentRef, {
        nom: agent.nom,
        prenom: agent.prenom,
        grade: agent.grade,
        code: agent.code,
        approuve: false
    });

    alert(`Demande d'inscription déposée. Le Shérif doit maintenant tamponner votre ligne en bas de page.`);
});

// ==========================================
// ACTION : ENTRÉE DE MARCHANDISES
// ==========================================
document.getElementById('btnAjouter').addEventListener('click', async () => {
    const agent = getAgentData();
    if (!agent) return;

    const verification = await EnregistrerOuVerifierAgent(agent);
    if (!verification.valide) return;

    const nomPlat = document.getElementById('platNom').value.trim().toLowerCase();
    const quantiteAjoutee = parseInt(document.getElementById('platQuantite').value);

    if (!nomPlat || isNaN(quantiteAjoutee) || quantiteAjoutee <= 0) {
        alert("Veuillez renseigner un nom de plat valide et une quantité positive.");
        return;
    }

    const docRef = doc(db, "inventaire_blackwater", nomPlat);
    const docSnap = await getDoc(docRef);

    let nouvelleQuantite = quantiteAjoutee;
    if (docSnap.exists()) {
        nouvelleQuantite += docSnap.data().quantite;
    }

    await setDoc(docRef, {
        nom: nomPlat,
        quantite: nouvelleQuantite,
        dernierAgent: agent.signature,
        derniereAction: "Ajout"
    });

    document.getElementById('platNom').value = '';
    document.getElementById('platQuantite').value = '';
    alert(`Ravitaillement consigné avec succès.`);
});

// ==========================================
// ACTION : SORTIE DE MARCHANDISES
// ==========================================
document.getElementById('btnRetirer').addEventListener('click', async () => {
    const agent = getAgentData();
    if (!agent) return;

    const agentRef = doc(db, "agents_blackwater", agent.id);
    const agentSnap = await getDoc(agentRef);

    if (!agentSnap.exists()) {
        alert(`Retrait refusé ! L'officier n'est pas répertorié. Inscrivez-vous d'abord.`);
        return;
    }

    if (agentSnap.data().code !== agent.code) {
        alert("Alerte sabotage ! Code de cadenas incorrect.");
        return;
    }

    if (!agentSnap.data().approuve) {
        alert(`Accès Interdit ! Votre profil n'a pas encore été validé par le Shérif.`);
        return;
    }

    const nomPlat = document.getElementById('retraitPlatNom').value.trim().toLowerCase();
    const quantiteRetiree = parseInt(document.getElementById('retraitQuantite').value);

    if (!nomPlat || isNaN(quantiteRetiree) || quantiteRetiree <= 0) {
        alert("Veuillez renseigner un plat et une quantité à retirer.");
        return;
    }

    const docRef = doc(db, "inventaire_blackwater", nomPlat);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        alert("Ce plat n'est pas répertorié dans les stocks.");
        return;
    }

    let quantiteActuelle = docSnap.data().quantite;
    if (quantiteRetiree > quantiteActuelle) {
        alert(`Rations insuffisantes ! Il ne reste que ${quantiteActuelle} unité(s).`);
        return;
    }

    await setDoc(docRef, {
        nom: nomPlat,
        quantite: quantiteActuelle - quantiteRetiree,
        dernierAgent: agent.signature,
        derniereAction: `Retrait (-${quantiteRetiree})`
    });

    document.getElementById('retraitPlatNom').value = '';
    document.getElementById('retraitQuantite').value = '';
    alert("Le retrait a été validé.");
});

// ==========================================
// FLUX TEMPS RÉEL : TABLEAU DE L'INVENTAIRE
// ==========================================
onSnapshot(collection(db, "inventaire_blackwater"), (snapshot) => {
    const tbody = document.getElementById('inventoryBody');
    tbody.innerHTML = ''; 
    snapshot.forEach((doc) => {
        const data = doc.data();
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="text-transform: capitalize;"><strong>${data.nom}</strong></td>
            <td>${data.quantite}</td>
            <td>${data.dernierAgent} (${data.derniereAction})</td>
        `;
        tbody.appendChild(tr);
    });
});

// ==========================================
// FLUX TEMPS RÉEL : REGISTRE ET ACTIONS DES AGENTS
// ==========================================
onSnapshot(collection(db, "agents_blackwater"), (snapshot) => {
    const tbody = document.getElementById('agentsBody');
    tbody.innerHTML = '';

    snapshot.forEach((agentDoc) => {
        const agent = agentDoc.data();
        const tr = document.createElement('tr');

        const statutHTML = agent.approuve 
            ? `<span class="status-badge valide">✓ VALIDÉ</span>` 
            : `<span class="status-badge attente">⚠ EN ATTENTE</span>`;

        let actionsHTML = `<div class="action-buttons-cell">`;
        if (!agent.approuve) {
            actionsHTML += `<button class="btn-approve" data-id="${agentDoc.id}">[ VALIDER ]</button>`;
        } else {
            actionsHTML += `<i>Officier Actif</i> `;
        }
        actionsHTML += `<button class="btn-delete" data-id="${agentDoc.id}">[ RAYER ]</button>`;
        actionsHTML += `</div>`;

        tr.innerHTML = `
            <td><strong>${agent.prenom} ${agent.nom}</strong></td>
            <td>${agent.grade}</td>
            <td>${statutHTML}</td>
            <td>${actionsHTML}</td>
        `;
        tbody.appendChild(tr);
    });

    // Bouton Valider
    document.querySelectorAll('.btn-approve').forEach(button => {
        button.addEventListener('click', async (e) => {
            const idAgentAValider = e.target.getAttribute('data-id');
            const agentRef = doc(db, "agents_blackwater", idAgentAValider);
            await updateDoc(agentRef, { approuve: true });
            alert("Inscription officialisée !");
        });
    });

    // Bouton Rayer / Supprimer
    document.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', async (e) => {
            const idAgentASupprimer = e.target.getAttribute('data-id');
            if (confirm("Rayer définitivement cet officier ?")) {
                const agentRef = doc(db, "agents_blackwater", idAgentASupprimer);
                await deleteDoc(agentRef);
                alert("L'agent a été retiré du registre.");
            }
        });
    });
});

