var Confetti = (function () {
  var Config = function () {
    this.gravity = 10;
    this.particle_count = 75;
    this.particle_size = 1;
    this.explosion_power = 25;
    this.destroy_target = true;
    this.fade = false;
  };

  var Vector = function (x, y) {
    this.x = x || 0;
    this.y = y || 0;
  };

  var Particle = function (origin) {
    this.size = new Vector(
      (16 * Math.random() + 4) * Confetti.CONFIG.particle_size,
      (4 * Math.random() + 4) * Confetti.CONFIG.particle_size
    );
    this.position = new Vector(
      origin.x - this.size.x / 2,
      origin.y - this.size.y / 2
    );
    this.velocity = Velocity.generate();
    this.rotation = 360 * Math.random();
    this.rotation_speed = 10 * (Math.random() - 0.5);
    this.hue = 360 * Math.random();
    this.opacity = 100;
    this.lifetime = Math.random() + 0.25;
  };

  Particle.prototype.update = function (delta) {
    this.velocity.y +=
      Confetti.CONFIG.gravity *
      (this.size.y / (10 * Confetti.CONFIG.particle_size)) *
      delta;
    this.velocity.x += 25 * (Math.random() - 0.5) * delta;
    this.velocity.y *= 0.98;
    this.velocity.x *= 0.98;
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.rotation += this.rotation_speed;
    if (Confetti.CONFIG.fade) this.opacity -= this.lifetime;
  };

  Particle.prototype.checkBounds = function () {
    return this.position.y - 2 * this.size.x > 2 * window.innerHeight;
  };

  Particle.prototype.draw = function () {
    Canvas.drawRectangle(
      this.position,
      this.size,
      this.rotation,
      this.hue,
      this.opacity
    );
  };

  var Velocity = {
    generate: function () {
      var x = Math.random() - 0.5;
      var y = Math.random() - 0.7;
      var mag = Math.sqrt(x * x + y * y);
      y /= mag;
      x /= mag;
      return new Vector(
        x * (Math.random() * Confetti.CONFIG.explosion_power),
        y * (Math.random() * Confetti.CONFIG.explosion_power)
      );
    },
  };

  var Burst = function (origin) {
    this.particles = [];
    for (var i = 0; i < Confetti.CONFIG.particle_count; i++) {
      this.particles.push(new Particle(origin));
    }
  };

  Burst.prototype.update = function (delta) {
    for (var i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update(delta);
      if (this.particles[i].checkBounds()) this.particles.splice(i, 1);
    }
  };

  Burst.prototype.draw = function () {
    for (var i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].draw();
    }
  };

  var Canvas = {
    clearScreen: function () {
      if (Confetti.CTX)
        Confetti.CTX.clearRect(0, 0, 2 * window.innerWidth, 2 * window.innerHeight);
    },
    drawRectangle: function (pos, size, rot, hue, opacity) {
      if (!Confetti.CTX) return;
      Confetti.CTX.save();
      Confetti.CTX.beginPath();
      Confetti.CTX.translate(pos.x + size.x / 2, pos.y + size.y / 2);
      Confetti.CTX.rotate((rot * Math.PI) / 180);
      Confetti.CTX.rect(-size.x / 2, -size.y / 2, size.x, size.y);
      Confetti.CTX.fillStyle = `hsla(${hue}, 90%, 65%, ${opacity}%)`;
      Confetti.CTX.fill();
      Confetti.CTX.restore();
    },
  };

  function Confetti(id) {
    this.bursts = [];
    if (!Confetti.CONFIG) Confetti.CONFIG = new Config();
    this.time = new Date().getTime();
    this.delta_time = 0;
    this.setupCanvas();
    if (id) this.setupElement(id);
    window.requestAnimationFrame(this.update.bind(this));
  }

  Confetti.prototype.setupCanvas = function () {
    if (!Confetti.CTX) {
      var canvas = document.createElement("canvas");
      Confetti.CTX = canvas.getContext("2d");
      canvas.width = 2 * window.innerWidth;
      canvas.height = 2 * window.innerHeight;
      Object.assign(canvas.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        zIndex: "999999999",
        pointerEvents: "none",
      });
      document.body.appendChild(canvas);
      window.addEventListener("resize", () => {
        canvas.width = 2 * window.innerWidth;
        canvas.height = 2 * window.innerHeight;
      });
    }
  };

  Confetti.prototype.setupElement = function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("click", (ev) => {
      const origin = new Vector(2 * ev.clientX, 2 * ev.clientY);
      this.bursts.push(new Burst(origin));
      if (Confetti.CONFIG.destroy_target) el.style.visibility = "hidden";
    });
  };

  // 💥 New method to manually trigger confetti from an element
  Confetti.prototype.burstFromId = function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const origin = new Vector(
      2 * (rect.left + rect.width / 2),
      2 * (rect.top + rect.height / 2)
    );
    this.bursts.push(new Burst(origin));
  };

  Confetti.prototype.update = function (time) {
    this.delta_time = (time - this.time) / 1000;
    this.time = time;
    for (var i = this.bursts.length - 1; i >= 0; i--) {
      this.bursts[i].update(this.delta_time);
      if (this.bursts[i].particles.length === 0) this.bursts.splice(i, 1);
    }
    this.draw();
    window.requestAnimationFrame(this.update.bind(this));
  };

  Confetti.prototype.draw = function () {
    Canvas.clearScreen();
    for (var i = 0; i < this.bursts.length; i++) {
      this.bursts[i].draw();
    }
  };

  // setters
  Confetti.prototype.setCount = function (n) {
    Confetti.CONFIG.particle_count = n;
  };
  Confetti.prototype.setPower = function (n) {
    Confetti.CONFIG.explosion_power = n;
  };
  Confetti.prototype.setSize = function (n) {
    Confetti.CONFIG.particle_size = n;
  };
  Confetti.prototype.setFade = function (b) {
    Confetti.CONFIG.fade = b;
  };
  Confetti.prototype.destroyTarget = function (b) {
    Confetti.CONFIG.destroy_target = b;
  };

  return Confetti;
})();

export default Confetti;
