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
    // AGENT CONNECTÉ (SESSION)
    // =========================
    let agentActif = null;

    const agentSelect = document.getElementById("agentSelect");
    const loginStatus = document.getElementById("loginStatus");

    const codeInput = document.getElementById("agentCadena");

    // =========================
    // CHARGER LISTE AGENTS
    // =========================
    function chargerAgents() {
        onSnapshot(collection(db, "agents_blackwater"), (snapshot) => {

            agentSelect.innerHTML = `<option value="">-- Sélectionner un agent --</option>`;

            snapshot.forEach((d) => {
                const a = d.data();

                const option = document.createElement("option");
                option.value = d.id;
                option.textContent = `${a.prenom} ${a.nom} (${a.grade})`;

                agentSelect.appendChild(option);
            });
        });
    }

    chargerAgents();

    // =========================
    // LOGIN AGENT
    // =========================
    document.getElementById("btnLogin").addEventListener("click", async () => {

        const agentId = agentSelect.value;
        const code = codeInput.value.trim();

        if (!agentId || !code) {
            loginStatus.textContent = "Sélection + code requis.";
            loginStatus.style.color = "red";
            return;
        }

        const ref = doc(db, "agents_blackwater", agentId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            loginStatus.textContent = "Agent inconnu.";
            loginStatus.style.color = "red";
            return;
        }

        const data = snap.data();

        if (data.code !== code) {
            loginStatus.textContent = "Code incorrect.";
            loginStatus.style.color = "red";
            return;
        }

        agentActif = {
            id: agentId,
            ...data,
            signature: `${data.grade} ${data.prenom} ${data.nom}`
        };

        loginStatus.textContent = `Connecté : ${agentActif.signature}`;
        loginStatus.style.color = "green";
    });

    // =========================
    // CHECK LOGIN
    // =========================
    function requireLogin() {
        if (!agentActif) {
            alert("Vous devez être connecté en tant qu'agent.");
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
            dernierAgent: agentActif.signature,
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

        let current = snap.data().quantite;
        let newQty = current - qty;

        if (newQty < 0) return;

        if (newQty === 0) {
            await deleteDoc(ref);
            return;
        }

        await setDoc(ref, {
            nom,
            quantite: newQty,
            dernierAgent: agentActif.signature,
            derniereAction: `Retrait (-${qty})`
        });

    });

    // =========================
    // LIVE INVENTAIRE
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


