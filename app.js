const formulaire = document.querySelector("#qrForm");
const inputLien = document.querySelector("#lien");
const selectTaille = document.querySelector("#taille");
const selectFormat = document.querySelector("#format");
const generation = document.querySelector("#generation");
const placeholder = document.querySelector("#placeholder");
const message = document.querySelector("#message");
const boutonTelecharger = document.querySelector("#telecharger");

let lienActuel = "";
let qrPret = false;

function verifierLien(texte) {
    try {
        const url = new URL(texte);

        if (url.protocol !== "http:" && url.protocol !== "https:") {
            return null;
        }

        return url.href;
    } catch {
        return null;
    }
}

// Construire un QR code dans un conteneur temporaire
function creerCanvas(texte, dimension) {
    return new Promise((resolve, reject) => {
        if (typeof QRCode === "undefined") {
            reject(
                new Error("La bibliothèque QRCode.js n'est pas chargée.")
            );
            return;
        }

        const temporaire = document.createElement("div");

        try {
            new QRCode(temporaire, {
                text: texte,
                width: dimension,
                height: dimension,
                correctLevel: QRCode.CorrectLevel.H
            });

            const canvas = temporaire.querySelector("canvas");

            if (!canvas) {
                reject(new Error("Le QR code n'a pas pu être créé."));
                return;
            }

            resolve(canvas);
        } catch (erreur) {
            reject(erreur);
        }
    });
}

formulaire.addEventListener("submit", async (event) => {
    event.preventDefault();

    const lien = verifierLien(inputLien.value.trim());

    if (!lien) {
        qrPret = false;
        boutonTelecharger.disabled = true;
        message.textContent = "Veuillez entrer un lien HTTP ou HTTPS valide.";
        inputLien.focus();
        return;
    }

    qrPret = false;
    boutonTelecharger.disabled = true;
    message.textContent = "Génération du QR code...";

    try {
        const canvas = await creerCanvas(lien, 180);

        generation.replaceChildren(canvas);

        lienActuel = lien;
        qrPret = true;

        boutonTelecharger.disabled = false;
        message.textContent = "QR code généré avec succès.";
    } catch (erreur) {
        console.error(erreur);
        generation.replaceChildren(placeholder.cloneNode(true));
        message.textContent =
            "Erreur de génération. Vérifiez que les bibliothèques sont chargées.";
    }
});


boutonTelecharger.addEventListener("click", async () => {
    if (!qrPret || !lienActuel) {
        message.textContent = "Générez d'abord un QR code.";
        return;
    }

    const dimension = Number(selectTaille.value);
    const format = selectFormat.value;
    const nomFichier = `QR_Code_${dimension}x${dimension}`;

    boutonTelecharger.disabled = true;
    message.textContent = "Préparation du téléchargement...";

    try {
        const canvas = await creerCanvas(lienActuel, dimension);

        if (format === "png") {
            telechargerFichier(
                canvas.toDataURL("image/png"),
                `${nomFichier}.png`
            );
        }

        else if (format === "jpg") {
          
            const fond = document.createElement("canvas");
            fond.width = dimension;
            fond.height = dimension;

            const contexte = fond.getContext("2d");
            contexte.fillStyle = "#ffffff";
            contexte.fillRect(0, 0, dimension, dimension);
            contexte.drawImage(canvas, 0, 0);

            telechargerFichier(
                fond.toDataURL("image/jpeg", 1),
                `${nomFichier}.jpg`
            );
        }

        else if (format === "pdf") {
            if (!window.jspdf || !window.jspdf.jsPDF) {
                throw new Error("La bibliothèque PDF n'est pas chargée.");
            }

            const { jsPDF } = window.jspdf;

           
            const dimensionMM = dimension * 25.4 / 96;

            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: [dimensionMM, dimensionMM],
                compress: true
            });

            pdf.addImage(
                canvas.toDataURL("image/png"),
                "PNG",
                0,
                0,
                dimensionMM,
                dimensionMM
            );

            pdf.save(`${nomFichier}.pdf`);
        }

        message.textContent =
            `Téléchargement demandé : ${nomFichier}.${format}`;
    } catch (erreur) {
        console.error(erreur);
        message.textContent =
            "Le téléchargement a échoué. Vérifiez les bibliothèques et réessayez.";
    } finally {
        boutonTelecharger.disabled = !qrPret;
    }
});


function telechargerFichier(contenu, nomFichier) {
    const lienTemporaire = document.createElement("a");

    lienTemporaire.href = contenu;
    lienTemporaire.download = nomFichier;

    document.body.appendChild(lienTemporaire);
    lienTemporaire.click();
    lienTemporaire.remove();
}


inputLien.addEventListener("input", () => {
    qrPret = false;
    boutonTelecharger.disabled = true;
    message.textContent = "Cliquez sur « Générer le QR code » pour actualiser.";
});


