"use client";

import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { FileText } from "lucide-react";
import { Code } from "lucide-react";
import { Mail } from "lucide-react";

import { useEffect } from "react";
import {
  animate,
  createAnimatable,
  utils,
  createDraggable,
  spring,
} from "animejs";

export default function Home() {
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
      animatable.x(x / 10); // divide for subtler motion
      animatable.y(y / 10);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", refreshBounds);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", refreshBounds);
    };
  }, []);

  return (
    <div
      className="flex flex-col justify-center items-center min-h-screen font-mono"
      style={{ backgroundImage: "url('/diamond-sunset-bg.svg')" }}
    >
      <div className="follow">
        <section className="border w-100 h-125 mx-auto rounded-lg overflow-hidden m-4">
          <img src="/cat.jpeg" className="w-full h-full object-scale"></img>
        </section>
        <section className="w-180 mx-auto text-center rounded-lg">
          <div className=" px-4">
            <Button
              className="btn"
              variant="outline"
              onClick={() => window.open("https://github.com/vhzhen", "_blank")}
            >
              <Github />
              GitHub
            </Button>
            <Button
              className="btn"
              variant="outline"
              onClick={() =>
                (window.location.href =
                  "mailto:vhzhen@uwaterloo.ca?subject=Website Inquiry&body=Hi there!")
              }
            >
              <Mail />
              Mail
            </Button>
            <Button
              className="btn"
              variant="outline"
              onClick={() =>
                window.open("https://devpost.com/vincentzhen2006", "_blank")
              }
            >
              <Code />
              Devpost
            </Button>
            <Button
              className="btn"
              variant="outline"
              onClick={() => window.open("/resume.pdf", "_blank")}
            >
              <FileText />
              Resume
            </Button>
          </div>
          <p className="m-4 rounded-lg">
            Hey! I'm Vincent, a Computing and Financial Management student at
            the University of Waterloo with hands-on experience in software
            development and data projects. Last Summer, I worked on ETL
            Pipelines and automating workflows at{" "}
            <a
              href="https://www.usepepper.com/"
              target="_blank"
              className="underline"
            >
              Pepper
            </a>
            . When I'm not coding, you can find me chilling with my two cats.
          </p>
        </section>
      </div>
    </div>
  );
}
