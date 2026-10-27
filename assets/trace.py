from PIL import Image
import numpy as np, potrace, json
a=np.array(Image.open('Refs/logo.png').convert('RGBA')).astype(float)
lum=(a[...,0]*.299+a[...,1]*.587+a[...,2]*.114)
ink=(lum<128)&(a[...,3]>128)
ys,xs=np.where(ink)
bm=potrace.Bitmap(~ink)
path=bm.trace(turdsize=10, alphamax=1.0, opticurve=True, opttolerance=0.2)
x0,y0=xs.min(),ys.min()
def f(p): return f"{p.x-x0:.1f} {p.y-y0:.1f}"
d=[]
for c in path:
    d.append("M"+f(c.start_point))
    for s in c.segments:
        if s.is_corner: d.append("L"+f(s.c)+"L"+f(s.end_point))
        else: d.append("C"+f(s.c1)+" "+f(s.c2)+" "+f(s.end_point))
    d.append("Z")
D="".join(d).replace(".0 "," ").replace(".0L","L").replace(".0C","C").replace(".0Z","Z")
W,H=xs.max()-x0+1,ys.max()-y0+1
open('assets/logo.svg','w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}"><path fill-rule="evenodd" d="{D}"/></svg>')
json.dump({"w":int(W),"h":int(H),"d":D},open('assets/logo.json','w'))
print(W,H,len(D))
