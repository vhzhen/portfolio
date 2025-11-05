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
    const drag = createDraggable(".crown", {
      container: ".draggable-zone",
      snap: 80,
      onRelease: () => {
        if ((drag.x) >= -200 && drag.x <= 200) {
          console.log("Matched!") // test
        }
      }
      
    });
  }, []);

  return (
    <div
      className="flex flex-col justify-center items-center min-h-screen font-mono draggable-zone"
      style={{ backgroundImage: "url('/diamond-sunset-bg.svg')" }}
    >
      <img
        src="/crown.webp"
        className="crown draggable w-40 h-25 top-1/2 left-0 align-left"
        alt="crown"
      />
      <div className="">
        <section className="border w-100 h-125 mx-auto rounded-lg overflow-hidden m-4">
          <img
            src="/cat.jpeg"
            className="w-full h-full object-scale"
            draggable="false"
          ></img>
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
