import { BURST, leafOpacity, newLeaf, stepLeaf, type Leaf } from "./dials";

/** The big leaf from sapling.svg, re-centred on its own middle (24-unit box). */
export const LEAF_PATH = "M12 7 C9.2 7 7.5 5.3 7.5 2.5 C10.3 2.5 12 4.2 12 7 Z";
const SVG_NS = "http://www.w3.org/2000/svg";

type Slot = { el: SVGSVGElement; leaf: Leaf | null };

/** A fixed pool of leaf <svg>s; a burst that finds fewer free leaves uses fewer. */
export class LeafPool {
  private slots: Slot[] = [];

  constructor(layer: HTMLElement) {
    for (let i = 0; i < BURST.pool; i++) {
      const el = document.createElementNS(SVG_NS, "svg");
      // viewBox frames just the leaf so its centre is the rotation point.
      el.setAttribute("viewBox", "7 2 5.5 5.5");
      el.setAttribute("aria-hidden", "true");
      el.style.cssText =
        "position:absolute;left:0;top:0;display:none;overflow:visible;pointer-events:none;will-change:transform,opacity";
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", LEAF_PATH);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "currentColor");
      path.setAttribute("stroke-width", "1.5");
      path.setAttribute("stroke-linejoin", "round");
      el.appendChild(path);
      layer.appendChild(el);
      this.slots.push({ el, leaf: null });
    }
  }

  burst(x: number, y: number, nx: number, ny: number, color: string) {
    let left = BURST.count;
    for (const s of this.slots) {
      if (left === 0) break;
      if (s.leaf) continue;
      s.leaf = newLeaf(x, y, nx, ny);
      s.el.style.width = s.el.style.height = `${s.leaf.size}px`;
      s.el.style.color = color;
      s.el.style.display = "block";
      left--;
    }
  }

  update(dt: number) {
    for (const s of this.slots) {
      const l = s.leaf;
      if (!l) continue;
      stepLeaf(l, dt);
      if (l.age >= l.life) {
        s.leaf = null;
        s.el.style.display = "none";
        continue;
      }
      const half = l.size / 2;
      s.el.style.transform = `translate(${l.x - half}px, ${l.y - half}px) rotate(${l.rot}deg)`;
      s.el.style.opacity = `${leafOpacity(l.age, l.life)}`;
    }
  }

  clear() {
    for (const s of this.slots) {
      s.leaf = null;
      s.el.style.display = "none";
    }
  }
}
