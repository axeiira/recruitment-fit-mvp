import React, { useState } from "react";
import IngestScreen from "./screens/IngestScreen.jsx";
import RubricScreen from "./screens/RubricScreen.jsx";
import MatchScreen from "./screens/MatchScreen.jsx";

const STEPS = [
  { id: "ingest", label: "Raw data", Comp: IngestScreen },
  { id: "rubric", label: "Derive rubric", Comp: RubricScreen },
  { id: "match", label: "Fit & prep brief", Comp: MatchScreen },
];

export default function App() {
  const [active, setActive] = useState("ingest");
  const Active = STEPS.find((s) => s.id === active).Comp;

  return (
    <div className="app">
      <header className="masthead">
        <div className="logo">
          Fit<span>.</span>
        </div>
        <div className="tag">Aligning candidate screening to what each client actually decides on</div>
      </header>

      <nav className="stepper">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            className={`step ${active === s.id ? "active" : ""}`}
            onClick={() => setActive(s.id)}
          >
            <span className="num">{i + 1}</span>
            {s.label}
          </button>
        ))}
      </nav>

      <Active goTo={setActive} />
    </div>
  );
}
