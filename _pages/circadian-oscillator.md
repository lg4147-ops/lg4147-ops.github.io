---
layout: single
title: "Coherent response and residual fluctuations in a light-driven circadian oscillator"
permalink: /research/circadian-oscillator/
author_profile: true
excerpt: "A research project with Professor Charles Peskin on the repeatable response and residual protein fluctuations of a light-driven stochastic circadian oscillator."
---

**Research with Professor Charles Peskin**  
**Status: Draft manuscript in preparation**

We study how periodic light changes protein fluctuations in a stochastic circadian oscillator. This project brings together applied mathematics and mathematical biology, using stochastic simulation, variance decompositions, and local dynamical analysis to understand the response to a daily light cycle.

## The model and the question

The project follows the cellular oscillator model of [Wang and Peskin (2018)](https://doi.org/10.1103/PhysRevE.97.062416). It tracks nuclear and cytoplasmic mRNA and protein through transcription, transport, translation, and degradation. Nuclear protein represses transcription, while periodic light modulates the transcription rate.

<figure>
  <a href="{{ '/images/research/circadian-oscillator-model.png' | relative_url }}" aria-label="View the cellular oscillator schematic at full size">
    <img src="{{ '/images/research/circadian-oscillator-model.png' | relative_url }}"
         width="1346" height="756"
         alt="Negative-feedback circuit of a light-driven circadian oscillator: nuclear mRNA is exported to the cytoplasm and translated into protein without being consumed; cytoplasmic protein enters the nucleus and represses transcription. Light modulates transcription, and mRNA and protein degrade."
         decoding="async">
  </a>
  <figcaption>The cellular oscillator model follows Wang and Peskin (2018). Select the schematic to view it at full size.</figcaption>
</figure>

A stronger protein–light correlation could reflect a better-matched waveform, a larger repeatable response, or smaller fluctuations around that response. We separate these possibilities rather than relying on the correlation alone.

## Separating the repeatable response from residual variability

Conditioning total protein abundance on light phase gives a mean daily waveform and the variability remaining at a fixed light phase. The total variance splits exactly into coherent variance, <i>S</i>, carried by the mean waveform, and phase-averaged residual variance, <i>N</i>.

The periodic protein–light correlation then factors exactly into a waveform shape factor and the square root of the coherent variance fraction:

<p class="notice" aria-label="Periodic correlation equals the waveform shape factor times the square root of S divided by S plus N.">
  <strong>Periodic correlation = waveform shape factor × √[S / (S + N)]</strong>
</p>

We evaluated this decomposition in twenty Gillespie simulation cases: four volume scales and five light-modulation depths, with a reference dark free-running period of 23.2 hours and a 24-hour light cycle. Each case used sixteen independent 600-day trajectories, discarding the first 100 days.

Across this tested grid, stronger forcing increased the coherent fraction primarily by enlarging the repeatable response. The shape factor changed little, while the residual variance responded differently at different volumes. Increased correlation therefore did not require a reduction in residual variability.

## Describing the geometry of the fluctuations

We fitted closed curves to the simulated nuclear and cytoplasmic protein states, using cross-fitting so that each trajectory was evaluated against a curve fitted without it. The resulting decomposition separates protein variability associated with position along the curve, deviations from it, and their covariance.

In the primary fits, the along-curve contribution accounted for 95.7–98.6% of residual protein variance. This describes the geometry of the protein fluctuations; it is not a measurement of phase-coordinate variance or an attribution to particular reactions.

## Comparing stochastic simulation methods

Under matched simulation conditions, we compared the tested chemical Langevin, hybrid, and Poisson tau-leaping approximations against Gillespie simulations. The comparison examined mean concentrations, phase-centered covariance, and protein–light correlation.

Poisson tau-leaping had the smallest average errors in all three statistics across the twenty cases. The hybrid approximation retained stochastic mRNA reactions and treated protein reactions deterministically; it reproduced mean concentrations relatively well but had larger covariance errors. These results show why checking mean behavior alone is insufficient for evaluating fluctuation statistics.

## Reaction sources and local dynamics

Within the periodic linear-noise approximation (LNA) around a stable light-entrained orbit, we decomposed the predicted residual protein variance by reaction channel. The mRNA-associated reactions contributed approximately 85% over the tested grid. This is a model-based reaction-source decomposition, separate from the geometric analysis above.

A calibrated two-dimensional Floquet map describes how local perturbations rotate and contract from one light cycle to the next while new reaction noise accumulates. Finite deterministic perturbation tests supported the local linearization.

Full-cycle comparisons with Gillespie simulations also exposed its limits: close agreement in periodic correlation could coexist with errors in the mean waveform and phase-resolved residual variance. The comparison includes the change from finite-copy repression to its macroscopic limit, so these discrepancies cannot be attributed solely to linearization. Periodic correlation alone also does not establish 1:1 frequency locking.

## Background reference

G. Wang and C. S. Peskin, “Entrainment of a cellular circadian oscillator by light in the presence of molecular noise,” *Physical Review E* **97**, 062416 (2018). [doi:10.1103/PhysRevE.97.062416](https://doi.org/10.1103/PhysRevE.97.062416).

[Back to Research]({{ '/research/' | relative_url }})
