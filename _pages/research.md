---
layout: archive
title: "Research"
permalink: /research/
author_profile: true
redirect_from:
  - /teaching/2015-spring-teaching-1
  - /teaching/2015-spring-teaching-1/
---

## Coherent response and residual fluctuations in a light-driven circadian oscillator

**Manuscript in preparation**

Working with Professor Charles S. Peskin, I study how periodic light shapes the repeatable response and residual fluctuations of a stochastic circadian oscillator. We derived an exact factorization of protein–light correlation into a waveform shape factor and the square root of the coherent variance fraction. Across the tested parameter range, stronger forcing increased correlation mainly by strengthening the repeatable response, while residual variance responded differently at different volumes.

My contributions include deriving and testing the variance and correlation decompositions, benchmarking stochastic simulation methods against Gillespie simulations, and implementing periodic linear-noise and local Floquet analyses.

<figure style="max-width:640px;margin:1em auto;">
  <a href="{{ '/research/circadian-oscillator/' | relative_url }}" aria-label="Read about the circadian oscillator project">
    <img src="{{ '/images/research/circadian-oscillator-schematic.png' | relative_url }}"
         width="1512" height="436" style="display:block;width:100%;max-width:640px;height:auto;margin:0 auto;"
         alt="Negative-feedback circuit of a light-driven circadian oscillator: nuclear mRNA is exported to the cytoplasm and translated into protein without being consumed; cytoplasmic protein enters the nucleus and represses transcription. Light modulates transcription, and mRNA and protein degrade."
         decoding="async">
  </a>
  <figcaption>The cellular oscillator model follows <a href="https://doi.org/10.1103/PhysRevE.97.062416">Wang and Peskin (2018)</a>.</figcaption>
</figure>

[Read about the project]({{ '/research/circadian-oscillator/' | relative_url }}){: .btn .btn--primary }

## Undergraduate thesis

**Physics-informed neural networks for the semiclassical Schrödinger equation**

My undergraduate thesis, supervised by Professor Lihui Chai at Sun Yat-sen University, explored physics-informed neural networks (PINNs) for the semiclassical Schrödinger equation. I combined PINNs with a WKB expansion to approximate the phase and amplitude of oscillatory solutions, and compared the reconstructed wave functions with a spectral solver.

I also investigated how collocation-point sampling, the number of training points, and training duration affected PINN training. This project grew out of my studies in numerical analysis and numerical partial differential equations under Professor Chai and my participation in his weekly seminar.

[Read thesis (PDF)]({{ '/files/research/Liyan_Gong_Undergraduate_Thesis_Public.pdf' | relative_url }})

## Text-to-Video Generation: Adapting RPG-Inspired Control to WAN

**2025 · Collaborative research project**

How can text-guided spatial planning be adapted from image generation to video, while preserving subject identity and coherent motion? Working with Xuezheng Yang under the guidance of Prof. Peng Qi and Dr. Zhuang, I explored adapting [Recaption, Plan and Generate (RPG)](https://proceedings.mlr.press/v235/yang24ai.html), a framework for text-guided regional image generation, to [WAN (Tongyi Wanxiang)](https://github.com/Wan-Video/Wan2.1), Alibaba’s video generation model family. My work focused on attention mechanisms and [Low-Rank Adaptation (LoRA)](https://arxiv.org/abs/2106.09685), a parameter-efficient method that learns low-rank weight updates while keeping pretrained model weights fixed.

**My contributions**

- Studied the RPG and WAN papers and codebases, tracing how prompts, spatial layouts, and conditioning information enter the generation process.
- Proposed adapting RPG-style attention components to WAN and contributed to code modification and debugging, focusing on module interfaces and tensor-shape compatibility.
- Investigated LoRA integration and the architectural challenges of extending regional control to multi-subject video generation.

The prototype produced video output after attention-code modifications. Multi-subject control and LoRA-based composition are presented here as exploratory directions, rather than validated results.

<figure>
  <a href="{{ '/images/research/rpg-wan-concept.svg' | relative_url }}" aria-label="View the text-to-video project diagram at full size">
    <img src="{{ '/images/research/rpg-wan-concept.svg' | relative_url }}"
         width="1200" height="840"
         alt="RPG-inspired control for WAN: a solid path connects text descriptions, attention adaptation in a WAN prototype, and generated videos. Dashed paths distinguish exploratory RPG-inspired spatial planning and LoRA integration for identity and motion control."
         loading="lazy" decoding="async">
  </a>
</figure>
