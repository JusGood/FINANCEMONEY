
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
      method: t.method,
      status: t.isSold ? 'Sécurisé' : 'Audit Ouvert'
    }));

    const prompt = `
      CONTEXTE : Vault Alpha 2027. Investisseurs Haute Fidélité : ${owner === Owner.GLOBAL ? 'Larbi & Yassine' : owner}.
      DONNÉES : ${JSON.stringify(summary.slice(-20))}
      MISSION : Analyse de performance radicale.
      CONTRAINTES : 3 points précis. 10 mots max par point. 
      TON : Froid, chirurgical, autoritaire, visionnaire. 
      STYLE : Ne mâche pas tes mots sur le ratio profit/risque.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "ANALYSE INDISPONIBLE. GARDEZ LA DISCIPLINE.";
  } catch (error) {
    console.error("Gemini Critical Failure:", error);
    return "TERMINAL IA HORS-LIGNE. RIGUEUR ABSOLUE REQUISE.";
  }
};

export const getCryptoPrices = async (symbols: string[]): Promise<Record<string, number>> => {
  if (symbols.length === 0) return {};
  try {
    const ai = getAIInstance();
    const prompt = `PRIX TEMPS RÉEL EUR : ${symbols.join(', ')}. JSON UNIQUEMENT: {"SYMBOLE": PRIX_NUM}.`;

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
    console.error("Crypto Stream Error:", error);
    return { "BTC": 95000, "ETH": 2600, "LTC": 92, "SOL": 185 };
  }
};
