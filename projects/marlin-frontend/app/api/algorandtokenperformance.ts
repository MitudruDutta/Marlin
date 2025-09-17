// src/api/performance.ts
export async function optimizePerformance(
  coinId: string,
  riskProfile?: "conservative" | "aggressive" | "moderate"
) {
  try {
    const body: Record<string, any> = { coin_id: coinId };
    if (riskProfile && riskProfile !== "moderate") {
      body.risk_profile = riskProfile;
    }

    const res = await fetch("http://localhost:8000/optimize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      if (res.status === 503) {
        throw new Error("Model not initialized. Try again later.");
      }
      if (res.status === 422) {
        throw new Error("Insufficient historical data to make a prediction.");
      }
      throw new Error("Optimization failed due to server error.");
    }
  
    const data = await res.json();

    return {
      coin_id: data.coin_id,
      risk_profile: data.risk_profile,
      recommended_split: data.recommended_split, // { PT, YT }
      prediction: {
        window: data.prediction.window,
        last_price: data.prediction.last_price,
        predicted_next_price: data.prediction.predicted_next_price,
      },
    };
  } catch (err: any) {
    console.error("Error optimizing performance:", err.message || err);
    return null;
  }
}
