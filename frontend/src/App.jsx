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
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const Active = STEPS.find((s) => s.id === active).Comp;

  return (
    <div className="app">
      <header className="masthead">
        <div className="logo">
          Fit<span>.</span>
        </div>
        <div className="tag">Aligning candidate screening to what each client actually decides on</div>
      </header>

      <div className="key-panel">
        <div className="field">
          <label>OpenAI API key</label>
          <input
            type="password"
            value={openaiApiKey}
            onChange={(e) => setOpenaiApiKey(e.target.value)}
            placeholder="sk-..."
            autoComplete="off"
          />
        </div>
        <p className="note">
          Bring your own key for generation. It is sent only with AI requests and is not saved.
        </p>
      </div>

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

      <Active goTo={setActive} openaiApiKey={openaiApiKey.trim()} />
    </div>
  );
}
