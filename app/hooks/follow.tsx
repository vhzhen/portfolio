"use client";

import { useEffect } from "react";
import {
  animate,
  createAnimatable,
  utils,
  createDraggable,
  spring,
} from "animejs";

export function follow() {
  useEffect(() => {
    // https://animejs.com/documentation/animatable
    const $container = document.querySelector(".follow");
    if (!$container) return;

    const animatable = createAnimatable(".follow", {
      x: 300,
      y: 300,
      ease: "out(3)",
    });

    let bounds = $container.getBoundingClientRect();
    const refreshBounds = () => (bounds = $container.getBoundingClientRect());

    const onMouseMove = (e: MouseEvent) => {
      const { width, height, left, top } = bounds;
      const hw = width / 2;
      const hh = height / 2;
      const x = utils.clamp(e.clientX - left - hw, -hw, hw);
      const y = utils.clamp(e.clientY - top - hh, -hh, hh);
      animatable.x(x / 10);
      animatable.y(y / 10);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", refreshBounds);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", refreshBounds);
    };
  }, []);
}
