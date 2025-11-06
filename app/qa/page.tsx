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
    const bounce = animate(".bounce", {
      y: ["1vh", "-1vh"],
      loop: true,
      alternate: true,
      duration: 400,
    });

    const drag = createDraggable(".snap-to-head", {
      container: ".draggable-zone",
      onRelease: () => {
        if (drag.x >= -150 && drag.x <= 150 && drag.y >= 0 && drag.y <= 200) {
          console.log("snapping element to head!");

          bounce.pause();
          drag.disable(); // disable .snap-to-head once it has locked onto the image

          animate(".snap-to-head", { x: "-5", y: "80" });
          drag.setX(-5);
          drag.setY(80);

          drag.enable();
        } else {
          bounce.resume();
        }

        console.log("bounce resumed");
        console.log(drag.x);
      },
      onGrab: () => {
        bounce.pause();
      },
    });
  }, []);

  return (
    <div
      className="flex flex-row justify-center items-center items-center min-h-screen draggable-zone w-full h-full"
      style={{ backgroundImage: "url('/diamond-sunset-bg.svg')" }}
    >
      <section id="left-section" className="hidden md:flex flex-col justify-center items-center min-h-[auto] border w-1/4 h-full">
        <div className="snap-to-head border w-40 h-25">
          <img
            src="/crown.webp"
            className="bounce snap-to-head draggable w-40 h-25 top-1/2 left-0 align-left"
            alt="crown"
            draggable="false"
          />
        </div>
      </section>

      <section
        id="middle-section"
        className="flex flex-col justify-center items-center font-mono draggable-zone w-full md:w-2/4 border"
      >
        <section className="border rounded-lg overflow-hidden m-4 w-[clamp(150px,70%,400px)] sm:w-[clamp(150px,80%,400px)]"> 
          <img
            src="/cat.jpeg"
            className=""
            draggable="false"
          ></img>
        </section>
        <section className="flex flex-col items-center mx-auto my-auto text-center rounded-lg border">
          <div className="px-4">
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
          <p className="sm:w-[clamp(150px,80%,700px)] text-center text-sm md:text-md lg:text-lg m-4 rounded-lg border">
            Hey! I'm Vincent, a Computing and Financial Management student at
            the University of Waterloo with hands-on experience in software
            development and data projects. Last summer, I worked on ETL
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
      </section>

      <section
        id="right-section"
        className="hidden md:flex flex-col justify-center items-center min-h-[auto] border w-1/4 h-full"
      ></section>
    </div>
  );
}
