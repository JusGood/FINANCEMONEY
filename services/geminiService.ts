
import { GoogleGenAI } from "@google/genai";
import { Transaction, Owner } from "../types";

export const getFinancialHealthReport = async (transactions: Transaction[], owner: Owner) => {
  // On initialise à l'intérieur de la fonction pour éviter les erreurs de 'process undefined' au chargement du module
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return "Clé API manquante. Configurez votre Vault.";

    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-3-flash-preview';

    const summary = transactions.map(t => ({
      owner: t.owner,
      type: t.type,
      amount: t.amount,
      profit: t.expectedProfit || 0,
      category: t.category,
      status: t.isSold ? 'Soldé' : 'En cours'
    }));

    const prompt = `
      Agis comme un conseiller financier expert pour ${owner === Owner.GLOBAL ? 'un duo d\'investisseurs (Larbi & Yassine)' : owner}.
      Analyse ces données : ${JSON.stringify(summary.slice(-15))}
      Donne un audit éclair en 3 points de maximum 10 mots chacun. Style : Froid, précis, milliardaire.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "Analyse indisponible.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Système IA hors-ligne. Gardez la discipline.";
  }
};
