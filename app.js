
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

    let currentAgent = null;

    // =========================
    // INSCRIPTION AGENT
    // =========================
    document.getElementById('btnRegister').addEventListener('click', async () => {

        const nom = document.getElementById('newNom').value.trim().toUpperCase();
        const prenom = document.getElementById('newPrenom').value.trim();
        const grade = document.getElementById('newGrade').value.trim();
        const code = document.getElementById('newCode').value.trim();

        if (!nom || !prenom || !grade || !code) {
            alert("Champs incomplets");
            return;
        }

        const id = `${prenom.toLowerCase()}_${nom.toLowerCase()}`;

        await setDoc(doc(db, "agents_blackwater", id), {
            nom,
            prenom,
            grade,
            code
        });

        alert("Agent enregistré");
    });

    // =========================
    // CHARGER LISTE AGENTS
    // =========================
    onSnapshot(collection(db, "agents_blackwater"), (snapshot) => {

        const select = document.getElementById('agentSelect');
        select.innerHTML = "";

        snapshot.forEach((d) => {
            const a = d.data();

            const option = document.createElement("option");
            option.value = d.id;
            option.textContent = `${a.prenom} ${a.nom} (${a.grade})`;

            select.appendChild(option);
        });
    });

    // =========================
    // LOGIN AGENT
    // =========================
    document.getElementById('btnLogin').addEventListener('click', async () => {

        const id = document.getElementById('agentSelect').value;
        const code = document.getElementById('loginCode').value.trim();

        if (!id || !code) return;

        const ref = doc(db, "agents_blackwater", id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            alert("Agent inexistant");
            return;
        }

        if (snap.data().code !== code) {
            alert("Code incorrect");
            return;
        }

        currentAgent = {
            id,
            ...snap.data()
        };

        document.getElementById('loginStatus').innerText =
            `Connecté: ${currentAgent.prenom} ${currentAgent.nom}`;
    });

    // =========================
    // VERIFICATION SIMPLE
    // =========================
    function requireLogin() {
        if (!currentAgent) {
            alert("Connectez-vous d'abord en tant qu'agent");
            return false;
        }
        return true;
    }

    // =========================
    // AJOUT STOCK
    // =========================
    document.getElementById('btnAjouter').addEventListener('click', async () => {

        if (!requireLogin()) return;

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
            dernierAgent: `${currentAgent.grade} ${currentAgent.prenom} ${currentAgent.nom}`,
            derniereAction: "Ajout"
        });
    });

    // =========================
    // RETRAIT STOCK
    // =========================
    document.getElementById('btnRetirer').addEventListener('click', async () => {

        if (!requireLogin()) return;

        const nom = document.getElementById('retraitPlatNom').value.trim().toLowerCase();
        const qty = parseInt(document.getElementById('retraitQuantite').value);

        if (!nom || isNaN(qty)) return;

        const ref = doc(db, "inventaire_blackwater", nom);
        const snap = await getDoc(ref);

        if (!snap.exists()) return;

        let newQty = snap.data().quantite - qty;

        if (newQty <= 0) {
            await deleteDoc(ref);
        } else {
            await setDoc(ref, {
                nom,
                quantite: newQty,
                dernierAgent: `${currentAgent.grade} ${currentAgent.prenom} ${currentAgent.nom}`,
                derniereAction: `Retrait (-${qty})`
            });
        }
    });

    // =========================
    // INVENTAIRE LIVE
    // =========================
    onSnapshot(collection(db, "inventaire_blackwater"), (snapshot) => {

        const tbody = document.getElementById('inventoryBody');
        tbody.innerHTML = "";

        snapshot.forEach((d) => {
            const data = d.data();

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${data.nom}</td>
                <td>${data.quantite}</td>
                <td>${data.dernierAgent} (${data.derniereAction})</td>
            `;

            tbody.appendChild(tr);
        });
    });

});



