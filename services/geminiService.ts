
import { GoogleGenAI } from "@google/genai";
import { Transaction, Owner } from "../types";

export const getFinancialHealthReport = async (transactions: Transaction[], owner: Owner) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    Analyse ces données de transactions : ${JSON.stringify(summary.slice(-20))}
    
    Formatte ta réponse en 4 points TRÈS COURTS :
    1. État de santé actuel (1 phrase).
    2. Meilleure opportunité détectée (ex: quel type de flip marche le mieux).
    3. Alerte risque (si trop de dépenses ou stock non vendu).
    4. Conseil stratégique pour doubler le capital.
    
    Style : Direct, motivant, professionnel.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "L'IA est actuellement en maintenance. Continue à gérer ton empire manuellement !";
  }
};
