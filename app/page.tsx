export default function Home() {
  return (
    <div
      className="flex flex-col justify-center items-center min-h-screen font-sans"
      style={{ backgroundImage: "url('/diamond-sunset-bg.svg')" }}
    >
      <section className="border w-100 h-100 mx-auto rounded-lg overflow-hidden">
        <img src="/cat.jpeg" className="w-full h-full object-cover"></img>
      </section>
      <section className="max-w-3xl mx-auto text-center p-10 rounded-lg">
        <p className="">
          I'm a Computing and Financial Management student at the University of
          Waterloo with hands-on experience in software development and data
          projects. Last summer, I worked on ETL Pipelines and automating
          workflows at Pepper. When I'm not coding, you can find me chilling
          with my two cats.
        </p>
      </section>
    </div>
  );
}
