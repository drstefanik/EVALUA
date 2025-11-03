import React, { useRef, useEffect } from "react";

export default function Particles({ density = 90 }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");

    // Recalculate the canvas real size
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(width));
      canvas.height = Math.max(1, Math.floor(height));
    };
    resize();

    // Generate dots
    const dots = Array.from({ length: density }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
    }));

    let raf;
    const draw = () => {
      const { width: w, height: h } = canvas;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(12,60,74,0.30)"; // slightly more visible
      dots.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2); ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };

    const onResize = () => { resize(); };
    window.addEventListener("resize", onResize);
    draw();

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, [density]);

  // Higher z-index than the network background but below the content
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      <canvas ref={ref} className="block w-full h-full" />
    </div>
  );
}
