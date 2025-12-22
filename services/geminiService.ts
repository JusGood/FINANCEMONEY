
import { GoogleGenAI } from "@google/genai";
import { Transaction, Owner } from "../types";

const getAIInstance = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("Clé API manquante");
  return new GoogleGenAI({ apiKey });
};

export const getFinancialHealthReport = async (transactions: Transaction[], owner: Owner) => {
  try {
    const ai = getAIInstance();
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

export const getCryptoPrices = async (symbols: string[]): Promise<Record<string, number>> => {
  if (symbols.length === 0) return {};
  try {
    const ai = getAIInstance();
    const prompt = `Donne-moi le prix actuel en Euros (EUR) pour les cryptomonnaies suivantes : ${symbols.join(', ')}. 
    Réponds UNIQUEMENT avec un objet JSON au format : {"SYMBOLE": PRIX_NUMÉRIQUE}. Exemple: {"LTC": 85.50}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text.replace(/```json|```/g, ''));
  } catch (error) {
    console.error("Crypto Price Error:", error);
    // Fallback statique si l'IA échoue
    return { "BTC": 92000, "ETH": 2400, "LTC": 90, "SOL": 180 };
  }
};
