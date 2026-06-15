// On attend que la page soit chargée
window.addEventListener('DOMContentLoaded', () => {

    // Vérification Firebase
    if (!window.dbInstance || !window.firestoreTools) {
        console.error("Firebase non chargé (dbInstance ou firestoreTools manquant).");
        alert("Erreur : Firebase n'est pas chargé correctement.");
        return;
    }

    const db = window.dbInstance;

    const {
        doc,
        setDoc,
        getDoc,
        updateDoc,
        deleteDoc,
        collection,
        onSnapshot
    } = window.firestoreTools;

    // =========================
    // Récupération agent
    // =========================
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
            grade,
            nom,
            prenom
        };
    };

    // =========================
    // Vérification agent
    // =========================
    async function EnregistrerOuVerifierAgent(agent) {
        const agentRef = doc(db, "agents_blackwater", agent.id);
        const agentSnap = await getDoc(agentRef);

        if (agentSnap.exists()) {
            if (agentSnap.data().code !== agent.code) {
                alert("Accès refusé ! Code incorrect.");
                return { valide: false };
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

            alert("Nouvel officier enregistré.");
            return { valide: true, approuve: false };
        }
    }

    // =========================
    // Inscription agent
    // =========================
    document.getElementById('btnInscrireAgent').addEventListener('click', async () => {
        const agent = getAgentData();
        if (!agent) return;

        const agentRef = doc(db, "agents_blackwater", agent.id);
        const agentSnap = await getDoc(agentRef);

        if (agentSnap.exists()) {
            alert("Officier déjà enregistré.");
            return;
        }

        await setDoc(agentRef, {
            nom: agent.nom,
            prenom: agent.prenom,
            grade: agent.grade,
            code: agent.code,
            approuve: false
        });

        alert("Demande envoyée au shérif.");
    });

    // =========================
    // AJOUT STOCK
    // =========================
    document.getElementById('btnAjouter').addEventListener('click', async () => {

        const agent = getAgentData();
        if (!agent) return;

        const verification = await EnregistrerOuVerifierAgent(agent);
        if (!verification.valide) return;

        const nomPlat = document.getElementById('platNom').value.trim().toLowerCase();
        const quantiteAjoutee = parseInt(document.getElementById('platQuantite').value);

        if (!nomPlat || isNaN(quantiteAjoutee) || quantiteAjoutee <= 0) {
            alert("Données invalides.");
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
    });

    // =========================
    // RETRAIT STOCK
    // =========================
    document.getElementById('btnRetirer').addEventListener('click', async () => {

        const agent = getAgentData();
        if (!agent) return;

        const agentRef = doc(db, "agents_blackwater", agent.id);
        const agentSnap = await getDoc(agentRef);

        if (!agentSnap.exists() || agentSnap.data().code !== agent.code || !agentSnap.data().approuve) {
            alert("Accès refusé.");
            return;
        }

        const nomPlat = document.getElementById('retraitPlatNom').value.trim().toLowerCase();
        const quantiteRetiree = parseInt(document.getElementById('retraitQuantite').value);

        if (!nomPlat || isNaN(quantiteRetiree) || quantiteRetiree <= 0) {
            alert("Données invalides.");
            return;
        }

        const docRef = doc(db, "inventaire_blackwater", nomPlat);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            alert("Introuvable.");
            return;
        }

        let current = docSnap.data().quantite;

        if (quantiteRetiree > current) {
            alert("Pas assez de stock.");
            return;
        }

        await setDoc(docRef, {
            nom: nomPlat,
            quantite: current - quantiteRetiree,
            dernierAgent: agent.signature,
            derniereAction: `Retrait (-${quantiteRetiree})`
        });
    });

    // =========================
    // INVENTAIRE LIVE
    // =========================
    onSnapshot(collection(db, "inventaire_blackwater"), (snapshot) => {

        const tbody = document.getElementById('inventoryBody');
        tbody.innerHTML = '';

        snapshot.forEach((d) => {
            const data = d.data();

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${data.nom}</strong></td>
                <td>${data.quantite}</td>
                <td>${data.dernierAgent} (${data.derniereAction})</td>
            `;
            tbody.appendChild(tr);
        });
    });

    // =========================
    // AGENTS LIVE
    // =========================
    onSnapshot(collection(db, "agents_blackwater"), (snapshot) => {

        const tbody = document.getElementById('agentsBody');
        tbody.innerHTML = '';

        snapshot.forEach((agentDoc) => {

            const agent = agentDoc.data();

            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${agent.prenom} ${agent.nom}</td>
                <td>${agent.grade}</td>
                <td>${agent.approuve ? "VALIDÉ" : "EN ATTENTE"}</td>
                <td>
                    ${!agent.approuve ? `<button class="btn-approve" data-id="${agentDoc.id}">VALIDER</button>` : ""}
                    <button class="btn-delete" data-id="${agentDoc.id}">RAYER</button>
                </td>
            `;

            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-approve').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                await updateDoc(doc(db, "agents_blackwater", id), { approuve: true });
            });
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                if (confirm("Supprimer ?")) {
                    await deleteDoc(doc(db, "agents_blackwater", id));
                }
            });
        });
    });

});
});



