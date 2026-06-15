import { db, doc, setDoc, getDoc, deleteDoc, collection, onSnapshot } from "./firebase.js";

// SESSION
const agent = JSON.parse(localStorage.getItem("agent"));

if (!agent) {
    window.location.href = "login.html";
}

document.getElementById("agentInfo").innerText =
    `${agent.grade} ${agent.prenom} ${agent.nom}`;

// VERIF CODE SYSTEM
async function checkAgentCode() {
    const ref = doc(db, "agents", `${agent.prenom}_${agent.nom}`.toLowerCase());
    const snap = await getDoc(ref);

    if (!snap.exists()) return false;
    return snap.data().code === agent.code;
}

// AJOUT STOCK
document.getElementById("btnAjouter").addEventListener("click", async () => {

    const ok = await checkAgentCode();
    if (!ok) return alert("Code invalide");

    const nom = platNom.value.trim().toLowerCase();
    const qty = parseInt(platQuantite.value);

    const ref = doc(db, "stock", nom);
    const snap = await getDoc(ref);

    let total = qty;
    if (snap.exists()) total += snap.data().quantite;

    await setDoc(ref, {
        nom,
        quantite: total,
        last: agent.prenom + " " + agent.nom
    });
});

// RETRAIT STOCK
document.getElementById("btnRetirer").addEventListener("click", async () => {

    const ok = await checkAgentCode();
    if (!ok) return alert("Code invalide");

    const nom = retraitNom.value.trim().toLowerCase();
    const qty = parseInt(retraitQuantite.value);

    const ref = doc(db, "stock", nom);
    const snap = await getDoc(ref);

    if (!snap.exists()) return;

    let newQty = snap.data().quantite - qty;

    if (newQty <= 0) {
        await deleteDoc(ref);
        return;
    }

    await setDoc(ref, {
        nom,
        quantite: newQty,
        last: agent.prenom + " " + agent.nom
    });
});

// LIVE TABLE
onSnapshot(collection(db, "stock"), (snap) => {

    const body = document.getElementById("inventoryBody");
    body.innerHTML = "";

    snap.forEach(d => {
        const data = d.data();

        body.innerHTML += `
            <tr>
                <td>${data.nom}</td>
                <td>${data.quantite}</td>
                <td>${data.last}</td>
            </tr>
        `;
    });
});