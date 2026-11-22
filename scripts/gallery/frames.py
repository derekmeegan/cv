#!/usr/bin/env python3
"""Render the picture frames used on the /gallery wall.

Each frame is modelled as a height field (the moulding's cross-section swept
around a rectangle, plus carved ornament), then lit like a gilded or ebonised
surface. The result is a square 9-slice texture meant for CSS `border-image`:
corners keep their shape, the middle of each side tiles along the rail, so one
texture fits a picture of any proportion.

    python3 scripts/gallery/frames.py            # render every style
    python3 scripts/gallery/frames.py louis      # render one style

Outputs public/images/gallery/frames/<style>.webp (+ centre ornaments for the
styles that have them) and src/data/gallery/frames.json with the numbers the
component needs.
"""

from __future__ import annotations

import json
import math
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT_DIR = os.path.join(ROOT, "public", "images", "gallery", "frames")
META_PATH = os.path.join(ROOT, "src", "data", "gallery", "frames.json")

SS = 2  # supersampling factor
SLICE = 256  # corner size of the 9-slice texture, in output pixels
TAU = math.tau


# ----------------------------------------------------------------------------
# small numeric helpers
# ----------------------------------------------------------------------------


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def mix(a, b, t):
    return a + (b - a) * t


def blur(a, sigma):
    """Gaussian blur with edge padding (FFT based, fine for these sizes)."""
    if sigma <= 0:
        return a
    pad = int(3 * sigma) + 2
    ap = np.pad(a, pad, mode="edge")
    fy = np.fft.fftfreq(ap.shape[0])[:, None]
    fx = np.fft.rfftfreq(ap.shape[1])[None, :]
    g = np.exp(-2.0 * (math.pi * sigma) ** 2 * (fx * fx + fy * fy))
    out = np.fft.irfft2(np.fft.rfft2(ap) * g, s=ap.shape)
    return out[pad:-pad, pad:-pad].astype(np.float32)


def periodic_noise(n, period, cell, rng, octaves=3):
    """Value noise on an n×n canvas that repeats every `period` pixels, so the
    tiled middle of a rail has no seams."""
    out = np.zeros((period, period), np.float32)
    amp_total = 0.0
    for o in range(octaves):
        c = max(2.0, cell / (2**o))
        g = max(2, int(round(period / c)))
        small = rng.random((g, g)).astype(np.float32)
        tiled = np.tile(small, (3, 3))
        img = Image.fromarray(tiled, mode="F").resize(
            (period * 3, period * 3), Image.BICUBIC
        )
        amp = 1.0 / (2**o)
        out += np.asarray(img)[period : 2 * period, period : 2 * period] * amp
        amp_total += amp
    out /= amp_total
    reps = int(math.ceil(n / period)) + 1
    full = np.tile(out, (reps, reps))[:n, :n]
    return full


# ----------------------------------------------------------------------------
# moulding profile: height as a function of distance across the rail
# ----------------------------------------------------------------------------


class Profile:
    """Cross-section of the moulding, built outside edge → sight edge.

    Widths and heights are fractions of the rail width. Named bands record
    where a segment sits so ornament can be carved into it later.
    """

    def __init__(self):
        self.t = [0.0]
        self.h = [0.0]
        self.bands: dict[str, tuple[float, float]] = {}

    def _segment(self, width, fn, name=None, steps=48):
        t0 = self.t[-1]
        h0 = self.h[-1]
        for i in range(1, steps + 1):
            f = i / steps
            self.t.append(t0 + width * f)
            self.h.append(fn(f, h0))
        if name:
            self.bands[name] = (t0, t0 + width)
        return self

    def line(self, width, to, name=None):
        return self._segment(width, lambda f, h0: h0 + (to - h0) * f, name)

    def flat(self, width, name=None):
        return self._segment(width, lambda f, h0: h0, name)

    def step(self, to, width=0.012):
        return self._segment(
            width, lambda f, h0: h0 + (to - h0) * (f * f * (3 - 2 * f)), None
        )

    def convex(self, width, to, name=None):
        """Quarter-round: leaves fast, arrives flat (rising) or the reverse."""

        def fn(f, h0):
            if to >= h0:
                return h0 + (to - h0) * math.sqrt(max(0.0, 1 - (1 - f) ** 2))
            return to + (h0 - to) * math.sqrt(max(0.0, 1 - f * f))

        return self._segment(width, fn, name)

    def concave(self, width, to, name=None):
        """Cove: hollow quarter-round."""

        def fn(f, h0):
            if to >= h0:
                return h0 + (to - h0) * (1 - math.sqrt(max(0.0, 1 - f * f)))
            return to + (h0 - to) * (1 - math.sqrt(max(0.0, 1 - (1 - f) ** 2)))

        return self._segment(width, fn, name)

    def torus(self, width, rise, name=None, to=None):
        """Half-round bead standing on the current level (optionally sloping)."""

        def fn(f, h0):
            base = h0 if to is None else h0 + (to - h0) * f
            return base + rise * math.sqrt(max(0.0, 1 - (2 * f - 1) ** 2))

        return self._segment(width, fn, name)

    def scotia(self, width, depth, name=None, to=None):
        """Half-round hollow sunk below the current level."""

        def fn(f, h0):
            base = h0 if to is None else h0 + (to - h0) * f
            return base - depth * math.sqrt(max(0.0, 1 - (2 * f - 1) ** 2))

        return self._segment(width, fn, name)

    def ogee(self, width, to, name=None):
        return self._segment(
            width,
            lambda f, h0: h0 + (to - h0) * (0.5 - 0.5 * math.cos(math.pi * f)),
            name,
        )

    def sample(self, tt):
        t = np.asarray(self.t, np.float32)
        h = np.asarray(self.h, np.float32)
        total = t[-1]
        return np.interp(tt * total, t, h, left=0.0, right=float(h[-1]))

    def band(self, name):
        total = self.t[-1]
        a, b = self.bands[name]
        return a / total, b / total


# ----------------------------------------------------------------------------
# canvas: coordinates shared by every ornament
# ----------------------------------------------------------------------------


class Canvas:
    def __init__(self, margin, tile, slice_px=SLICE):
        self.S = slice_px * SS
        self.M = margin * SS
        self.P = tile * SS
        self.W = self.S - self.M  # rail width
        self.N = 2 * self.S + self.P
        n = self.N
        yy, xx = np.mgrid[0:n, 0:n].astype(np.float32)
        xx += 0.5
        yy += 0.5
        self.x, self.y = xx, yy
        # Fold the four corners onto one: a, b are distances from the two
        # nearest canvas edges, so anything written in (a, b) is automatically
        # mirrored around the frame.
        self.a = np.minimum(xx, n - xx)
        self.b = np.minimum(yy, n - yy)
        self.across = np.minimum(self.a, self.b) - self.M  # into the rail
        self.along = np.maximum(self.a, self.b) - self.S  # from the slice line
        self.t = self.across / self.W
        self.horizontal = self.b <= self.a  # top / bottom rails
        # diagonal coordinates at the (folded) corner
        self.ds = (self.a + self.b) / math.sqrt(2)
        self.dw = (self.a - self.b) / math.sqrt(2)
        # distance from the middle of each side, for centre ornaments
        self.mid = n / 2 - np.maximum(self.a, self.b)

    def band_coords(self, t0, t1):
        """Centre, half-width (px) and normalised [-1, 1] coordinate of a band."""
        c = (t0 + t1) / 2 * self.W
        hw = (t1 - t0) / 2 * self.W
        q = (self.across - c) / hw
        return c, hw, q


# ----------------------------------------------------------------------------
# ornament primitives — all return a height contribution in pixels
# ----------------------------------------------------------------------------


def cell(along, period):
    """Position inside a repeating unit, centred: [-period/2, period/2)."""
    return (along % period) - period / 2


def beads(cv, band, period, squash=1.0):
    """A row of pearls filling the band."""
    _, hw, q = cv.band_coords(*band)
    uu = cell(cv.along, period) / (period / 2 * 0.86)
    r2 = uu * uu + q * q
    return hw * squash * np.sqrt(np.clip(1 - r2, 0, None))


def reel_and_bead(cv, band, period):
    """Astragal: a round pearl then two thin discs."""
    _, hw, q = cv.band_coords(*band)
    u = cell(cv.along, period) / (period / 2)
    pearl = np.sqrt(np.clip(1 - (u / 0.52) ** 2 - q * q, 0, None))
    reel = np.sqrt(np.clip(1 - ((np.abs(u) - 0.80) / 0.11) ** 2 - (q / 0.9) ** 2, 0, None))
    return hw * np.maximum(pearl, reel * 0.9)


def flutes(cv, band, period, depth):
    """Parallel channels cut across a cove, each with rounded ends."""
    _, hw, q = cv.band_coords(*band)
    u = cell(cv.along, period) / (period / 2)
    end = np.sqrt(np.clip(1 - np.clip(np.abs(q) - 0.55, 0, None) ** 2 / 0.2, 0, None))
    width = 0.78 * end
    chan = np.sqrt(np.clip(1 - (u / np.maximum(width, 1e-3)) ** 2, 0, None))
    inside = (np.abs(q) < 1.0).astype(np.float32)
    return -depth * chan * inside * (width > 0.02)


def leaf_tips(cv, band, period, height, pointing_in=True):
    """Lamb's-tongue / rais-de-cœur: a row of pointed leaves with a midrib,
    darts between them."""
    _, hw, q = cv.band_coords(*band)
    s = (q + 1) / 2  # 0 at the outer side of the band, 1 at the inner side
    if not pointing_in:
        s = 1 - s
    u = cell(cv.along, period) / (period / 2)  # -1 … 1
    au = np.abs(u)
    # leaf outline: broad at the base, pointed at the tip
    outline = 0.92 * np.power(np.clip(1 - s, 0, 1), 0.62)
    inside = np.clip(1 - au / np.maximum(outline, 1e-3), 0, 1)
    body = np.power(inside, 0.55) * np.sin(np.clip(s, 0, 1) * math.pi * 0.5 + 0.35)
    rib = np.exp(-((au / 0.07) ** 2)) * 0.22 * (s < 0.9)
    leaf = body * (1 - rib) * (np.abs(q) <= 1)
    # dart in the gap between two leaves
    du = 1 - au
    dart = np.clip(1 - du / 0.16, 0, 1) * smoothstep(0.25, 0.6, s) * (s < 1) * 0.75
    return height * np.maximum(leaf, dart)


def egg_and_dart(cv, band, period, height):
    _, hw, q = cv.band_coords(*band)
    u = cell(cv.along, period) / (period / 2)
    egg = np.sqrt(np.clip(1 - (u / 0.56) ** 2 - (q / 0.86) ** 2, 0, None))
    shell_r = np.sqrt((u / 0.74) ** 2 + ((q + 0.15) / 1.02) ** 2)
    shell = np.exp(-(((shell_r - 1.0) / 0.10) ** 2)) * 0.62 * (q > -0.9)
    dart = np.clip(1 - (1 - np.abs(u)) / 0.12, 0, 1) * np.clip(1 - np.abs(q), 0, 1) ** 0.5 * 0.7
    return height * np.maximum(np.maximum(egg, shell), dart) * (np.abs(q) <= 1.02)


def gadroons(cv, band, period, height):
    """Plump convex lobes side by side."""
    _, hw, q = cv.band_coords(*band)
    u = cell(cv.along, period) / (period / 2)
    lobe = np.sqrt(np.clip(1 - (u / 0.94) ** 2, 0, None))
    env = np.sqrt(np.clip(1 - q * q, 0, None))
    return height * lobe * env


def ripples(cv, band, period, depth, wave=0.0):
    """Fine transverse ripple moulding (Dutch 'flammleisten')."""
    _, hw, q = cv.band_coords(*band)
    shift = 0.0
    if wave:
        shift = wave * np.sin(q * math.pi * 1.5)
    rip = 0.5 + 0.5 * np.cos((cv.along + shift) * TAU / period)
    env = smoothstep(1.0, 0.82, np.abs(q))
    return depth * (rip - 0.5) * env


def reeds(cv, band, count, depth):
    """Thin parallel reeds running the length of the rail."""
    _, hw, q = cv.band_coords(*band)
    r = np.abs(np.sin((q + 1) / 2 * math.pi * count))
    return depth * (np.sqrt(np.clip(r, 0, 1)) - 0.6) * (np.abs(q) < 1)


def laurel(cv, band, period, height):
    """Bay-leaf garland on a torus: overlapping leaf pairs in chevrons with a
    berry between, mirrored at each half period so it tiles."""
    _, hw, q = cv.band_coords(*band)
    half = period / 2
    u = cv.along % period
    # direction flips every half period (bound garland)
    w = np.where(u < half, u, period - u) / half  # 0 → 1 → 0
    n_leaves = 3
    f = (w * n_leaves) % 1.0  # position along one leaf
    aq = np.abs(q)
    # leaf: almond shape leaning outward from the centre line
    centre = 0.18 + 0.62 * f
    widthp = 0.44 * np.clip(np.sin(np.clip(f, 0, 1) * math.pi), 0, None) ** 0.7 + 0.02
    dist = (aq - centre) / widthp
    leaf = np.sqrt(np.clip(1 - dist * dist, 0, None)) * (0.55 + 0.45 * np.sin(f * math.pi))
    vein = 1 - 0.25 * np.exp(-((dist / 0.18) ** 2))
    leaf = leaf * vein
    # berry on the centre line where two leaves part
    berry = np.sqrt(np.clip(1 - ((f - 0.08) / 0.10) ** 2 * 0.6 - (q / 0.2) ** 2, 0, None)) * 0.9
    # ribbon tie at the turn-around points
    tie = np.exp(-(((w - 0.0) / 0.035) ** 2)) * np.sqrt(np.clip(1 - q * q, 0, None)) * 1.1
    env = np.sqrt(np.clip(1 - q * q * 0.9, 0, None))
    return height * np.maximum(np.maximum(leaf, berry), tie) * (aq <= 1.02) * (0.45 + 0.55 * env)


def crosshatch(cv, band, pitch, depth):
    """Engraved diamond trellis with a punched dot in each lozenge — the
    ground between carved ornament on French Baroque frames."""
    _, hw, q = cv.band_coords(*band)
    p = cv.along + cv.across
    m = cv.along - cv.across
    l1 = np.abs(((p / pitch) % 1.0) - 0.5) * 2
    l2 = np.abs(((m / pitch) % 1.0) - 0.5) * 2
    lines = np.maximum(smoothstep(0.82, 1.0, l1), smoothstep(0.82, 1.0, l2))
    dot = np.exp(-((l1 / 0.22) ** 2 + (l2 / 0.22) ** 2))
    return -depth * (lines + 0.8 * dot) * (np.abs(q) < 1)


def guilloche(cv, band, period, height):
    """Two interlaced ribbons with a rosette in each eye."""
    c, hw, q = cv.band_coords(*band)
    phase = cv.along * TAU / period
    amp = 0.60
    out = np.zeros_like(q)
    for sgn in (1.0, -1.0):
        qs = sgn * amp * np.sin(phase)
        slope = amp * np.abs(np.cos(phase)) * TAU / period * hw
        d = np.abs(q - qs) / np.sqrt(1 + slope * slope)
        ribbon = np.sqrt(np.clip(1 - (d / 0.15) ** 2, 0, None))
        ribbon = ribbon * (1 - 0.38 * np.exp(-((d / 0.045) ** 2)))
        out = np.maximum(out, ribbon * 0.78)
    uu = cell(cv.along + period / 4, period / 2) / hw
    r = np.sqrt(uu * uu + q * q) + 1e-6
    th = np.arctan2(q, uu)
    petals = 0.70 + 0.30 * np.cos(th * 6.0)
    flower = np.sqrt(np.clip(1 - (r / (0.40 * petals)) ** 2, 0, None))
    flower = flower * (1 - 0.35 * np.exp(-((r / 0.2) ** 2)))
    button = np.sqrt(np.clip(1 - (r / 0.11) ** 2, 0, None))
    out = np.maximum(out, np.maximum(flower * 0.85, button))
    return height * out * smoothstep(1.04, 0.9, np.abs(q))


def rosettes(cv, band, period, height, size=0.5, petals=5):
    """Small flower heads spaced along a band."""
    c, hw, q = cv.band_coords(*band)
    uu = cell(cv.along + period / 2, period) / hw
    r = np.sqrt(uu * uu + q * q) + 1e-6
    th = np.arctan2(q, uu)
    lobe = 0.68 + 0.32 * np.cos(th * petals)
    flower = np.sqrt(np.clip(1 - (r / (size * lobe)) ** 2, 0, None))
    flower = flower * (1 - 0.4 * np.exp(-((r / (size * 0.45)) ** 2)))
    button = np.sqrt(np.clip(1 - (r / (size * 0.26)) ** 2, 0, None))
    # a pair of small leaves either side of each flower
    lf = np.zeros_like(q)
    for sgn in (1.0, -1.0):
        f = (uu * sgn - size * 0.9) / (size * 1.5)
        w = 0.20 * np.clip(np.sin(np.clip(f, 0, 1) * math.pi), 0, None) ** 0.7
        d = q / np.maximum(w, 1e-3)
        lf = np.maximum(lf, np.sqrt(np.clip(1 - d * d, 0, None)) * ((f > 0) & (f < 1)) * (1 - 0.3 * np.exp(-((d / 0.2) ** 2))))
    return height * np.maximum(np.maximum(flower * 0.9, button), lf * 0.6)


def sgraffito(cv, band, period):
    """Flat arabesque for a painted frieze: returns a 0…1 gilding mask."""
    c, hw, q = cv.band_coords(*band)
    phase = cv.along * TAU / period
    stem_q = 0.5 * np.cos(phase)
    slope = np.abs(-0.5 * np.sin(phase) * TAU / period * hw)
    mask = smoothstep(0.075, 0.045, np.abs(q - stem_q) / np.sqrt(1 + slope * slope))
    for k, side in ((0.0, -1.0), (0.5, 1.0)):
        uu = cell(cv.along - k * period, period) / hw
        qq = q - side * 0.22
        r = np.sqrt(uu * uu + qq * qq)
        th = np.arctan2(qq, uu)
        spiral = np.abs(r - 0.16 - 0.30 * ((th * side / TAU) % 1.0))
        mask = np.maximum(mask, smoothstep(0.06, 0.035, spiral) * (r < 0.6))
        mask = np.maximum(mask, smoothstep(0.11, 0.08, r))
    for k, side in ((0.25, 1.0), (0.75, -1.0)):
        uu = cell(cv.along - k * period, period) / hw
        qq = q * side + 0.05
        r = np.sqrt(uu * uu + qq * qq)
        th = np.arctan2(uu, qq)
        petals = np.clip(np.cos(th * 3.5), 0, 1) ** 1.5
        mask = np.maximum(mask, smoothstep(0.02, 0.06, 0.62 * petals - r) * (np.abs(th) < 1.4))
    lines = smoothstep(0.05, 0.02, np.abs(np.abs(q) - 0.88))
    return np.maximum(mask, lines) * (np.abs(q) < 0.98)


# ----------------------------------------------------------------------------
# applied cartouches: shells, scrolls and leaves at the corners and centres
# ----------------------------------------------------------------------------


def _petal(al, pe, length, width, concave):
    """One lobe of a palmette or shell, lying along +al from the hinge:
    narrow at the root, widest near a rounded tip."""
    al0 = np.maximum(length - width, 1e-3)  # centre of the round tip
    root = width * (0.22 + 0.78 * np.clip(al / al0, 0, 1) ** 0.9)
    cap = np.sqrt(np.clip(width * width - (al - al0) ** 2, 0, None))
    wid = np.where(al <= al0, root, cap)
    inside = (al > 0.0) & (al < length)
    d = pe / np.maximum(wid, 1e-3)
    body = np.sqrt(np.clip(1 - d * d, 0, None))
    f = np.clip(al / np.maximum(length, 1e-3), 0, 1)
    if concave:
        # gouged spoon: raised rims, hollow down the middle, tip curled up
        body = body * (1 - 0.46 * np.exp(-((d / 0.5) ** 2)) * smoothstep(0.9, 0.68, f))
    lift = 0.55 + 0.45 * f
    return body * lift * inside


def _palmette(ro, re, reach, spread, count, width, concave=True):
    """Fan of lobes springing from a hinge at the origin toward +ro.
    `reach(theta)` gives each lobe's length."""
    out = np.zeros_like(ro)
    for k in range(count):
        th = (k - (count - 1) / 2) * (2 * spread / (count - 1))
        ct, st = math.cos(th), math.sin(th)
        al = ro * ct + re * st
        pe = -ro * st + re * ct
        out = np.maximum(out, _petal(al, pe, reach(th), width, concave))
    r = np.sqrt(ro * ro + re * re)
    boss = np.sqrt(np.clip(1 - (r / (1.5 * width)) ** 2, 0, None))
    return np.maximum(out, boss * 0.95)


def _leaf(px, py, length, width, curl=0.0):
    """Acanthus-ish leaf lying along +px from the origin."""
    f = px / length
    arch = np.clip(np.sin(np.clip(f, 0, 1) * math.pi), 0, None)
    bend = curl * width * arch
    w = width * arch**0.6 * (1 - 0.35 * f)
    serr = 1 + 0.16 * np.cos(f * math.pi * 9)
    d = (py - bend) / np.maximum(w * serr, 1e-3)
    body = np.sqrt(np.clip(1 - d * d, 0, None))
    rib = 1 - 0.30 * np.exp(-((d / 0.16) ** 2))
    veins = 0.90 + 0.10 * np.cos((f * 9 + np.abs(d) * 2.2) * math.pi)
    return body * rib * veins * ((f > 0) & (f < 1))


def _bud(px, py, radius):
    return np.sqrt(np.clip(1 - (px * px + py * py) / (radius * radius), 0, None))


def corner_cartouche(cv, shell=False, overhang=0.07):
    """Palmette (or scallop shell) filling the corner, with a leaf running a
    short way down each rail from its foot. Lobe tips follow the corner's
    outline, standing just proud of the edge."""
    W = cv.W
    seat = 0.60 * W  # hinge distance from either outer edge
    hinge = cv.M + seat
    da, db = cv.a - hinge, cv.b - hinge
    ro = -(da + db) / math.sqrt(2)  # toward the outside corner
    re = (da - db) / math.sqrt(2)

    def reach(th):
        return (seat + overhang * W) / math.cos(math.pi / 4 - abs(th))

    if shell:
        fan = _palmette(ro, re, reach, 0.80, 9, 0.088 * W, concave=False)
    else:
        fan = _palmette(ro, re, reach, 0.76, 7, 0.098 * W, concave=True)
    along_c = np.maximum(cv.a, cv.b) - cv.M  # distance down the rail from its outer corner
    leaf = _leaf(along_c - 0.57 * W, cv.across - 0.50 * W, 0.38 * W, 0.155 * W)
    bud = _bud(along_c - 0.62 * W, cv.across - 0.50 * W, 0.075 * W)
    return np.maximum(fan, np.maximum(leaf * 0.72, bud * 0.8))


def centre_cartouche(cv, shell=False, overhang=0.08):
    """The same motif on the middle of a side, opening outward."""
    W = cv.W
    seat = 0.62 * W
    ro = seat - cv.across  # outward from the hinge
    re = cv.mid  # folded, so the motif is symmetric about the middle

    def reach(th):
        return min((seat + overhang * W) / max(math.cos(th), 1e-3), 0.78 * W)

    if shell:
        fan = _palmette(ro, re, reach, 1.0, 9, 0.082 * W, concave=False)
    else:
        fan = _palmette(ro, re, reach, 1.0, 7, 0.092 * W, concave=True)
    leaf = _leaf(cv.mid - 0.30 * W, cv.across - 0.50 * W, 0.62 * W, 0.15 * W)
    return np.maximum(fan, leaf * 0.72)


# ----------------------------------------------------------------------------
# lighting and materials
# ----------------------------------------------------------------------------

LIGHT = np.array([-0.40, -0.74, 0.50], np.float32)
LIGHT /= np.linalg.norm(LIGHT)


def cast_shadow(h, steps=44, stride=None):
    """How far each pixel sits below the light's horizon (soft heightfield
    shadow), 0 = lit, 1 = shadowed."""
    stride = stride or SS
    lxy = math.hypot(LIGHT[0], LIGHT[1])
    dx, dy = LIGHT[0] / lxy, LIGHT[1] / lxy
    slope = LIGHT[2] / lxy
    excess = np.zeros_like(h)
    for i in range(1, steps + 1):
        dist = i * stride
        sx, sy = int(round(dx * dist)), int(round(dy * dist))
        shifted = np.roll(h, (-sy, -sx), axis=(0, 1))
        excess = np.maximum(excess, shifted - (h + dist * slope))
    return smoothstep(0.0, 3.0 * SS, excess)


def srgb(lin):
    lin = np.clip(lin, 0, 1)
    return np.where(lin <= 0.0031308, lin * 12.92, 1.055 * np.power(lin, 1 / 2.4) - 0.055)


def lin(r, g, b):
    c = np.array([r, g, b], np.float32) / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4).astype(np.float32)


MATERIALS = {
    # deep, warm water-gilding over red bole
    "gold": dict(
        shadow=lin(50, 30, 12),
        mid=lin(168, 122, 54),
        light=lin(232, 198, 122),
        spec=lin(255, 240, 196),
        dirt=lin(38, 24, 10),
        bole=lin(132, 52, 30),
        shininess=26.0,
        spec_amount=0.55,
        wear=0.34,
        dirt_amount=0.62,
    ),
    # paler, drier oil-gilding — reads lighter and less red
    "pale_gold": dict(
        shadow=lin(70, 48, 18),
        mid=lin(192, 150, 72),
        light=lin(240, 214, 140),
        spec=lin(255, 246, 214),
        dirt=lin(58, 40, 18),
        bole=lin(150, 86, 44),
        shininess=20.0,
        spec_amount=0.42,
        wear=0.22,
        dirt_amount=0.55,
    ),
    # antique, slightly green gold
    "dull_gold": dict(
        shadow=lin(48, 36, 14),
        mid=lin(150, 118, 52),
        light=lin(206, 178, 98),
        spec=lin(240, 226, 170),
        dirt=lin(40, 30, 12),
        bole=lin(110, 60, 30),
        shininess=16.0,
        spec_amount=0.32,
        wear=0.18,
        dirt_amount=0.6,
    ),
    # ebonised pearwood, french-polished
    "ebony": dict(
        shadow=lin(6, 5, 5),
        mid=lin(30, 24, 21),
        light=lin(74, 60, 52),
        spec=lin(226, 214, 200),
        dirt=lin(4, 3, 3),
        bole=lin(70, 44, 30),
        shininess=46.0,
        spec_amount=0.5,
        wear=0.10,
        dirt_amount=0.3,
    ),
    # dark walnut
    "walnut": dict(
        shadow=lin(20, 11, 6),
        mid=lin(72, 44, 24),
        light=lin(128, 86, 50),
        spec=lin(230, 200, 160),
        dirt=lin(12, 7, 4),
        bole=lin(96, 60, 34),
        shininess=30.0,
        spec_amount=0.3,
        wear=0.1,
        dirt_amount=0.4,
    ),
    # painted blue-black panel of a cassetta frieze
    "paint": dict(
        shadow=lin(8, 9, 12),
        mid=lin(26, 30, 38),
        light=lin(58, 64, 76),
        spec=lin(200, 204, 214),
        dirt=lin(6, 6, 8),
        bole=lin(60, 40, 30),
        shininess=22.0,
        spec_amount=0.2,
        wear=0.12,
        dirt_amount=0.3,
    ),
}


def shade(h, material_ids, materials, cv, rng, relief=1.0, grain=1.0):
    """Light the height field. `material_ids` picks a material per pixel."""
    n = cv.N
    gy, gx = np.gradient(h * relief)
    inv = 1.0 / np.sqrt(gx * gx + gy * gy + 1.0)
    nx, ny, nz = -gx * inv, -gy * inv, inv

    diffuse = np.clip(nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2], 0, 1)
    half = LIGHT + np.array([0, 0, 1], np.float32)
    half /= np.linalg.norm(half)
    ndh = np.clip(nx * half[0] + ny * half[1] + nz * half[2], 0, 1)
    # a soft fill from below-right so shadowed faces keep their form
    fill = np.clip(nx * 0.45 + ny * 0.5 + nz * 0.74, 0, 1)

    shadow = cast_shadow(h * relief)
    cavity = h - blur(h, 7.0 * SS)
    occl = np.clip(1.0 + cavity / (16.0 * SS), 0.35, 1.0)
    occl_wide = np.clip(1.0 + (h - blur(h, 22.0 * SS)) / (60.0 * SS), 0.55, 1.0)

    period = cv.P
    n_fine = periodic_noise(n, period, 3.0 * SS, rng, octaves=2)
    n_mid = periodic_noise(n, period, 26.0 * SS, rng, octaves=3)
    n_big = periodic_noise(n, period, 90.0 * SS, rng, octaves=2)

    out = np.zeros((n, n, 3), np.float32)
    for mid_, name in enumerate(materials):
        m = MATERIALS[name]
        sel = material_ids == mid_
        if not sel.any():
            continue
        lit = diffuse * (1 - 0.85 * shadow)
        lum = 0.07 + 1.0 * lit + 0.16 * fill
        lum = lum * occl * occl_wide
        lum = lum * (1 + grain * (0.16 * (n_mid - 0.5) + 0.08 * (n_fine - 0.5) + 0.12 * (n_big - 0.5)))
        lum = np.clip(lum, 0, 1.25)
        a = smoothstep(0.0, 0.62, lum)[..., None]
        b = smoothstep(0.66, 1.08, lum)[..., None]
        col = mix(mix(m["shadow"], m["mid"], a), m["light"], b)
        # grime settles in the hollows
        dirt = np.clip(-cavity / (9.0 * SS), 0, 1) * m["dirt_amount"]
        dirt = dirt * (0.7 + 0.6 * n_mid)
        col = mix(col, m["dirt"] * (0.6 + 0.8 * lum[..., None]), np.clip(dirt, 0, 0.9)[..., None])
        # gilding rubs through to the bole on the high points
        wear = smoothstep(1.5 * SS, 7.0 * SS, cavity) * smoothstep(0.50, 0.72, n_big * 0.5 + n_mid * 0.5)
        col = mix(col, m["bole"] * (0.35 + 0.9 * lum[..., None]), (wear * m["wear"])[..., None])
        spec = np.power(ndh, m["shininess"]) * (1 - shadow) * m["spec_amount"]
        spec = spec * (0.75 + 0.5 * n_fine)
        col = col + m["spec"] * spec[..., None]
        out = np.where(sel[..., None], col, out)
    return out


# ----------------------------------------------------------------------------
# frame styles
# ----------------------------------------------------------------------------


def seed_for(style):
    return sum(ord(c) * (i + 1) for i, c in enumerate(style))


def build(style, tile=None, with_centres=False):
    """Returns (canvas, height field, material ids, material names, ornament
    mask for centre sprites)."""
    spec = STYLES[style]
    cv = Canvas(
        margin=spec["margin"],
        tile=tile or spec["tile"],
        slice_px=spec.get("slice", SLICE),
    )
    rng = np.random.default_rng(seed_for(style))
    return spec["build"](cv, with_centres, rng)


def rail_height(cv, profile, lift=1.0):
    """Sweep the profile around the frame; zero outside the rail."""
    h = profile.sample(np.clip(cv.t, 0, 1)) * cv.W * lift
    return np.where(cv.across >= 0, h, 0.0).astype(np.float32)


def apply(cv, h, profile, shape, height, soften=7.0):
    """Lay an applied ornament (0…1 shape) over the rail: it sits on the plain
    moulding — carried on past the outer edge where the ornament overhangs —
    and hides whatever is carved underneath."""
    extended = profile.sample(np.clip(cv.t, 0.04, 1.0)) * cv.W
    base = blur(extended.astype(np.float32), soften * SS)
    mask = smoothstep(0.02, 0.12, shape)
    return mix(h, base + height * shape, mask), mask


def mitre_leaf(cv, t0, t1, width):
    """A leaf laid across the mitre, the way composition frames hide the joint
    in a fluted cove."""
    root2 = math.sqrt(2)
    s0 = (cv.M + t1 * cv.W) * root2
    s1 = (cv.M + t0 * cv.W) * root2
    f_len = s0 - s1
    leaf = _leaf(s0 - cv.ds, cv.dw, f_len, width * cv.W, curl=0.0)
    return leaf


def sanded(cv, band, rng, amount):
    _, hw, q = cv.band_coords(*band)
    grit = periodic_noise(cv.N, cv.P, 2.2 * SS, rng, octaves=2) - 0.5
    return grit * amount * (np.abs(q) < 0.96)


def style_salon(cv, with_centres, rng):
    """French 19th-century fluted-cove frame: laurel torus on the outside,
    channelled hollow, pearls and a leaf sight edge. The frame the
    Impressionists' dealers put on everything."""
    p = Profile()
    p.step(0.15, 0.02)
    p.torus(0.20, 0.17, "laurel", to=0.20)
    p.flat(0.025)
    p.concave(0.36, 0.085, "cove")
    p.flat(0.02)
    p.torus(0.07, 0.0, "pearls")
    p.step(0.07)
    p.flat(0.13, "frieze")
    p.step(0.085)
    p.line(0.11, 0.03, "sight")
    p.step(0.0, 0.015)
    W = cv.W
    plain = rail_height(cv, p)
    h = plain.copy()

    lb = p.band("laurel")
    c, hw, q = cv.band_coords(*lb)
    torus = np.sqrt(np.clip(1 - q * q, 0, None)) * 0.17 * W
    h = h - torus * (np.abs(q) < 1) * 0.55
    h += laurel(cv, lb, cv.P / 2, 0.135 * W)
    h += flutes(cv, p.band("cove"), cv.P / 8, 0.035 * W)
    h += beads(cv, p.band("pearls"), cv.P / 16) * 1.25
    h += sanded(cv, p.band("frieze"), rng, 1.6 * SS)
    h += leaf_tips(cv, p.band("sight"), cv.P / 8, 0.034 * W)
    cove = p.band("cove")
    h, _ = apply(cv, h, p, mitre_leaf(cv, cove[0] - 0.02, cove[1] + 0.04, 0.17), 0.05 * W)
    ids = np.zeros(h.shape, np.int8)
    return cv, h, ids, ["gold"], None


def style_louis(cv, with_centres, rng):
    """Louis XIV / Régence corner-and-centre frame: a broad swelling carved
    with running foliage on a cross-hatched ground, shells at the corners."""
    p = Profile()
    p.step(0.10, 0.02)
    p.torus(0.085, 0.05, "back")
    p.flat(0.012)
    p.scotia(0.12, 0.045, "hollow", to=0.17)
    p.step(0.19)
    p.torus(0.40, 0.17, "main", to=0.25)
    p.step(0.125)
    p.flat(0.11, "frieze")
    p.step(0.09)
    p.line(0.10, 0.03, "sight")
    p.step(0.0, 0.015)
    W = cv.W
    plain = rail_height(cv, p)
    h = plain.copy()
    h += gadroons(cv, p.band("back"), cv.P / 16, 0.012 * W) - 0.012 * W * 0.5
    main = p.band("main")
    h += crosshatch(cv, main, cv.P / 16, 0.010 * W)
    h += guilloche(cv, main, cv.P / 2, 0.058 * W)
    h += sanded(cv, p.band("frieze"), rng, 1.8 * SS)
    h += leaf_tips(cv, p.band("sight"), cv.P / 8, 0.036 * W)
    h, _ = apply(cv, h, p, corner_cartouche(cv), 0.085 * W)
    mask = None
    if with_centres:
        h, mask = apply(cv, h, p, centre_cartouche(cv), 0.08 * W)
    ids = np.zeros(h.shape, np.int8)
    return cv, h, ids, ["gold"], mask


def style_rocaille(cv, with_centres, rng):
    """Louis XV swept frame: a deep sweeping hollow under a burnished crest,
    with big rocaille shells breaking the outline at corners and centres."""
    p = Profile()
    p.step(0.08, 0.02)
    p.convex(0.09, 0.15)
    p.scotia(0.31, 0.085, "hollow", to=0.29)
    p.torus(0.13, 0.06, "crest")
    p.concave(0.20, 0.10, "slope")
    p.flat(0.10, "frieze")
    p.step(0.075)
    p.torus(0.06, 0.0, "pearls")
    p.line(0.04, 0.03, "sight")
    p.step(0.0, 0.015)
    W = cv.W
    plain = rail_height(cv, p)
    h = plain.copy()
    hollow = p.band("hollow")
    h += crosshatch(cv, hollow, cv.P / 16, 0.008 * W)
    h += rosettes(cv, hollow, cv.P / 2, 0.034 * W, size=0.46)
    h += sanded(cv, p.band("frieze"), rng, 1.6 * SS)
    h += beads(cv, p.band("pearls"), cv.P / 16) * 1.1
    h, _ = apply(cv, h, p, corner_cartouche(cv, shell=True), 0.095 * W)
    mask = None
    if with_centres:
        h, mask = apply(cv, h, p, centre_cartouche(cv, shell=True), 0.09 * W)
    ids = np.zeros(h.shape, np.int8)
    return cv, h, ids, ["pale_gold"], mask


def style_dutch(cv, with_centres, rng):
    """Dutch 17th-century ebonised frame: polished black mouldings between
    bands of fine ripple work, with a thin gilt slip at the sight edge."""
    p = Profile()
    p.step(0.10, 0.02)
    p.torus(0.07, 0.035, "r0")
    p.flat(0.02)
    p.ogee(0.09, 0.20)
    p.torus(0.25, 0.085, "cushion", to=0.21)
    p.step(0.16)
    p.flat(0.13, "r1")
    p.step(0.12)
    p.concave(0.15, 0.055, "cove")
    p.flat(0.085, "r2")
    p.step(0.04)
    p.flat(0.05, "slip")
    p.step(0.0, 0.012)
    W = cv.W
    h = rail_height(cv, p)
    h += ripples(cv, p.band("r0"), cv.P / 40, 0.012 * W)
    h += ripples(cv, p.band("r1"), cv.P / 32, 0.016 * W, wave=0.02 * W)
    h += ripples(cv, p.band("r2"), cv.P / 40, 0.011 * W)
    ids = np.zeros(h.shape, np.int8)
    s0, s1 = p.band("slip")
    ids[(cv.t >= s0 - 0.004) & (cv.across >= 0)] = 1
    return cv, h, ids, ["ebony", "gold"], None


def style_cassetta(cv, with_centres, rng):
    """Italian Renaissance cassetta: gilt mouldings either side of a flat
    painted frieze with a gilded arabesque."""
    p = Profile()
    p.step(0.17, 0.02)
    p.torus(0.12, 0.055, "outer")
    p.step(0.13)
    p.ogee(0.045, 0.085)
    p.flat(0.50, "frieze")
    p.ogee(0.04, 0.125)
    p.torus(0.075, 0.03, "astragal")
    p.step(0.10)
    p.line(0.09, 0.03, "sight")
    p.step(0.0, 0.015)
    W = cv.W
    h = rail_height(cv, p)
    h += egg_and_dart(cv, p.band("outer"), cv.P / 8, 0.03 * W) - 0.012 * W
    h += reel_and_bead(cv, p.band("astragal"), cv.P / 8) * 0.8
    h += leaf_tips(cv, p.band("sight"), cv.P / 8, 0.03 * W)
    frieze = p.band("frieze")
    gild = sgraffito(cv, frieze, cv.P / 2)
    h += gild * 0.9 * SS
    ids = np.zeros(h.shape, np.int8)
    _, _, q = cv.band_coords(*frieze)
    ids[(np.abs(q) < 1.0) & (gild < 0.5) & (cv.across >= 0)] = 1
    return cv, h, ids, ["gold", "paint"], None


def style_reeded(cv, with_centres, rng):
    """Late 19th-century reeded frame in the manner Whistler and Degas
    designed for themselves: clusters of fine reeds, dull gold."""
    p = Profile()
    p.step(0.11, 0.025)
    p.flat(0.04)
    p.flat(0.24, "reeds_a")
    p.step(0.095, 0.02)
    p.concave(0.30, 0.07, "plate")
    p.flat(0.20, "reeds_b")
    p.step(0.05, 0.02)
    p.line(0.10, 0.02, "sight")
    p.step(0.0, 0.015)
    W = cv.W
    h = rail_height(cv, p)
    h += reeds(cv, p.band("reeds_a"), 5, 0.028 * W)
    h += reeds(cv, p.band("reeds_b"), 4, 0.022 * W)
    h += sanded(cv, p.band("plate"), rng, 1.2 * SS)
    ids = np.zeros(h.shape, np.int8)
    return cv, h, ids, ["dull_gold"], None


def style_plain(cv, with_centres, rng):
    """A slim gilt moulding for small pictures and works on paper."""
    p = Profile()
    p.step(0.14, 0.03)
    p.convex(0.26, 0.34)
    p.concave(0.34, 0.12, "cove")
    p.flat(0.03)
    p.torus(0.12, 0.0, "pearls")
    p.step(0.09, 0.02)
    p.line(0.18, 0.03, "sight")
    p.step(0.0, 0.02)
    h = rail_height(cv, p)
    h += beads(cv, p.band("pearls"), cv.P / 8) * 1.1
    ids = np.zeros(h.shape, np.int8)
    return cv, h, ids, ["pale_gold"], None


# `width` is the frame's width as a fraction of the picture's mean side.
STYLES = {
    "louis": dict(build=style_louis, margin=30, tile=256, centres=True, width=0.185),
    "rocaille": dict(build=style_rocaille, margin=40, tile=256, centres=True, width=0.20),
    "salon": dict(build=style_salon, margin=6, tile=256, centres=False, width=0.155),
    "dutch": dict(build=style_dutch, margin=4, tile=256, centres=False, width=0.15),
    "cassetta": dict(build=style_cassetta, margin=4, tile=256, centres=False, width=0.14),
    "reeded": dict(build=style_reeded, margin=3, tile=256, centres=False, width=0.10),
    "plain": dict(build=style_plain, margin=3, tile=128, centres=False, width=0.07, slice=128),
}


# ----------------------------------------------------------------------------
# rendering
# ----------------------------------------------------------------------------


def to_image(rgb, alpha):
    img = np.dstack([srgb(rgb), alpha])
    return Image.fromarray((np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8), "RGBA")


def save(img, name):
    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.join(OUT_DIR, f"{name}.webp")
    img.save(path, "WEBP", quality=86, method=6)
    preview = os.environ.get("FRAME_PREVIEW_DIR")
    if preview:
        img.save(os.path.join(preview, f"{name}.png"))
    return os.path.getsize(path)


CENTRE_LENGTH = 2.0  # length of a centre ornament sprite, in slice widths


def render(style):
    spec = STYLES[style]
    slice_px = spec.get("slice", SLICE)
    cv, h, ids, mats, _ = build(style)
    rng = np.random.default_rng(seed_for(style) + 1)
    relief = spec.get("relief", 1.0)
    # anything with height is frame; soft edge for the silhouette
    alpha = smoothstep(0.4 * SS, 2.2 * SS, h)
    rgb = shade(h, ids, mats, cv, rng, relief=relief, grain=spec.get("grain", 1.0))
    size = cv.N // SS
    total = save(to_image(rgb, alpha).resize((size, size), Image.LANCZOS), style)

    if spec.get("centres"):
        # Render again on a longer rail with the centre ornaments in place and
        # cut one sprite per side, so each keeps the same light as the frame.
        cv, h, ids, mats, mask = build(style, tile=slice_px * 3, with_centres=True)
        rng = np.random.default_rng(seed_for(style) + 1)
        rgb = shade(h, ids, mats, cv, rng, relief=relief, grain=spec.get("grain", 1.0))
        # the ornament throws a little shadow on the rail it sits on
        lxy = math.hypot(LIGHT[0], LIGHT[1])
        off = 7 * SS
        thrown = np.roll(mask, (int(round(-LIGHT[1] / lxy * off)), int(round(-LIGHT[0] / lxy * off))), axis=(0, 1))
        thrown = blur(thrown, 5.0 * SS) * 0.6
        a = mask + (1 - mask) * thrown
        dark = lin(30, 16, 6)
        col = (rgb * mask[..., None] + dark * ((1 - mask) * thrown)[..., None]) / np.maximum(a, 1e-4)[..., None]
        sheet = to_image(col, a)
        n, S = cv.N, cv.S
        half = int(CENTRE_LENGTH * S / 2)
        c = n // 2
        boxes = dict(
            top=(c - half, 0, c + half, S),
            bottom=(c - half, n - S, c + half, n),
            left=(0, c - half, S, c + half),
            right=(n - S, c - half, n, c + half),
        )
        for side, box in boxes.items():
            crop = sheet.crop(box)
            crop = crop.resize((crop.width // SS, crop.height // SS), Image.LANCZOS)
            total += save(crop, f"{style}-{side}")

    return dict(
        slice=slice_px,
        size=size,
        margin=spec["margin"],
        width=spec["width"],
        centres=bool(spec.get("centres")),
        centreLength=CENTRE_LENGTH if spec.get("centres") else 0,
    ), total


def main():
    wanted = sys.argv[1:] or list(STYLES)
    meta = {}
    if os.path.exists(META_PATH):
        with open(META_PATH) as fh:
            meta = json.load(fh)
    for style in wanted:
        info, total = render(style)
        meta[style] = info
        print(f"{style}: {info['size']}px, {total / 1024:.0f} KB")
    os.makedirs(os.path.dirname(META_PATH), exist_ok=True)
    with open(META_PATH, "w") as fh:
        json.dump(meta, fh, indent=2)
        fh.write("\n")


if __name__ == "__main__":
    main()
