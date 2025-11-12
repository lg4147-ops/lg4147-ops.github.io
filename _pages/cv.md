---
layout: archive
title: "CV"
permalink: /cv/
author_profile: true
redirect_from:
  - /resume
---

{% include base_path %}

Education
======
* M.S. in Math, New York University, 2025-2027 (expected)
* B.S. in Math, Sun Yat-sen University, 2021-2025

Work experience
======

* Fall 2025: Teaching Assistant
  * New York University
  * Supervisor: Professor Ralph Chikhany

* Summer 2015: Research Assistant
  * GitHub University
  * Duties included: Tagging issues
  * Supervisor: Professor Git
  
Skills
======
* Skill 1 Everything related to math!
* Skill 2 : Programming languages
  * Sub-skill 2.1 Python
  * Sub-skill 2.2 Matlab
  * Sub-skill 2.3 C++
  * Sub-skill 2.4 SQL
* Languages
  * Chinese (native)
  * English (proficient)

Publications
======
  <ul>{% for post in site.publications reversed %}
    {% include archive-single-cv.html %}
  {% endfor %}</ul>
  
Talks
======
  <ul>{% for post in site.talks reversed %}
    {% include archive-single-talk-cv.html  %}
  {% endfor %}</ul>
  
Teaching
======
  <ul>{% for post in site.teaching reversed %}
    {% include archive-single-cv.html %}
  {% endfor %}</ul>
  
Service and leadership
======
* Currently signed in to 43 different slack teams
