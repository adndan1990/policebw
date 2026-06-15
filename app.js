import {
    db,
    doc,
    setDoc,
    getDoc,
    deleteDoc,
    collection,
    onSnapshot
} from "./firebase.js";

// =========================
// SESSION
// =========================
const agent = JSON.parse(localStorage.getItem("agent"));

if (!agent) {
    window.location.href = "login.html";
}

// affichage agent
const agentInfo = document.getElementById("agentInfo");
if (agentInfo) {
    agentInfo.innerText = `${agent.grade} ${agent.prenom} ${agent.nom}`;
}

// =========================
// VERIFICATION CODE CANDAS
// =========================
async function checkAgentCode() {
    try {
        const id = `${agent.prenom}_${agent.nom}`.toLowerCase();
        const ref = doc(db, "agents", id);
        const snap = await getDoc(ref);

        if (!snap.exists()) return false;

        return snap.data().code === agent.code;

    } catch (err) {
        console.error("Erreur checkAgentCode:", err);
        return false;
    }
}

// =========================
// AJOUT STOCK
// =========================
document.getElementById("btnAjouter")?.addEventListener("click", async () => {

    const ok = await checkAgentCode();
    if (!ok) return alert("❌ Code cadenas invalide");

    const nomInput = document.getElementById("platNom");
    const qtyInput = document.getElementById("platQuantite");

    const nom = nomInput.value.trim().toLowerCase();
    const qty = parseInt(qtyInput.value);

    if (!nom || isNaN(qty) || qty <= 0) {
        return alert("❌ Données invalides");
    }

    try {
        const ref = doc(db, "stock", nom);
        const snap = await getDoc(ref);

        let total = qty;
        if (snap.exists()) {
            total += snap.data().quantite;
        }

        await setDoc(ref, {
            nom,
            quantite: total,
            last: `${agent.prenom} ${agent.nom}`,
            action: "Ajout"
        });

        nomInput.value = "";
        qtyInput.value = "";

    } catch (err) {
        console.error("Erreur ajout stock:", err);
        alert("Erreur serveur");
    }
});

// =========================
// RETRAIT STOCK
// =========================
document.getElementById("btnRetirer")?.addEventListener("click", async () => {

    const ok = await checkAgentCode();
    if (!ok) return alert("❌ Code cadenas invalide");

    const nomInput = document.getElementById("retraitPlatNom");
    const qtyInput = document.getElementById("retraitQuantite");

    const nom = nomInput.value.trim().toLowerCase();
    const qty = parseInt(qtyInput.value);

    if (!nom || isNaN(qty) || qty <= 0) {
        return alert("❌ Données invalides");
    }

    try {
        const ref = doc(db, "stock", nom);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            return alert("⚠ Produit inexistant");
        }

        let current = snap.data().quantite;
        let newQty = current - qty;

        if (newQty <= 0) {
            await deleteDoc(ref);
        } else {
            await setDoc(ref, {
                nom,
                quantite: newQty,
                last: `${agent.prenom} ${agent.nom}`,
                action: `Retrait (-${qty})`
            });
        }

        nomInput.value = "";
        qtyInput.value = "";

    } catch (err) {
        console.error("Erreur retrait stock:", err);
        alert("Erreur serveur");
    }
});

// =========================
// LIVE TABLE INVENTAIRE
// =========================
onSnapshot(collection(db, "stock"), (snap) => {

    const body = document.getElementById("inventoryBody");
    if (!body) return;

    body.innerHTML = "";

    snap.forEach((d) => {
        const data = d.data();

        body.innerHTML += `
            <tr>
                <td>${data.nom}</td>
                <td>${data.quantite}</td>
                <td>${data.last || "—"} ${data.action ? "(" + data.action + ")" : ""}</td>
            </tr>
        `;
    });
});
