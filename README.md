# Interpretable Credit Risk Lab

An independent English web walkthrough of an academic credit-risk prototype developed at Instituto Tecnológico de Aeronáutica (ITA). The experience explains the project end to end and exposes the central calculations through interactive controls.

**Live walkthrough:** [manresearch.github.io/interpretable-credit-risk-lab](https://manresearch.github.io/interpretable-credit-risk-lab/)

## What the site demonstrates

- Mamdani-style fuzzy inference over PD and LGD inputs
- reviewable 4 × 4 rule bases for expert, ChatGPT, and Claude judgments
- analytical Student-t copula tail dependence
- portfolio stress scenarios and second-order Monte Carlo architecture
- validation evidence, limitations, and a productionization roadmap

The portfolio figures are deterministic research illustrations built from synthetic assumptions. They are not production estimates or evidence of predictive performance on real borrowers.

## Run locally

Requirements: Node.js 22.13 or later and pnpm.

```bash
pnpm install
pnpm dev
```

Quality checks:

```bash
pnpm lint
pnpm test
```

Generate the static GitHub Pages bundle:

```bash
pnpm export:static
```

## Project structure

- `app/page.tsx` — interactive narrative and interface
- `app/model.ts` — fuzzy inference, t-distribution utilities, and scenarios
- `app/globals.css` — responsive visual system
- `tests/rendered-html.test.mjs` — rendered-content and calculation checks

## Research provenance

The underlying academic project was developed by Matheus de Azevedo Nascimento, Breno Fernando Pereira Molon, and Marina Laís Rosa. The original source remains available in the [TE264 academic repository](https://github.com/matheusnascimento-ita/TE264_ITA).

## License

This walkthrough is provided for portfolio and educational review. The original academic repository retains its own history and provenance.
