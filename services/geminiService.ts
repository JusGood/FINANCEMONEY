
import { GoogleGenAI } from "@google/genai";
import { Transaction, Owner } from "../types";

const getAIInstance = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const getFinancialHealthReport = async (transactions: Transaction[], owner: Owner) => {
  try {
    const ai = getAIInstance();
    if (!ai) return "Analyse indisponible (Clé API manquante).";
    
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

/**
 * Récupère les prix crypto via API publique (Coinbase) pour la précision en temps réel,
 * avec un fallback intelligent via Gemini Search si l'API échoue.
 */
export const getCryptoPrices = async (symbols: string[]): Promise<Record<string, number>> => {
  const fallbacks: Record<string, number> = { "BTC": 95000, "ETH": 2600, "LTC": 92, "SOL": 185, "USDT": 1 };
  if (symbols.length === 0) return {};
  
  const results: Record<string, number> = {};
  
  try {
    // Utilisation de l'API publique de Coinbase (Indice de référence fiable)
    const pricePromises = symbols.map(async (symbol) => {
      try {
        const res = await fetch(`https://api.coinbase.com/v2/prices/${symbol}-EUR/spot`);
        const data = await res.json();
        if (data?.data?.amount) {
          return { symbol, price: parseFloat(data.data.amount) };
        }
      } catch (e) {
        return null;
      }
      return null;
    });

    const prices = await Promise.all(pricePromises);
    prices.forEach(p => {
      if (p) results[p.symbol] = p.price;
    });

    // Si on a récupéré tous les prix via l'API, on renvoie
    if (Object.keys(results).length === symbols.length) return results;
  } catch (err) {
    console.warn("Échec de l'API externe, passage à Gemini Search...");
  }

  // Fallback via Gemini avec recherche web pour les prix manquants
  const missingSymbols = symbols.filter(s => !results[s]);
  if (missingSymbols.length === 0) return results;

  try {
    const ai = getAIInstance();
    if (!ai) return { ...results, ...fallbacks };

    const prompt = `Trouve le prix actuel exact en EUR (Indice de marché) pour : ${missingSymbols.join(', ')}. Réponds en JSON strict : {"SYMBOLE": PRIX_NB}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });

    const aiPrices = JSON.parse((response.text || "{}").replace(/```json|```/g, ''));
    return { ...results, ...aiPrices };
  } catch (error) {
    return { ...results, ...fallbacks };
  }
};
