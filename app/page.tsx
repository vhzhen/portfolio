"use client";

import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { FileText } from "lucide-react";
import { Code } from "lucide-react";
import { Mail } from "lucide-react";

export default function Home() {
  return (
    <div
      className="flex flex-col justify-center items-center min-h-screen font-mono"
      style={{ backgroundImage: "url('/diamond-sunset-bg.svg')" }}
    >
      <section className="border w-100 h-100 mx-auto rounded-lg overflow-hidden m-4">
        <img src="/cat.jpeg" className="w-full h-full object-cover"></img>
      </section>
      <section className="w-155 mx-auto text-center rounded-lg border">
        <div className="border px-4">
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
          <Button className="btn" variant="outline" onClick={() => window.open("/resume.pdf","_blank")}>
            <FileText />
            Resume
          </Button>
        </div>
        <p className="border m-4">
          I'm a Computing and Financial Management student at the University
          of Waterloo with hands-on experience in software development and data
          projects. Last summer, I worked on ETL Pipelines and automating
          workflows at{" "}
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
  );
}
