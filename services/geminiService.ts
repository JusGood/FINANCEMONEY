
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
      status: t.isSold ? 'Terminé' : 'En attente'
    }));

    const prompt = `
      CONTEXTE : Gestion financière de ${owner === Owner.GLOBAL ? 'Larbi & Yassine' : owner}.
      DONNÉES RÉCENTES : ${JSON.stringify(summary.slice(-20))}
      MISSION : Analyse de rentabilité et conseils de gestion.
      CONTRAINTES : 3 points courts et concrets.
      TON : Professionnel, expert financier, direct.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "Analyse indisponible.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erreur de connexion au service d'analyse.";
  }
};

export const getCryptoPrices = async (symbols: string[]): Promise<Record<string, number>> => {
  if (symbols.length === 0) return {};
  try {
    const ai = getAIInstance();
    const prompt = `Donne les prix actuels en EUR pour : ${symbols.join(', ')}. Format JSON strict : {"SYMBOLE": PRIX_NB}.`;

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
    return { "BTC": 95000, "ETH": 2600, "LTC": 92, "SOL": 185, "USDT": 1 };
  }
};
