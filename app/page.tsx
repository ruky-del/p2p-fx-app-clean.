export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>P2P FX App</h1>
      <p>Buy and sell foreign currency easily.</p>

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button style={{ padding: "10px 16px" }}>Buy</button>
        <button style={{ padding: "10px 16px" }}>Sell</button>
        <button style={{ padding: "10px 16px" }}>Delete</button>
      </div>
    </main>
  );
}