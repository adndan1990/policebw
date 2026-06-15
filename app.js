window.addEventListener('DOMContentLoaded', () => {

    // Vérification Firebase
    if (!window.dbInstance || !window.firestoreTools) {
        console.error("Firebase non chargé.");
        alert("Erreur : Firebase non chargé.");
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
    // IDENTITÉ OFFICIER
    // =========================
    const getAgentData = () => {
        const nom = document.getElementById('agentNom').value.trim().toUpperCase();
        const prenom = document.getElementById('agentPrenom').value.trim();
        const grade = document.getElementById('agentGrade').value.trim();
        const code = document.getElementById('agentCadena').value.trim();

        if (!nom || !prenom || !grade || !code) {
            alert("Nom, prénom, grade et code obligatoires.");
            return null;
        }

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
    // AJOUT PLATS
    // =========================
    document.getElementById('btnAjouter').addEventListener('click', async () => {

        const agent = getAgentData();
        if (!agent) return;

        const nomPlat = document.getElementById('platNom').value.trim().toLowerCase();
        const qty = parseInt(document.getElementById('platQuantite').value);

        if (!nomPlat || isNaN(qty) || qty <= 0) {
            alert("Données invalides.");
            return;
        }

        const ref = doc(db, "inventaire_blackwater", nomPlat);
        const snap = await getDoc(ref);

        let total = qty;

        if (snap.exists()) {
            total += snap.data().quantite;
        }

        await setDoc(ref, {
            nom: nomPlat,
            quantite: total,
            dernierAgent: agent.signature,
            derniereAction: "Ajout"
        });

        document.getElementById('platNom').value = '';
        document.getElementById('platQuantite').value = '';
    });

    // =========================
    // RETRAIT + SUPPRESSION AUTO
    // =========================
    document.getElementById('btnRetirer').addEventListener('click', async () => {

        const agent = getAgentData();
        if (!agent) return;

        const nomPlat = document.getElementById('retraitPlatNom').value.trim().toLowerCase();
        const qty = parseInt(document.getElementById('retraitQuantite').value);

        if (!nomPlat || isNaN(qty) || qty <= 0) {
            alert("Données invalides.");
            return;
        }

        const ref = doc(db, "inventaire_blackwater", nomPlat);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            alert("Ce plat n'existe pas.");
            return;
        }

        let current = snap.data().quantite;
        let newQty = current - qty;

        if (newQty < 0) {
            alert("Pas assez de stock.");
            return;
        }

        if (newQty === 0) {
            await deleteDoc(ref);
            alert("Stock épuisé, fiche supprimée.");
            return;
        }

        await setDoc(ref, {
            nom: nomPlat,
            quantite: newQty,
            dernierAgent: agent.signature,
            derniereAction: `Retrait (-${qty})`
        });

        document.getElementById('retraitPlatNom').value = '';
        document.getElementById('retraitQuantite').value = '';
    });

    // =========================
    // INVENTAIRE LIVE
    // =========================
    onSnapshot(collection(db, "inventaire_blackwater"), (snapshot) => {

        const tbody = document.getElementById('inventoryBody');
        tbody.innerHTML = '';

        snapshot.forEach((docu) => {
            const d = docu.data();

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${d.nom}</strong></td>
                <td>${d.quantite}</td>
                <td>${d.dernierAgent} (${d.derniereAction})</td>
            `;

            tbody.appendChild(tr);
        });
    });

});


