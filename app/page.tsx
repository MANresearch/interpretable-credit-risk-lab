"use client";

import { useMemo, useState } from "react";
import {
  fuzzyScore,
  labels,
  memberships,
  riskLabel,
  ruleSystems,
  scenarios,
  tailDependence,
  type RuleSystem,
  type ScenarioName,
} from "./model";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 1,
});

const pct = (value: number, digits = 1) => `${(value * 100).toFixed(digits)}%`;

const riskColor: Record<string, string> = {
  Low: "#2bd49b",
  Moderate: "#f2c94c",
  High: "#ff8a4c",
  Critical: "#ff5a6f",
};

const pipeline = [
  ["01", "Inputs", "PD, LGD, EAD, rating and segment"],
  ["02", "Fuzzy inference", "Linguistic membership + transparent rules"],
  ["03", "Dependence", "Student-t copula for common shocks"],
  ["04", "Loss engine", "Seeded second-order Monte Carlo"],
  ["05", "Risk output", "IRC, EL, VaR, tail loss and diagnostics"],
];

const productionSteps = [
  {
    title: "Data contract",
    copy: "Replace synthetic scenarios with a versioned loan-month panel: performance, recovery cash flows, covariates, exposure and lineage.",
  },
  {
    title: "Model stack",
    copy: "Calibrate PD and LGD out of sample, preserve the fuzzy layer as an explainable challenger, and estimate dependence by segment and regime.",
  },
  {
    title: "Validation",
    copy: "Add temporal and portfolio holdouts, calibration curves, ranking metrics, stability tests, benchmark models and tail backtesting.",
  },
  {
    title: "Controls",
    copy: "Package reproducible runs, schema checks, model registry metadata, monitoring thresholds, approvals and human override paths.",
  },
];

function NumberSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format = pct,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}) {
  return (
    <label className="control">
      <span>
        {label}
        <strong>{format(value)}</strong>
      </span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function MembershipBars({ value }: { value: number }) {
  const values = memberships(value);
  return (
    <div className="membership-bars" aria-label="Fuzzy membership strengths">
      {labels.map((label) => (
        <div className="membership-row" key={label}>
          <span>{label}</span>
          <div className="membership-track">
            <i
              style={{
                width: `${values[label] * 100}%`,
                background: riskColor[label],
              }}
            />
          </div>
          <b>{values[label].toFixed(2)}</b>
        </div>
      ))}
    </div>
  );
}

function Heatmap({ system }: { system: RuleSystem }) {
  const cells = useMemo(() => {
    const result: Array<{ score: number; pd: number; lgd: number }> = [];
    for (let row = 8; row >= 0; row -= 1) {
      for (let column = 0; column < 9; column += 1) {
        const pdValue = row / 8;
        const lgdValue = column / 8;
        result.push({
          score: fuzzyScore(pdValue, lgdValue, system),
          pd: pdValue,
          lgd: lgdValue,
        });
      }
    }
    return result;
  }, [system]);

  return (
    <div className="heatmap-wrap">
      <div className="axis-label vertical">Probability of default</div>
      <div className="heatmap" role="img" aria-label={`${system} fuzzy decision surface`}>
        {cells.map((cell) => {
          const hue = 155 - cell.score * 155;
          return (
            <div
              key={`${cell.pd}-${cell.lgd}`}
              title={`PD ${pct(cell.pd, 0)} · LGD ${pct(cell.lgd, 0)} · IRC ${cell.score.toFixed(2)}`}
              style={{ background: `hsl(${hue} 74% 50%)` }}
            />
          );
        })}
      </div>
      <div className="axis-label horizontal">Loss given default →</div>
    </div>
  );
}

export default function Home() {
  const [pd, setPd] = useState(0.18);
  const [lgd, setLgd] = useState(0.48);
  const [system, setSystem] = useState<RuleSystem>("Expert");
  const [rho, setRho] = useState(0.45);
  const [degrees, setDegrees] = useState(5);
  const [scenario, setScenario] = useState<ScenarioName>("Stress");

  const score = fuzzyScore(pd, lgd, system);
  const label = riskLabel(score);
  const lambda = tailDependence(rho, degrees);
  const scenarioData = scenarios[scenario];
  const portfolioEad = 250;
  const expectedLoss = portfolioEad * scenarioData.pd * scenarioData.lgd;

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Interpretable Credit Risk Lab home">
          <span className="brand-mark">IR</span>
          <span>INTERPRETABLE RISK LAB</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#model">Model</a>
          <a href="#dependence">Dependence</a>
          <a href="#portfolio">Portfolio</a>
          <a href="#production">Production</a>
        </nav>
        <a className="header-link" href="https://github.com/MANresearch/interpretable-credit-risk-lab" target="_blank" rel="noreferrer">
          Source code ↗
        </a>
      </header>

      <section className="hero" id="top">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow">END-TO-END MODEL WALKTHROUGH · 2026</p>
          <h1>Credit risk,<br />made <em>interpretable.</em></h1>
          <p className="hero-lede">
            A research prototype combining fuzzy inference, Student-t copulas and
            second-order Monte Carlo to translate uncertain credit inputs into
            explainable borrower and portfolio risk.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#model">Explore the model</a>
            <a className="button secondary" href="#methodology">Read methodology</a>
          </div>
          <div className="signal-row">
            <span><i /> Interpretable rules</span>
            <span><i /> Tail-aware dependence</span>
            <span><i /> Seeded simulation</span>
          </div>
        </div>
        <aside className="hero-panel">
          <div className="panel-topline">
            <span>MODEL PIPELINE</span>
            <span className="live-dot">RESEARCH PROTOTYPE</span>
          </div>
          <div className="pipeline-visual">
            {pipeline.map(([number, title, copy], index) => (
              <div className="pipeline-step" key={number}>
                <span className="step-number">{number}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{copy}</p>
                </div>
                {index < pipeline.length - 1 && <span className="connector" />}
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="context-strip" aria-label="Project context">
        <div><span>Origin</span><strong>ITA academic research</strong></div>
        <div><span>Core methods</span><strong>Fuzzy logic · t-copula · MC²</strong></div>
        <div><span>Primary lens</span><strong>Explainability under uncertainty</strong></div>
        <div><span>Implementation</span><strong>Python source · web walkthrough</strong></div>
      </section>

      <section className="section intro" id="methodology">
        <div className="section-kicker">01 · MODEL THESIS</div>
        <div className="split-heading">
          <h2>Separate the uncertainty<br />you can explain from the tail risk you cannot ignore.</h2>
          <div>
            <p>
              Point estimates of probability of default and loss given default
              suggest more precision than credit decisions usually possess. This
              prototype first converts those estimates into overlapping linguistic
              states, then aggregates transparent expert rules into an
              Interpretable Risk Classification score.
            </p>
            <p>
              At portfolio level, a Student-t copula introduces common shocks and
              tail dependence. A two-layer simulation separates parameter
              uncertainty from conditional loss variability.
            </p>
          </div>
        </div>
        <div className="thesis-grid">
          <article><span>01</span><h3>Fuzzify</h3><p>Represent ambiguous PD and LGD estimates as degrees of membership, not brittle cutoffs.</p></article>
          <article><span>02</span><h3>Explain</h3><p>Map activated states through a 4 × 4 rule base that can be reviewed by risk stakeholders.</p></article>
          <article><span>03</span><h3>Depend</h3><p>Model joint defaults with heavier tails than a Gaussian dependence assumption permits.</p></article>
          <article><span>04</span><h3>Stress</h3><p>Run deterministic, seeded scenarios and expose sensitivity, concentration and tail metrics.</p></article>
        </div>
      </section>

      <section className="section dark-section" id="model">
        <div className="section-kicker light">02 · INTERACTIVE FUZZY ENGINE</div>
        <div className="model-layout">
          <div className="controls-card">
            <div className="card-heading">
              <div>
                <span className="mini-label">BORROWER INPUT</span>
                <h2>From estimates to an explainable score.</h2>
              </div>
              <div className="system-tabs" aria-label="Rule system">
                {(Object.keys(ruleSystems) as RuleSystem[]).map((name) => (
                  <button
                    key={name}
                    className={system === name ? "active" : ""}
                    onClick={() => setSystem(name)}
                    type="button"
                  >{name}</button>
                ))}
              </div>
            </div>
            <div className="two-controls">
              <div>
                <NumberSlider label="Probability of default" value={pd} min={0} max={1} step={0.01} onChange={setPd} />
                <MembershipBars value={pd} />
              </div>
              <div>
                <NumberSlider label="Loss given default" value={lgd} min={0} max={1} step={0.01} onChange={setLgd} />
                <MembershipBars value={lgd} />
              </div>
            </div>
            <div className="interpretation-note">
              <strong>What the engine sees</strong>
              <p>
                At these inputs, multiple linguistic states can be active at once.
                Each rule fires at the minimum membership strength; the aggregated
                output is defuzzified into a continuous 0–1 IRC score.
              </p>
            </div>
          </div>
          <aside className="score-card">
            <span className="mini-label">INTERPRETABLE RISK CLASSIFICATION</span>
            <div className="score-value">{score.toFixed(3)}</div>
            <div className="score-track"><i style={{ width: `${score * 100}%` }} /></div>
            <div className="score-result" style={{ color: riskColor[label] }}>
              <span style={{ background: riskColor[label] }} />{label} risk
            </div>
            <dl>
              <div><dt>Rule system</dt><dd>{system}</dd></div>
              <div><dt>Activated rules</dt><dd>{labels.filter((item) => memberships(pd)[item] > 0).length * labels.filter((item) => memberships(lgd)[item] > 0).length}</dd></div>
              <div><dt>Output scale</dt><dd>0.00 — 1.00</dd></div>
            </dl>
          </aside>
        </div>

        <div className="rules-layout">
          <div>
            <span className="mini-label">DECISION SURFACE · {system.toUpperCase()}</span>
            <Heatmap system={system} />
          </div>
          <div>
            <span className="mini-label">4 × 4 RULE BASE</span>
            <div className="rule-table" role="table" aria-label={`${system} rule base`}>
              <div className="corner">PD \ LGD</div>
              {labels.map((item) => <div className="table-head" key={`head-${item}`}>{item}</div>)}
              {ruleSystems[system].map((row, index) => (
                <div className="rule-row" key={labels[index]}>
                  <div className="row-head">{labels[index]}</div>
                  {row.map((item, cell) => (
                    <div className={`rule-cell risk-${item.toLowerCase()}`} key={`${item}-${cell}`}>{item}</div>
                  ))}
                </div>
              ))}
            </div>
            <p className="caption">
              Rows are PD states; columns are LGD states. Comparing systems makes
              judgment differences explicit instead of hiding them inside weights.
            </p>
          </div>
        </div>
      </section>

      <section className="section" id="dependence">
        <div className="section-kicker">03 · TAIL DEPENDENCE</div>
        <div className="split-heading compact">
          <h2>Correlation is not enough<br />when defaults cluster.</h2>
          <p>
            The Student-t copula preserves rank correlation while allowing joint
            extreme moves. Lower degrees of freedom produce heavier tails; higher
            correlation raises the probability of simultaneous distress.
          </p>
        </div>
        <div className="dependence-grid">
          <div className="tail-card">
            <NumberSlider label="Asset correlation (ρ)" value={rho} min={0.05} max={0.9} step={0.01} onChange={setRho} format={(v) => v.toFixed(2)} />
            <NumberSlider label="Degrees of freedom (ν)" value={degrees} min={2} max={30} step={1} onChange={setDegrees} format={(v) => v.toFixed(0)} />
            <div className="lambda-result">
              <span>Upper/lower tail dependence</span>
              <strong>{pct(lambda, 2)}</strong>
              <p>Probability that one latent risk factor is extreme, conditional on another being equally extreme.</p>
            </div>
          </div>
          <div className="cluster-visual" aria-label="Illustration of correlated tail clustering">
            <div className="cluster-title"><span>GAUSSIAN-LIKE CENTER</span><span>T-COPULA TAIL</span></div>
            <div className="scatter-stage">
              {Array.from({ length: 42 }, (_, index) => {
                const angle = index * 2.399;
                const radius = 8 + ((index * 17) % 31);
                const left = 48 + Math.cos(angle) * radius * (0.7 + rho * 0.5);
                const top = 51 + Math.sin(angle) * radius;
                const tailPoint = index > 34;
                return <i key={index} className={tailPoint ? "tail-point" : ""} style={{ left: `${tailPoint ? Math.min(94, left + 24) : left}%`, top: `${tailPoint ? Math.min(94, top + 20) : top}%` }} />;
              })}
              <span className="tail-zone">JOINT TAIL</span>
            </div>
            <p>Illustrative latent-variable view. The calculator uses the analytical bivariate t-copula tail-dependence formula.</p>
          </div>
        </div>
      </section>

      <section className="section portfolio-section" id="portfolio">
        <div className="section-kicker">04 · PORTFOLIO STRESS LAB</div>
        <div className="portfolio-head">
          <div>
            <h2>One portfolio.<br />Three economic regimes.</h2>
            <p>Synthetic seven-segment portfolio · $250M EAD · deterministic research parameters</p>
          </div>
          <div className="scenario-tabs">
            {(Object.keys(scenarios) as ScenarioName[]).map((name) => (
              <button key={name} type="button" onClick={() => setScenario(name)} className={scenario === name ? "active" : ""}>{name}</button>
            ))}
          </div>
        </div>
        <div className="metric-grid">
          <article><span>Weighted PD</span><strong>{pct(scenarioData.pd, 2)}</strong><small>{scenarioData.note}</small></article>
          <article><span>Weighted LGD</span><strong>{pct(scenarioData.lgd, 1)}</strong><small>Exposure-weighted severity</small></article>
          <article><span>Expected loss</span><strong>{money.format(expectedLoss)}M</strong><small>{scenarioData.expectedLoss.toFixed(2)}% of EAD</small></article>
          <article className="accent-metric"><span>Tail loss</span><strong>{money.format(scenarioData.tail)}M</strong><small>Illustrative 99.9% conditional tail</small></article>
        </div>
        <div className="distribution-card">
          <div className="distribution-copy">
            <span className="mini-label">LOSS DISTRIBUTION</span>
            <h3>Dependence stretches the right tail.</h3>
            <p>
              Conditional defaults are drawn after common t-copula shocks. The
              resulting distribution shifts from granular idiosyncratic loss toward
              clustered portfolio events.
            </p>
            <dl>
              <div><dt>99% VaR</dt><dd>{money.format(scenarioData.var)}M</dd></div>
              <div><dt>99.9% tail</dt><dd>{money.format(scenarioData.tail)}M</dd></div>
              <div><dt>Simulation</dt><dd>Seeded MC²</dd></div>
            </dl>
          </div>
          <div className={`loss-chart scenario-${scenario.toLowerCase().replace("-like", "")}`} aria-label={`${scenario} illustrative loss distribution`}>
            <div className="chart-gridline one" /><div className="chart-gridline two" /><div className="chart-gridline three" />
            <div className="distribution independent" /><div className="distribution dependent" />
            <div className="var-marker" style={{ left: `${Math.min(84, 43 + scenarioData.var)}%` }}><span>99% VaR</span></div>
            <div className="chart-legend"><span className="independent-key">Independent</span><span className="dependent-key">t-copula</span></div>
            <div className="chart-axis"><span>0</span><span>Portfolio loss →</span></div>
          </div>
        </div>
      </section>

      <section className="section validation-section">
        <div className="section-kicker">05 · VALIDATION EVIDENCE</div>
        <div className="validation-grid">
          <div className="validation-lede">
            <h2>Transparent checks before impressive charts.</h2>
            <p>
              The prototype is validated against rule behavior, boundary cases,
              monotonic trends, deterministic seeds and cross-system divergence.
              Evidence is separated from claims the synthetic data cannot support.
            </p>
          </div>
          <div className="validation-stat"><strong>16</strong><span>canonical PD × LGD cases</span><small>12 full-strength · 4 overlapping</small></div>
          <div className="validation-stat"><strong>0.113</strong><span>low-risk anchor</span><small>Near-zero PD and LGD</small></div>
          <div className="validation-stat"><strong>0.890</strong><span>critical-risk anchor</span><small>High PD and LGD</small></div>
          <div className="validation-stat"><strong>&lt; 0.01</strong><span>local reversal tolerance</span><small>Dense surface sweep</small></div>
          <div className="validation-stat"><strong>Seeded</strong><span>reproducible simulation</span><small>Same inputs, same result</small></div>
        </div>
        <div className="limits-callout">
          <span>IMPORTANT BOUNDARY</span>
          <p>
            This is a methodology prototype built with synthetic portfolio data.
            It demonstrates architecture, mathematical reasoning and validation
            discipline; it is not a production scorecard or a claim of predictive
            performance on real borrowers.
          </p>
        </div>
      </section>

      <section className="section production-section" id="production">
        <div className="section-kicker light">06 · FROM PROTOTYPE TO PRODUCTION</div>
        <div className="split-heading compact light-copy">
          <h2>A credible path to a governed<br />credit-risk system.</h2>
          <p>
            The research design becomes production-ready by replacing assumptions
            with observed data, testing each layer independently and adding the
            operational controls that model risk management requires.
          </p>
        </div>
        <div className="production-list">
          {productionSteps.map((step, index) => (
            <article key={step.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
              <i>→</i>
            </article>
          ))}
        </div>
        <div className="production-stack">
          <span>INGEST</span><i>→</i><span>CALIBRATE</span><i>→</i><span>SIMULATE</span><i>→</i><span>VALIDATE</span><i>→</i><span>MONITOR</span>
        </div>
      </section>

      <section className="section author-section">
        <div>
          <span className="section-kicker">ABOUT THE WORK</span>
          <h2>Research translated into a reviewable risk artifact.</h2>
        </div>
        <div className="author-copy">
          <p>
            Developed by <strong>Matheus de Azevedo Nascimento</strong> with Breno
            Fernando Pereira Molon and Marina Laís Rosa as an academic credit-risk
            project at Instituto Tecnológico de Aeronáutica (ITA).
          </p>
          <p>
            This web experience is an independent English walkthrough of the
            methodology. It preserves the original project&apos;s logic while making
            assumptions, model boundaries and production implications explicit.
          </p>
          <div className="author-links">
            <a href="https://github.com/matheusnascimento-ita/TE264_ITA" target="_blank" rel="noreferrer">Original academic project ↗</a>
            <a href="https://www.linkedin.com/in/matheus-az-nascimento/" target="_blank" rel="noreferrer">LinkedIn profile ↗</a>
          </div>
        </div>
      </section>

      <footer>
        <div className="brand"><span className="brand-mark">IR</span><span>INTERPRETABLE RISK LAB</span></div>
        <p>Credit judgment should be measurable, explainable and honest about uncertainty.</p>
        <span>© 2026 Matheus Nascimento</span>
      </footer>
    </main>
  );
}
