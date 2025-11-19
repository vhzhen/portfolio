"use client";

import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { FileText } from "lucide-react";
import { Code } from "lucide-react";
import { Mail } from "lucide-react";

import { useEffect, useRef } from "react";
import {
  animate,
  createAnimatable,
  utils,
  createDraggable,
  spring,
  splitText,
  stagger,
} from "animejs";



export default function Home() {
  const catHeadOffset = 77;
  const catRef = useRef(null);
  const crownRef = useRef(null);

  useEffect(() => {
    // applies to all paragraphs
    splitText("p", {
      words: { wrap: "clip" },
    }).addEffect(({ words }) =>
      animate(words, {
        y: [{ to: ["100%", "0%"] }],
        delay: stagger(20),
      })
    );

    // shake
    animate('.shake', {
      x: [
        { to: -1 },
        { to: 1 },
        { to: -1 },
        { to: 1 },
        { to: 0 }
      ],
      y: [
        { to: -1 },
        { to: 1 },
        { to: -1 },
        { to: 1 },
        { to: 0 }
      ],
      duration: 300,
      easing: "easeInOutSine",
      loop: true

    });


    const bounce = animate(".bounce", {
      y: ["1vh", "-1vh"],
      loop: true,
      alternate: true,
      duration: 400,
    });

    const drag = createDraggable(".snap-to-head", {
      container: ".draggable-zone",
      onRelease: () => {
        document.title = "...";


        // used to get the current coordinates of the cat
        const cat = catRef.current.getBoundingClientRect();
        const crown = crownRef.current.getBoundingClientRect();

        const catX = (cat.left + cat.right) / 2;
        const catY = cat.top + catHeadOffset;

        const crownY = crown.bottom;
        const crownX = (crown.left + crown.right) / 2;

        const targetX = drag.x + (catX - crownX);
        const targetY = drag.y + (catY - crownY);

        console.log("crownX: ", crownX);
        console.log("crownY: ", crownY);

        console.log("targetX: ", targetX);
        console.log("targetY: ", targetY);
        console.log("coords: ", drag.coords);

        if (
          crownY >= catY - 100 &&
          crownY <= catY + 100 &&
          crownX >= catX - 100 &&
          crownX <= catX + 100
        ) {
          console.log("snapping element to head!");

          animate(".bounce", {
            y: 0,
            duration: 400,
          });
          bounce.cancel();

          drag.disable(); // disable .snap-to-head once it has locked onto the image

          animate(".snap-to-head", { x: targetX, y: targetY });
          drag.setX(targetX);
          drag.setY(targetY);

          drag.enable();
        } else {
          if (bounce.paused) {
            animate(".bounce", {
              y: ["1vh", "-1vh"],
              loop: true,
              alternate: true,
              duration: 400,
            });
            bounce.resume();
          }
        }

        //console.log("bounce resumed"); // test
        //console.log(drag.x); // test
      },
      onGrab: () => {
        document.title = "!!!";
        bounce.pause();
      },
    });
  }, []);

  return (
    <div
      className="flex flex-row justify-center items-center items-center min-h-screen draggable-zone w-full h-full"
      style={{ backgroundImage: "url('/diamond-sunset-bg.svg')" }}
    >
      <section
        id="left-section"
        className="hidden md:flex flex-col justify-center items-center min-h-[auto] border w-1/4 h-full"
      >
        <div ref={crownRef} className="snap-to-head border w-40 h-25">
          <img
            src="/crown.webp"
            className="bounce draggable w-40 h-25 top-1/2 left-0 align-left"
            alt="crown"
            draggable="false"
          />
        </div>
      </section>

      <section
        id="middle-section"
        className="flex flex-col justify-center items-center font-mono draggable-zone w-full md:w-2/4 border"
      >
        <section
          ref={catRef}
          className=" rounded-lg overflow-hidden m-4 w-[clamp(150px,70%,400px)] sm:w-[clamp(150px,80%,400px)]"
        >
          <img src="/cat.jpeg" className="" draggable="false"></img>
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
          <p className="sm:w-[clamp(150px,80%,700px)] text-center text-sm md:text-md lg:text-lg m-4 rounded-lg lines border">
            Hey! I'm Vincent, a Computing and Financial Management student at
            the University of Waterloo with hands-on experience in software
            development and data projects. Last summer, I worked on ETL
            Pipelines and automating workflows at{" "}
            <a
              href="https://www.usepepper.com/"
              target="_blank"
            >
              <span style={{ color: "rgba(56, 151, 59, 1)" }}>Pepper</span>
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
