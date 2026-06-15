window.addEventListener('DOMContentLoaded', () => {

    if (!window.dbInstance || !window.firestoreTools) {
        console.error("Firebase non chargé");
        return;
    }

    const db = window.dbInstance;

    const {
        doc,
        setDoc,
        getDoc,
        deleteDoc,
        collection,
        onSnapshot
    } = window.firestoreTools;

    // =========================
    // SESSION / SECURITE
    // =========================
    let failedAttempts = 0;
    let sessionAgent = null;

    function logTentative(agentId, status) {
        console.log(`[LOG] ${agentId} -> ${status}`);
    }

    // =========================
    // AGENT DATA
    // =========================
    const getAgentData = () => {
        const nom = document.getElementById('agentNom').value.trim().toUpperCase();
        const prenom = document.getElementById('agentPrenom').value.trim();
        const grade = document.getElementById('agentGrade').value.trim();
        const code = document.getElementById('agentCadena').value.trim();

        if (!nom || !prenom || !grade || !code) return null;

        return {
            id: `${prenom.toLowerCase()}_${nom.toLowerCase()}`,
            nom,
            prenom,
            grade,
            code,
            signature: `${grade} ${prenom} ${nom}`
        };
    };

    // =========================
    // VERIFICATION AGENT
    // =========================
    async function verifierAgent(agent) {

        if (failedAttempts >= 3) {
            alert("ACCÈS BLOQUÉ (3 tentatives échouées). Contactez le Shérif.");
            return false;
        }

        if (!agent || !agent.id || !agent.code) {
            alert("Agent invalide.");
            return false;
        }

        const ref = doc(db, "agents_blackwater", agent.id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            failedAttempts++;
            logTentative(agent.id, "AGENT INCONNU");
            alert("Agent non enregistré.");
            return false;
        }

        const data = snap.data();

        if (String(data.code).trim() !== String(agent.code).trim()) {
            failedAttempts++;
            logTentative(agent.id, "CODE INCORRECT");
            alert(`Code incorrect (${failedAttempts}/3).`);
            return false;
        }

        sessionAgent = agent;
        failedAttempts = 0;
        logTentative(agent.id, "ACCES AUTORISÉ");
        return true;
    }

    // =========================
    // AJOUT STOCK
    // =========================
    document.getElementById('btnAjouter').addEventListener('click', async () => {

        const agent = getAgentData();
        if (!agent) return;

        const ok = await verifierAgent(agent);
        if (!ok) return;

        const nom = document.getElementById('platNom').value.trim().toLowerCase();
        const qty = parseInt(document.getElementById('platQuantite').value);

        if (!nom || isNaN(qty)) return;

        const ref = doc(db, "inventaire_blackwater", nom);
        const snap = await getDoc(ref);

        let total = qty;
        if (snap.exists()) total += snap.data().quantite;

        await setDoc(ref, {
            nom,
            quantite: total,
            dernierAgent: agent.signature,
            derniereAction: "Ajout"
        });
    });

    // =========================
    // RETRAIT STOCK
    // =========================
    document.getElementById('btnRetirer').addEventListener('click', async () => {

        const agent = getAgentData();
        if (!agent) return;

        const ok = await verifierAgent(agent);
        if (!ok) return;

        const nom = document.getElementById('retraitPlatNom').value.trim().toLowerCase();
        const qty = parseInt(document.getElementById('retraitQuantite').value);

        if (!nom || isNaN(qty)) return;

        const ref = doc(db, "inventaire_blackwater", nom);
        const snap = await getDoc(ref);

        if (!snap.exists()) return;

        let current = snap.data().quantite;
        let newQty = current - qty;

        if (newQty < 0) return;

        if (newQty === 0) {
            await deleteDoc(ref);
        } else {
            await setDoc(ref, {
                nom,
                quantite: newQty,
                dernierAgent: agent.signature,
                derniereAction: `Retrait (-${qty})`
            });
        }
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
                <td>${data.nom}</td>
                <td>${data.quantite}</td>
                <td>${data.dernierAgent} (${data.derniereAction})</td>
            `;

            tbody.appendChild(tr);
        });
    });

});

