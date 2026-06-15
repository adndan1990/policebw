
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
    // VERIFICATION CADENA
    // =========================
    async function verifierAgent(agent) {

        const ref = doc(db, "agents_blackwater", agent.id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            alert("Agent non enregistré. Accès refusé.");
            return false;
        }

        if (snap.data().code !== agent.code) {
            alert("Code cadenas incorrect. Accès refusé.");
            return false;
        }

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




