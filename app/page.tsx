export default function Home() {
  return (
    <div
      className="flex flex-col justify-center items-center min-h-screen font-sans"
      style={{ backgroundImage: "url('/diamond-sunset-bg.svg')" }}
    >
      <section className="border w-100 h-100 mx-auto rounded-lg overflow-hidden m-4">
        <img src="/cat.jpeg" className="w-full h-full object-cover"></img>
      </section>
      <section className="w-150 mx-auto text-center rounded-lg border">
        <div className="border px-4">
          <button className="border w-20 mx-1">Button 1</button>
          <button className="border w-20 mx-1">Button 2</button>
          <button className="border w-20 mx-1">Button 3</button>
          <button className="border w-20 mx-1">Button 4</button>
        </div>
        <p className="border m-4">
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
