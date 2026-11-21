"""Le 22 carte a tema gatti: gatto a pennellate piene + piccoli simboli a linea sottile."""
import json, math
from cats import sitting, from_behind, walking, curled, stretching
from brush import stroke

def star(cx, cy, r, inner, n):
    pts = []
    for i in range(n * 2):
        a = math.pi * i / n - math.pi / 2
        rad = r if i % 2 == 0 else inner
        pts.append(f'{cx + rad * math.cos(a):.1f},{cy + rad * math.sin(a):.1f}')
    return f'<polygon points="{" ".join(pts)}" />'

def rays(cx, cy, r1, r2, n, offset=0):
    out = []
    for i in range(n):
        a = 2 * math.pi * i / n + offset
        out.append(f'M{cx + r1 * math.cos(a):.1f} {cy + r1 * math.sin(a):.1f} L{cx + r2 * math.cos(a):.1f} {cy + r2 * math.sin(a):.1f}')
    return f'<path d="{" ".join(out)}" />'

def moon(cx, cy, r):
    return f'<path d="M{cx + r * 0.3:.1f} {cy - r:.1f} A{r} {r} 0 1 0 {cx + r * 0.3:.1f} {cy + r:.1f} A{r * 1.35:.1f} {r * 1.35:.1f} 0 0 1 {cx + r * 0.3:.1f} {cy - r:.1f} Z" />'

C = {}  # id -> (cat paths, line svg)
# Area utile: x 12..108, y 34..160
C[0] = (walking(14, 92, 0.72), '<path d="M14 142 L78 142 L92 116" />' + star(94, 50, 7, 3, 4) + '<path d="M58 64 C52 56 46 60 52 66 C46 70 52 76 58 68 C64 76 70 70 64 66 C70 60 64 56 58 64 Z" />')
C[1] = (sitting(30, 46, 0.95), '<path d="M44 40 C36 30, 36 50, 44 40 C52 30, 68 50, 76 40 C84 30, 84 50, 76 40 C68 30, 52 50, 44 40 Z" /><path d="M84 160 L92 60" /><circle cx="92" cy="58" r="3" />')
C[2] = (sitting(36, 50, 0.9), '<path d="M20 44 L20 160 M100 44 L100 160" />' + moon(62, 42, 9))
C[3] = (sitting(34, 52, 0.9), star(30, 44, 4, 1.8, 6) + star(50, 38, 4, 1.8, 6) + star(70, 38, 4, 1.8, 6) + '<path d="M84 160 C84 140 92 130 96 120 M90 140 C96 136 100 136 104 132 M86 150 C80 146 78 142 76 138" />')
C[4] = (sitting(38, 44, 0.72), '<rect x="26" y="130" width="68" height="30" /><path d="M26 140 L94 140" /><path d="M42 40 L46 32 L50 38 L54 28 L58 38 L62 32 L66 40" />')
C[5] = (sitting(40, 46, 0.92), '<path d="M24 52 L24 160 M16 66 L32 66 M18 78 L30 78" /><circle cx="24" cy="46" r="5" /><path d="M92 120 L104 120 M98 120 L98 140 L104 140 M98 132 L102 132" /><circle cx="92" cy="120" r="5" />')
lov = sitting(10, 52, 0.78) + sitting(110, 52, 0.78, flip=True)
C[6] = (lov, star(60, 44, 7, 3, 8))
C[7] = (walking(14, 96, 0.9), star(60, 54, 10, 4, 8) + '<path d="M14 160 L106 160" />')
C[8] = (sitting(34, 54, 0.88), '<path d="M44 46 C36 36, 36 56, 44 46 C52 36, 68 56, 76 46 C84 36, 84 56, 76 46 C68 36, 52 56, 44 46 Z" />' + rays(46, 80, 16, 22, 12))
C[9] = (sitting(48, 46, 0.92, flip=False), '<path d="M22 70 L36 70 L38 92 L20 92 Z M29 60 L29 70 M26 92 L26 98 L32 98 L32 92" />' + star(29, 81, 5, 2.2, 6) + '<path d="M98 40 L98 160" />')
C[10] = (curled(60, 100, 34), rays(60, 100, 44, 50, 8, math.pi / 8))
C[11] = (sitting(40, 58, 0.86), '<path d="M60 36 L60 58 M30 40 L90 40" /><path d="M30 40 L22 58 L38 58 Z M90 40 L82 58 L98 58 Z" /><circle cx="60" cy="36" r="3" />')
hang = [stroke(p, w) for p, w in []]
C[12] = (sitting(34, 52, 0.86), '<path d="M14 40 L106 40 M60 40 L60 50" />' + star(60, 158, 4, 1.8, 6))
C[13] = (walking(58, 86, 0.5, flip=True), '<path d="M12 122 L108 122" /><path d="M66 122 A24 24 0 0 1 106 122" />' + '<path d="M86 92 L86 84 M70 98 L64 92 M102 98 L106 94" /><path d="M24 140 L96 140 M40 152 L80 152" />')
C[14] = (sitting(38, 58, 0.86), '<path d="M14 66 L30 66 L27 82 L17 82 Z M90 96 L106 96 L103 112 L93 112 Z" /><path d="M24 66 C30 36, 80 30, 98 96" />')
duo = sitting(8, 56, 0.74) + sitting(112, 56, 0.74, flip=True)
C[15] = (duo, '<circle cx="54" cy="148" r="6" /><circle cx="64" cy="148" r="6" /><path d="M30 44 L36 52 M90 44 L84 52" />')
C[16] = (walking(56, 62, 0.48, rot=-28), '<path d="M30 160 L34 92 L58 92 L62 160 Z" /><path d="M30 92 L30 84 L36 84 L36 88 L42 88 L42 84 L48 84 L48 88 L54 88 L54 84 L60 84 L60 92" /><path d="M98 34 L84 56 L94 56 L80 80" /><rect x="40" y="112" width="10" height="14" />')
C[17] = (from_behind(32, 72, 0.86), star(60, 52, 12, 4.5, 8) + star(22, 40, 4, 1.6, 4) + star(98, 48, 4, 1.6, 4) + star(92, 28, 3, 1.2, 4))
C[18] = (sitting(16, 60, 0.82), moon(88, 52, 14) + '<path d="M76 146 L76 152 M88 140 L88 148 M100 146 L100 152" />')
C[19] = (stretching(8, 108, 0.94), '<circle cx="60" cy="58" r="15" />' + rays(60, 58, 20, 28, 12))
C[20] = (from_behind(32, 70, 0.84), '<path d="M30 36 L70 28 L70 50 L30 42 Z M70 28 L84 18 L84 60 L70 50" />' + rays(60, 70, 30, 34, 0))
C[21] = (curled(60, 104, 26), '<ellipse cx="60" cy="100" rx="40" ry="56" /><path d="M60 40 L66 50 L54 50 Z" /><circle cx="60" cy="47" r="1.6" />')

def card_inner(i):
    paths, lines = C[i]
    cat = ''.join(f'<path d="{p}" />' for p in paths)
    if i == 12:
        # L'Appeso: il gatto è appeso a testa in giù al ramo, aggrappato con la coda arricciata
        cat = f'<g transform="rotate(180 60 100)">{cat}</g>'
    return cat, lines

out = {i: card_inner(i) for i in C}
json.dump(out, open('/tmp/catcards.json', 'w'))
