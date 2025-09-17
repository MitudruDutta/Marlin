// src/api/history.ts
export async function tokenhistory(coinId: string, days = 30) {
  try {
    const res = await fetch(
      `http://localhost:8000/coins/${coinId}/history?days=${days}`
    );

    if (!res.ok) {
      if (res.status === 400) {
        throw new Error("Invalid request: days must be >= 1");
      }
      if (res.status === 404) {
        throw new Error("Coin not found or no history available");
      }
      throw new Error("History not available");
    }

    const data = await res.json();


    return {
      prices: data.prices, // [timestamp_ms, price]
    };
  } catch (err: any) {
    console.error("Error fetching token history:", err.message || err);
    return null;
  }
}
