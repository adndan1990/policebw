
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
        updateDoc,
        deleteDoc,
        collection,
        onSnapshot
    } = window.firestoreTools;

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

    document.getElementById('btnAjouter').addEventListener('click', async () => {

        const agent = getAgentData();
        if (!agent) return;

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

    document.getElementById('btnRetirer').addEventListener('click', async () => {

        const agent = getAgentData();
        if (!agent) return;

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




