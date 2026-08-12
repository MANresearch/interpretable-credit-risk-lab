export type RiskLabel = "Low" | "Moderate" | "High" | "Critical";
export type RuleSystem = "Expert" | "ChatGPT" | "Claude";

export const labels: RiskLabel[] = ["Low", "Moderate", "High", "Critical"];

export const ruleSystems: Record<RuleSystem, RiskLabel[][]> = {
  Expert: [
    ["Low", "Low", "Moderate", "Moderate"],
    ["Moderate", "Moderate", "High", "Critical"],
    ["Moderate", "High", "Critical", "Critical"],
    ["High", "Critical", "Critical", "Critical"],
  ],
  ChatGPT: [
    ["Low", "Low", "Moderate", "High"],
    ["Low", "Moderate", "High", "Critical"],
    ["Moderate", "High", "High", "Critical"],
    ["High", "Critical", "Critical", "Critical"],
  ],
  Claude: [
    ["Low", "Low", "Moderate", "High"],
    ["Low", "Moderate", "High", "Critical"],
    ["Moderate", "High", "Critical", "Critical"],
    ["High", "Critical", "Critical", "Critical"],
  ],
};

export function memberships(value: number): Record<RiskLabel, number> {
  const v = Math.max(0, Math.min(1, value));
  return {
    Low: v <= 0 ? 1 : v >= 0.34 ? 0 : (0.34 - v) / 0.34,
    Moderate:
      v <= 0 || v >= 0.67
        ? 0
        : v <= 0.34
          ? v / 0.34
          : (0.67 - v) / 0.33,
    High:
      v <= 0.34 || v >= 1
        ? 0
        : v <= 0.67
          ? (v - 0.34) / 0.33
          : (1 - v) / 0.33,
    Critical: v <= 0.67 ? 0 : v >= 1 ? 1 : (v - 0.67) / 0.33,
  };
}

export function fuzzyScore(
  pd: number,
  lgd: number,
  system: RuleSystem = "Expert",
): number {
  const pdMembership = memberships(pd);
  const lgdMembership = memberships(lgd);
  const outputActivation: Record<RiskLabel, number> = {
    Low: 0,
    Moderate: 0,
    High: 0,
    Critical: 0,
  };
  let numerator = 0;
  let denominator = 0;

  labels.forEach((pdLabel, row) => {
    labels.forEach((lgdLabel, column) => {
      const activation = Math.min(
        pdMembership[pdLabel],
        lgdMembership[lgdLabel],
      );
      const outputLabel = ruleSystems[system][row][column];
      outputActivation[outputLabel] = Math.max(
        outputActivation[outputLabel],
        activation,
      );
    });
  });

  for (let index = 0; index <= 500; index += 1) {
    const point = index / 500;
    const pointMembership = memberships(point);
    const aggregated = Math.max(
      ...labels.map((item) =>
        Math.min(outputActivation[item], pointMembership[item]),
      ),
    );
    numerator += point * aggregated;
    denominator += aggregated;
  }

  return denominator === 0 ? 0 : numerator / denominator;
}

export function riskLabel(score: number): RiskLabel {
  if (score < 0.28) return "Low";
  if (score < 0.52) return "Moderate";
  if (score < 0.76) return "High";
  return "Critical";
}

function logGamma(z: number): number {
  const coefficients = [
    676.5203681218851,
    -1259.1392167224028,
    771.3234287776531,
    -176.6150291621406,
    12.507343278686905,
    -0.13857109526572012,
    9.98436957801957e-6,
    1.5056327351493116e-7,
  ];
  if (z < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  let x = 0.9999999999998099;
  const adjusted = z - 1;
  coefficients.forEach((coefficient, index) => {
    x += coefficient / (adjusted + index + 1);
  });
  const t = adjusted + coefficients.length - 0.5;
  return (
    0.5 * Math.log(2 * Math.PI) +
    (adjusted + 0.5) * Math.log(t) -
    t +
    Math.log(x)
  );
}

function betaFraction(x: number, a: number, b: number): number {
  const maxIterations = 120;
  const epsilon = 3e-10;
  const tiny = 1e-30;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < tiny) d = tiny;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= maxIterations; m += 1) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < epsilon) break;
  }
  return h;
}

function regularizedBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(
    logGamma(a + b) -
      logGamma(a) -
      logGamma(b) +
      a * Math.log(x) +
      b * Math.log(1 - x),
  );
  if (x < (a + 1) / (a + b + 2)) {
    return (front * betaFraction(x, a, b)) / a;
  }
  return 1 - (front * betaFraction(1 - x, b, a)) / b;
}

function studentTCdf(value: number, degrees: number): number {
  const x = degrees / (degrees + value * value);
  const ib = regularizedBeta(x, degrees / 2, 0.5);
  return value >= 0 ? 1 - ib / 2 : ib / 2;
}

export function tailDependence(rho: number, degrees: number): number {
  const boundedRho = Math.max(-0.99, Math.min(0.99, rho));
  const argument = -Math.sqrt(
    ((degrees + 1) * (1 - boundedRho)) / (1 + boundedRho),
  );
  return 2 * studentTCdf(argument, degrees + 1);
}

export const scenarios = {
  Normal: {
    pd: 0.0262,
    lgd: 0.415,
    expectedLoss: 2.72,
    var: 8.64,
    tail: 12.91,
    note: "Through-the-cycle baseline",
  },
  Stress: {
    pd: 0.07,
    lgd: 0.53,
    expectedLoss: 9.28,
    var: 22.34,
    tail: 31.76,
    note: "Broad macro deterioration",
  },
  "2008-like": {
    pd: 0.143,
    lgd: 0.659,
    expectedLoss: 23.56,
    var: 47.83,
    tail: 62.4,
    note: "Severe correlated downturn",
  },
} as const;

export type ScenarioName = keyof typeof scenarios;
