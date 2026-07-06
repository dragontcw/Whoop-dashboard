"use client";

import { useEffect, useState } from "react";

const card = {
  background: "#16161d",
  borderRadius: 16,
  padding: "20px 24px",
  minWidth: 220,
  flex: "1 1 220px",
  boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset",
};

const label = { fontSize: 13, color: "#9a9aab", marginBottom: 6 };
const value = { fontSize: 32, fontWeight: 700, lineHeight: 1.1 };
const sub = { fontSize: 13, color: "#7a7a8c", marginTop: 4 };

function formatScore(n, suffix = "") {
  if (n === null || n === undefined) return "—";
  return `${Math.round(n)}${suffix}`;
}

export default function Page() {
  const [state, setState] = useState({ loading: true, connected: false });

  useEffect(() => {
    fetch("/api/whoop/data")
      .then((r) => r.json())
      .then((data) => setState({ loading: false, ...data }))
      .catch((err) =>
        setState({ loading: false, connected: false, error: String(err) })
      );
  }, []);

  if (state.loading) {
    return <Centered>Loading your Whoop data…</Centered>;
  }

  if (!state.connected) {
    return (
      <Centered>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Whoop Dashboard</h1>
        <p style={{ color: "#9a9aab", marginBottom: 24 }}>
          Connect your Whoop account to see recovery, sleep, strain, and
          workouts here.
        </p>
        {state.error && (
          <p style={{ color: "#e5484d", marginBottom: 16 }}>
            {state.error === "invalid_state"
              ? "Login attempt could not be verified — please try again."
              : state.error === "token_exchange_failed"
              ? "Whoop rejected the login — check your Client ID/Secret and redirect URI."
              : state.error === "session_expired"
              ? "Your session expired — please reconnect."
              : state.error}
          </p>
        )}
        <a
          href="/api/auth/login"
          style={{
            display: "inline-block",
            background: "#00d4a1",
            color: "#0b0b0f",
            fontWeight: 700,
            padding: "12px 24px",
            borderRadius: 999,
            textDecoration: "none",
          }}
        >
          Connect Whoop
        </a>
      </Centered>
    );
  }

  if (state.error) {
    return (
      <Centered>
        <p style={{ color: "#e5484d" }}>
          Connected, but couldn't fetch data: {state.detail || state.error}
        </p>
        <a href="/api/auth/logout" style={{ color: "#9a9aab" }}>
          Disconnect and try again
        </a>
      </Centered>
    );
  }

  const latestRecovery = state.recovery?.records?.[0];
  const latestSleep = state.sleep?.records?.[0];
  const latestCycle = state.cycles?.records?.[0];
  const recentWorkouts = state.workouts?.records ?? [];

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 32,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 26 }}>
            {state.profile?.first_name
              ? `${state.profile.first_name}'s Whoop Dashboard`
              : "Whoop Dashboard"}
          </h1>
          <p style={{ margin: "4px 0 0", color: "#7a7a8c", fontSize: 14 }}>
            Live from your Whoop account
          </p>
        </div>
        <a href="/api/auth/logout" style={{ color: "#7a7a8c", fontSize: 13 }}>
          Disconnect
        </a>
      </header>

      <section
        style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}
      >
        <div style={card}>
          <div style={label}>Recovery</div>
          <div style={value}>
            {formatScore(latestRecovery?.score?.recovery_score, "%")}
          </div>
          <div style={sub}>
            HRV {formatScore(latestRecovery?.score?.hrv_rmssd_milli)} ms · RHR{" "}
            {formatScore(latestRecovery?.score?.resting_heart_rate)} bpm
          </div>
        </div>

        <div style={card}>
          <div style={label}>Sleep Performance</div>
          <div style={value}>
            {formatScore(latestSleep?.score?.sleep_performance_percentage, "%")}
          </div>
          <div style={sub}>
            Efficiency{" "}
            {formatScore(latestSleep?.score?.sleep_efficiency_percentage, "%")}
          </div>
        </div>

        <div style={card}>
          <div style={label}>Day Strain</div>
          <div style={value}>
            {latestCycle?.score?.strain != null
              ? latestCycle.score.strain.toFixed(1)
              : "—"}
          </div>
          <div style={sub}>
            Avg HR {formatScore(latestCycle?.score?.average_heart_rate)} bpm
          </div>
        </div>
      </section>

      <section style={card}>
        <div style={{ ...label, marginBottom: 12 }}>Recent workouts</div>
        {recentWorkouts.length === 0 && (
          <div style={sub}>No workouts logged recently.</div>
        )}
        {recentWorkouts.slice(0, 8).map((w) => (
          <div
            key={w.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 0",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              fontSize: 14,
            }}
          >
            <span>{new Date(w.start).toLocaleDateString()}</span>
            <span style={{ color: "#9a9aab" }}>
              Strain {w.score?.strain?.toFixed(1) ?? "—"}
            </span>
            <span style={{ color: "#9a9aab" }}>
              Avg HR {formatScore(w.score?.average_heart_rate)} bpm
            </span>
          </div>
        ))}
      </section>
    </main>
  );
}

function Centered({ children }) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 24,
      }}
    >
      {children}
    </main>
  );
}
