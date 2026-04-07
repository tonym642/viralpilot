import Link from "next/link";

export default function Home() {
  return (
    <main
      className="page-shell"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 48px)",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "28px", marginBottom: "8px", fontWeight: 700 }}>
        Welcome to{" "}
        <span
          style={{
            background: "linear-gradient(90deg, #5a9af5, #8b7cf5)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          ViralPilot
        </span>
      </h1>
      <p className="muted" style={{ fontSize: "14px", marginBottom: "24px" }}>
        AI-powered content strategy for your projects.
      </p>
      <Link href="/projects" className="vp-btn-primary">
        Go to Projects
      </Link>
    </main>
  );
}
