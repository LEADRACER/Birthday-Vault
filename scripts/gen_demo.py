#!/usr/bin/env python3
"""Generate cohesive demo artwork (SVG) for Birthday:Vault.
Light + colourful: warm cream ground, confetti palette, soft glows.
No external deps, fully self-contained."""
import os, random, math

OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "demo")
os.makedirs(OUT, exist_ok=True)

BG = "#FFF7EC"
DOT = "#F2E7D8"
CORAL = "#FF5C5C"; AMBER = "#FF9F1C"; SUN = "#FFD60A"
VIOLET = "#A78BFA"; TEAL = "#2DD4BF"; SKY = "#5BC8F5"; PINK = "#FF8FAB"
INK = "#33202A"

def base(w, h, washes):
    dots = "".join(
        f'<circle cx="{random.Random(i).uniform(0,w)}" cy="{random.Random(i+99).uniform(0,h)}" r="2" fill="{random.Random(i).choice([CORAL,AMBER,TEAL,VIOLET,PINK,SKY])}" opacity="0.16"/>'
        for i in range(40))
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
            f'<rect width="{w}" height="{h}" fill="{BG}"/>' + "".join(washes) + dots)

def wash(cx, cy, r, color, opacity=0.35):
    return (f'<radialGradient id="w{cx}{cy}" cx="{cx}" cy="{cy}" r="{r}">'
            f'<stop offset="0" stop-color="{color}" stop-opacity="{opacity}"/>'
            f'<stop offset="1" stop-color="{color}" stop-opacity="0"/></radialGradient>'
            f'<rect x="0" y="0" width="100%" height="100%" fill="url(#w{cx}{cy})"/>')

def save(name, w, h, body):
    with open(os.path.join(OUT, name), "w") as f:
        f.write(base(w, h, body["washes"]) + body["art"] + "</svg>")
    print("wrote", name)

# 1 — candles (landscape 1200x800): coral candles, amber flames, mint table
ca = ""
ca += f'<rect x="0" y="640" width="1200" height="160" fill="#FFFFFF"/>'
ca += f'<rect x="0" y="640" width="1200" height="6" fill="{INK}" opacity="0.12"/>'
for i, x in enumerate([430, 600, 770]):
    h = 190 + (i % 2) * 40
    col = [CORAL, VIOLET, TEAL][i]
    ca += f'<rect x="{x-16}" y="{640-h}" width="32" height="{h}" fill="{col}" rx="4"/>'
    ca += f'<rect x="{x-16}" y="{640-h}" width="32" height="10" fill="{col}" opacity="0.55"/>'
    fl = 30 + (i % 3) * 8
    ca += f'<ellipse cx="{x}" cy="{640-h-8}" rx="10" ry="{fl}" fill="{AMBER}"/>'
    ca += f'<ellipse cx="{x}" cy="{640-h-6}" rx="5" ry="{fl-9}" fill="{SUN}"/>'
    ca += f'<circle cx="{x}" cy="{640-h-30}" r="70" fill="{SUN}" opacity="0.18"/>'
save("candles.svg", 1200, 800, {
  "washes": [wash(600, 400, 560, PINK, 0.30), wash(200, 120, 300, SKY, 0.28), wash(1000, 700, 340, TEAL, 0.25)],
  "art": ca})

# 2 — sparkler (portrait 800x1200): violet sparks on a sky wash
sp = ""
sp += f'<line x1="400" y1="1150" x2="400" y2="560" stroke="{INK}" stroke-width="5" opacity="0.85"/>'
sp += f'<line x1="400" y1="1150" x2="400" y2="560" stroke="#FFFFFF" stroke-width="2"/>'
sp += f'<circle cx="400" cy="540" r="18" fill="{SUN}"/>'
for a in range(0, 360, 8):
    rad = math.radians(a)
    r1, r2 = random.Random(a).uniform(70, 150), random.Random(a+1).uniform(160, 270)
    col = random.Random(a).choice([VIOLET, PINK, CORAL, AMBER])
    sp += f'<line x1="{400+math.cos(rad)*r1}" y1="{540+math.sin(rad)*r1}" x2="{400+math.cos(rad)*r2}" y2="{540+math.sin(rad)*r2}" stroke="{col}" stroke-width="2.5" opacity="0.8"/>'
    sp += f'<circle cx="{400+math.cos(rad)*(r2+16)}" cy="{540+math.sin(rad)*(r2+16)}" r="3.5" fill="{col}" opacity="0.9"/>'
save("sparkler.svg", 800, 1200, {
  "washes": [wash(400, 540, 460, VIOLET, 0.30), wash(400, 1050, 320, PINK, 0.25)],
  "art": sp})

# 3 — polaroids (portrait 800x1200): white frames, colourful scenes
po = ""
pols = [(300, 240, -8, 340, 430), (430, 620, 5, 380, 480), (260, 880, -14, 360, 450)]
scenes = [(TEAL, SUN), (CORAL, AMBER), (VIOLET, PINK)]
for n, (px, py, rot, pw, ph) in enumerate(pols):
    c1, c2 = scenes[n]
    po += f'<g transform="rotate({rot} {px} {py})">'
    po += f'<rect x="{px-10}" y="{py-10}" width="{pw+20}" height="{ph+20}" fill="#FFFFFF" rx="3" filter="drop-shadow(6px 8px 0 rgba(51,32,42,0.14))"/>'
    po += f'<rect x="{px}" y="{py}" width="{pw}" height="{ph-110}" fill="{c1}" opacity="0.55"/>'
    po += f'<circle cx="{px+pw/2}" cy="{py+(ph-110)*0.45}" r="{min(pw,ph-110)*0.26}" fill="{c2}"/>'
    po += f'<circle cx="{px+pw*0.3}" cy="{py+(ph-110)*0.32}" r="{min(pw,ph-110)*0.12}" fill="#FFFFFF" opacity="0.5"/>'
    po += f'<rect x="{px+18}" y="{py+ph-70}" width="{pw-36}" height="12" fill="{c1}"/>'
    po += f'<rect x="{px+18}" y="{py+ph-50}" width="{(pw-36)*0.55}" height="6" fill="{INK}" opacity="0.18"/>'
    po += f'</g>'
save("polaroids.svg", 800, 1200, {
  "washes": [wash(400, 320, 440, SKY, 0.26), wash(500, 820, 460, PINK, 0.24)],
  "art": po})

# 4 — confetti (landscape 1200x800): full palette on cream
cf = ""
cols = [CORAL, AMBER, SUN, VIOLET, TEAL, SKY, PINK]
for i in range(110):
    rr = random.Random(i)
    x, y = rr.uniform(0, 1200), rr.uniform(0, 800)
    w, h = rr.uniform(6, 18), rr.uniform(14, 40)
    rot = rr.uniform(-60, 60)
    col = rr.choice(cols)
    op = rr.uniform(0.55, 0.95)
    cf += f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{col}" opacity="{op}" transform="rotate({rot} {x} {y})"/>'
cf += f'<circle cx="600" cy="520" r="130" fill="{SUN}" opacity="0.25"/>'
cf += f'<circle cx="600" cy="520" r="84" fill="{AMBER}" opacity="0.35"/>'
cf += f'<circle cx="600" cy="520" r="40" fill="#FFFFFF" opacity="0.9"/>'
save("confetti.svg", 1200, 800, {
  "washes": [wash(600, 380, 540, PINK, 0.24), wash(150, 700, 320, TEAL, 0.22)],
  "art": cf})

# 5 — sunny road (landscape 1200x800): teal sky, amber sun, warm road
rd = ""
rd += f'<rect x="0" y="0" width="1200" height="430" fill="{SKY}" opacity="0.30"/>'
rd += f'<circle cx="600" cy="320" r="130" fill="{SUN}" opacity="0.5"/>'
rd += f'<circle cx="600" cy="320" r="86" fill="{AMBER}" opacity="0.65"/>'
rd += f'<circle cx="600" cy="320" r="42" fill="#FFFFFF" opacity="0.95"/>'
rd += f'<rect x="0" y="430" width="1200" height="370" fill="#F5E4C8"/>'
rd += f'<polygon points="600,430 360,800 840,800" fill="#E9CFA8" stroke="{INK}" stroke-width="3" opacity="0.8"/>'
for (x1, x2) in [(600, 470), (600, 530)]:
    rd += f'<line x1="{x1}" y1="470" x2="{x2}" y2="780" stroke="{INK}" stroke-width="4" opacity="0.35"/>'
    rd += f'<line x1="{x1}" y1="470" x2="{x2}" y2="780" stroke="#FFFFFF" stroke-width="2" opacity="0.6"/>'
rd += f'<rect x="0" y="424" width="1200" height="8" fill="{INK}" opacity="0.15"/>'
save("road.svg", 1200, 800, {
  "washes": [wash(600, 300, 620, SKY, 0.30), wash(600, 760, 380, AMBER, 0.22)],
  "art": rd})

# 6 — balloon (portrait 800x1200): coral balloon on sky wash
bl = ""
bl += f'<path d="M 400 560 Q 430 720 415 1150" stroke="{INK}" stroke-width="3" fill="none" opacity="0.6"/>'
bl += f'<ellipse cx="400" cy="420" rx="120" ry="150" fill="{CORAL}"/>'
bl += f'<ellipse cx="400" cy="420" rx="120" ry="150" fill="url(#bg)"/>'
bl += f'<ellipse cx="368" cy="376" rx="42" ry="62" fill="#FFFFFF" opacity="0.35"/>'
bl += f'<polygon points="380,566 420,566 400,602" fill="{INK}" opacity="0.85"/>'
bl += f'<rect x="388" y="602" width="24" height="16" fill="{INK}" opacity="0.7"/>'
bl += f'<radialGradient id="bg" cx="0.35" cy="0.3" r="0.9"><stop offset="0" stop-color="{CORAL}"/><stop offset="1" stop-color="#D63B4A"/></radialGradient>'
save("balloon.svg", 800, 1200, {
  "washes": [wash(400, 400, 460, SKY, 0.32), wash(400, 950, 340, PINK, 0.24)],
  "art": bl})

print("done")
