"""Pennellate a spessore variabile: una linea centrale (Catmull-Rom) e uno spessore per punto."""
import math

def catmull(pts, samples=14):
    out = []
    P = [pts[0]] + pts + [pts[-1]]
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for s in range(samples):
            t = s / samples
            t2, t3 = t * t, t * t * t
            x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
            y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
            out.append((x, y, i - 1 + t))
    out.append((pts[-1][0], pts[-1][1], len(pts) - 1))
    return out

def stroke(pts, widths, samples=7):
    """pts: [(x,y)], widths: spessore in ogni punto di controllo. Restituisce un path chiuso."""
    c = catmull(pts, samples)
    left, right = [], []
    n = len(c)
    for k, (x, y, u) in enumerate(c):
        a = c[max(k - 1, 0)]
        b = c[min(k + 1, n - 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy) or 1
        nx, ny = -dy / L, dx / L
        i = min(int(u), len(widths) - 2)
        f = u - i
        w = (widths[i] * (1 - f) + widths[i + 1] * f) / 2
        left.append((x + nx * w, y + ny * w))
        right.append((x - nx * w, y - ny * w))
    poly = left + right[::-1]
    return 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in poly) + ' Z'

def transform(pts, sx=1, sy=1, tx=0, ty=0, flip=False, rot=0, cx=0, cy=0):
    out = []
    ca, sa = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    for x, y in pts:
        if flip:
            x = -x
        x, y = x * sx, y * sy
        if rot:
            x, y = x * ca - y * sa, x * sa + y * ca
        out.append((x + tx, y + ty))
    return out
