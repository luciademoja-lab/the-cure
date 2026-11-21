"""Pose dei gatti, ispirate al disegno di riferimento: poche pennellate morbide e piene."""
import math
from brush import stroke, transform

K = 1.45  # spessore generale delle pennellate

def _mk(tx, ty, s, flip, rot=0):
    T = lambda pts: transform(pts, s, s, tx, ty, flip, rot)
    W = lambda ws: [w * s * K for w in ws]
    return T, W

def sitting(tx, ty, s=1.0, flip=False, face=True, tail=True):
    """Seduto di profilo, muso a sinistra. Box ~70x120 (×s)."""
    T, W = _mk(tx, ty, s, flip)
    S = []
    S.append(stroke(T([(22, 34), (14, 30), (3, 25), (8, 17), (14, 10), (17, 0), (24, 9), (34, 7), (38, 1), (40, 12), (42, 22), (38, 36), (26, 50), (12, 64), (5, 74)]),
                    W([0.5, 0.9, 1.1, 1.1, 1.3, 0.4, 1.1, 1.3, 0.4, 2.0, 3.0, 3.4, 3.0, 2.0, 0.3])))
    S.append(stroke(T([(16, 31), (19, 36), (14, 42), (13, 48)]), W([0.3, 1.3, 1.1, 0.3])))
    S.append(stroke(T([(19, 56), (12, 68), (8, 84), (12, 100), (22, 108)]), W([0.3, 2.0, 2.8, 2.2, 0.3])))
    body = [(34, 40), (31, 52), (34, 66), (42, 80), (40, 96), (30, 110), (34, 119), (48, 117)]
    ws = [0.3, 2.4, 3.4, 3.6, 3.4, 3.0, 2.8, 2.2]
    if tail:
        body += [(56, 104), (54, 92), (60, 84), (68, 86)]
        ws += [1.8, 1.4, 1.0, 0.25]
    else:
        ws[-1] = 0.3
    S.append(stroke(T(body), W(ws)))
    if face:
        S.append(stroke(T([(9, 22), (16, 22), (20, 24)]), W([0.2, 0.7, 0.2])))
    return S

def from_behind(tx, ty, s=1.0, flip=False):
    """Seduto di spalle che guarda in alto. Box ~60x110."""
    T, W = _mk(tx, ty, s, flip)
    S = []
    # testa con orecchie
    S.append(stroke(T([(18, 22), (14, 12), (16, 0), (24, 8), (32, 6), (40, 0), (42, 12), (38, 22)]), W([0.4, 1.2, 0.4, 1.2, 1.2, 0.4, 1.2, 0.4])))
    # spalla sinistra e fianco
    S.append(stroke(T([(20, 26), (12, 40), (8, 62), (10, 84), (18, 100), (30, 104)]), W([0.3, 2.4, 3.2, 3.4, 2.8, 0.3])))
    # spalla destra e fianco
    S.append(stroke(T([(36, 26), (44, 40), (48, 62), (46, 84), (38, 100), (28, 104)]), W([0.3, 2.4, 3.2, 3.4, 2.8, 0.3])))
    # coda che si arriccia di lato
    S.append(stroke(T([(36, 103), (52, 106), (62, 98), (64, 86), (58, 80)]), W([0.4, 2.2, 1.8, 1.0, 0.25])))
    return S

def walking(tx, ty, s=1.0, flip=False, rot=0):
    """Gatto che cammina, muso a sinistra, coda alta e morbida. Box ~100x64."""
    T, W = _mk(tx, ty, s, flip, rot)
    S = []
    # muso, orecchie, nuca e schiena fino alla coda
    S.append(stroke(T([(16, 26), (6, 22), (2, 16), (8, 10), (10, 0), (16, 7), (23, 6), (27, 0), (29, 10), (30, 18), (40, 22), (58, 20), (74, 22), (84, 16), (88, 6), (96, 2), (100, 6)]),
                    W([0.4, 1.0, 1.1, 1.2, 0.4, 1.1, 1.2, 0.4, 1.8, 2.6, 3.2, 3.4, 3.2, 2.4, 1.6, 1.0, 0.25])))
    # petto e zampa davanti, un solo gesto
    S.append(stroke(T([(20, 28), (24, 40), (22, 52), (18, 62)]), W([0.3, 2.8, 2.4, 0.4])))
    # pancia e zampa dietro
    S.append(stroke(T([(30, 38), (48, 42), (66, 36), (74, 46), (72, 62)]), W([0.3, 2.0, 2.6, 2.6, 0.4])))
    return S

def curled(cx, cy, r=30, s=1.0):
    """Gatto acciambellato: un cerchio con testa e coda che si toccano."""
    S = []
    pts = []
    for i in range(0, 300, 20):
        a = math.radians(i + 200)
        pts.append((cx + r * math.cos(a), cy + r * 0.82 * math.sin(a)))
    S.append(stroke(pts, [0.4] + [K * (2.2 + 1.4 * math.sin(math.pi * k / (len(pts) - 1))) for k in range(1, len(pts) - 1)] + [0.4]))
    # testa appoggiata con orecchie
    hx, hy = cx - r * 0.55, cy - r * 0.35
    S.append(stroke([(hx - 10, hy + 8), (hx - 8, hy - 2), (hx - 6, hy - 10), (hx - 1, hy - 3), (hx + 6, hy - 4), (hx + 10, hy - 11), (hx + 12, hy - 1), (hx + 14, hy + 8)],
                    [0.3, K * 1.1, 0.3, K * 1.1, K * 1.1, 0.3, K * 1.2, 0.3]))
    # coda che avvolge
    S.append(stroke([(cx + r * 0.9, cy + r * 0.45), (cx + r * 0.2, cy + r * 0.62), (cx - r * 0.5, cy + r * 0.45), (cx - r * 0.85, cy + r * 0.1)],
                    [0.4, K * 2.0, K * 1.4, 0.3]))
    return S

def stretching(tx, ty, s=1.0, flip=False):
    """Gatto che si stira: zampe davanti allungate, coda alta. Box ~110x60."""
    T, W = _mk(tx, ty, s, flip)
    S = []
    S.append(stroke(T([(16, 40), (8, 36), (3, 30), (9, 24), (12, 14), (18, 22), (25, 20), (29, 12), (31, 24), (30, 34), (42, 42), (62, 34), (80, 18), (90, 14), (98, 4), (106, 0)]),
                    W([0.4, 1.0, 1.1, 1.2, 0.4, 1.1, 1.2, 0.4, 1.6, 2.4, 3.0, 3.2, 3.0, 2.4, 1.4, 0.25])))
    S.append(stroke(T([(26, 44), (14, 52), (0, 56)]), W([0.4, 2.2, 0.3])))
    S.append(stroke(T([(34, 46), (20, 56), (6, 60)]), W([0.4, 2.0, 0.3])))
    S.append(stroke(T([(80, 22), (84, 40), (86, 58)]), W([0.4, 2.4, 0.3])))
    return S

if __name__ == '__main__':
    import sys
    paths = sitting(30, 40) 
    svg = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="800" viewBox="0 0 120 200"><rect width="120" height="200" fill="#120e09"/>' + ''.join(f'<path d="{p}" fill="#ecd29a"/>' for p in paths) + '</svg>'
    open('/tmp/cat.svg', 'w').write(svg)
