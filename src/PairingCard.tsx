import React from "react";
import { AbsoluteFill } from "remotion";

export interface PairingCardProps {
  object: string;
  role: string;
  statement: string;
  date: string;
}

export const PairingCard: React.FC<PairingCardProps> = ({
  object,
  role,
  statement,
  date,
}) => {
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 30% 20%, #1f4d3a 0%, #0d2620 55%, #06140f 100%)",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
        color: "#f4ecd8",
        padding: 96,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
            opacity: 0.7,
          }}
        >
          <span>Everyday Motivation</span>
          <span>{date}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              fontSize: 28,
              letterSpacing: 8,
              textTransform: "uppercase",
              opacity: 0.6,
            }}
          >
            Object · Role
          </div>
          <div
            style={{
              fontSize: 132,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            {object}
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 300,
              fontStyle: "italic",
              opacity: 0.85,
            }}
          >
            as {role}
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 34,
              lineHeight: 1.45,
              maxWidth: 1500,
              opacity: 0.92,
            }}
          >
            {statement}
          </div>
        </div>

        <div
          style={{
            fontSize: 20,
            letterSpacing: 3,
            textTransform: "uppercase",
            opacity: 0.55,
          }}
        >
          A daily pairing — one object, one role, one reframe.
        </div>
      </div>
    </AbsoluteFill>
  );
};
