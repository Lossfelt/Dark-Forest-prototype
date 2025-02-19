import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  // Vi beholder en "React-state" for å vise angle i UI:
  const [angle, setAngle] = useState(0);

  // ...Men spillmotoren leser angle fra en useRef, 
  // slik at vi kan unngå re-initialisering av alt ved hver angle-oppdatering.
  const angleRef = useRef(angle);

  // Oppdater angleRef hver gang angle-endres:
  useEffect(() => {
    angleRef.current = angle;
  }, [angle]);

  const canvasRef = useRef(null);

  useEffect(() => {
    // Denne effekten kjører kun én gang (tom dependency array)
    // Her setter vi opp hele spillmotoren og gameLoop.

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Plasserer disse variablene inni effekten så de kun opprettes én gang:
    const player = { x: 50, y: canvas.height / 2 };
    const target = { x: 750, y: canvas.height / 2, radius: 15 };

    // Vind-kolonner genereres én gang
    const windColumnWidth = (canvas.width * 0.6) / 3;
    const windLevels = [1, 2, 3];
    const windDirections = [-1, 1];
    const windColumns = [
      {
        x: canvas.width * 0.2,
        strength:
          windDirections[Math.floor(Math.random() * 2)] *
          windLevels[Math.floor(Math.random() * 3)],
      },
      {
        x: canvas.width * 0.2 + windColumnWidth,
        strength:
          windDirections[Math.floor(Math.random() * 2)] *
          windLevels[Math.floor(Math.random() * 3)],
      },
      {
        x: canvas.width * 0.2 + windColumnWidth * 2,
        strength:
          windDirections[Math.floor(Math.random() * 2)] *
          windLevels[Math.floor(Math.random() * 3)],
      },
    ];

    // Prosjektiler & eksplosjon
    let projectiles = [];
    let explosion = null;

    function drawExplosion() {
      if (explosion) {
        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, 10, 0, Math.PI * 2);
        ctx.fill();
        explosion.timer--;
        if (explosion.timer <= 0) explosion = null;
      }
    }

    function drawPlayer() {
      // Leser den "nyeste" vinkelen fra angleRef:
      const currentAngle = angleRef.current;
      ctx.fillStyle = "black";
      ctx.fillRect(player.x - 10, player.y - 10, 20, 20);
      ctx.strokeStyle = "red";
      ctx.beginPath();
      const endX = player.x + Math.cos((currentAngle * Math.PI) / 180) * 30;
      const endY = player.y + Math.sin((currentAngle * Math.PI) / 180) * 30;
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    function drawWind() {
      windColumns.forEach((col) => {
        ctx.fillStyle = col.strength > 0 ? "blue" : "orange";
        ctx.fillRect(col.x, 0, windColumnWidth, canvas.height);

        let chevrons = Math.abs(col.strength);
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        for (let i = 0; i < chevrons; i++) {
          let arrowY = canvas.height / 2 + (i - 1) * 20;
          ctx.beginPath();
          ctx.moveTo(col.x + windColumnWidth / 2 - 10, arrowY);
          ctx.lineTo(
            col.x + windColumnWidth / 2,
            arrowY + (col.strength > 0 ? -15 : 15)
          );
          ctx.lineTo(col.x + windColumnWidth / 2 + 10, arrowY);
          ctx.fill();
        }
      });
    }

    function drawTarget() {
      ctx.fillStyle = "green";
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawProjectiles() {
      ctx.fillStyle = "red";
      projectiles.forEach((proj) => {
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function updateProjectiles() {
      projectiles.forEach((proj) => {
        proj.x += proj.vx;
        proj.y += proj.vy;
        windColumns.forEach((col) => {
          if (proj.x > col.x && proj.x < col.x + windColumnWidth) {
            proj.vy -= col.strength * 0.01;
          }
        });
        if (
          Math.abs(proj.x - target.x) < target.radius &&
          Math.abs(proj.y - target.y) < target.radius
        ) {
          explosion = { x: target.x, y: target.y, timer: 20 };
          projectiles = projectiles.filter((p) => p !== proj);
        }
      });
    }

    // Lager en funksjon som skyter prosjektil (den kan også kalles ved "Space"-trykk):
    function shootProjectile() {
      const currentAngle = angleRef.current;
      const speed = 3;
      const vx = speed * Math.cos((currentAngle * Math.PI) / 180);
      const vy = speed * Math.sin((currentAngle * Math.PI) / 180);
      projectiles.push({ x: player.x, y: player.y, vx, vy });
    }

    // Kan evt. lytte på "space" her hvis ønskelig:
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        shootProjectile();
      }
    });

    // Game loop
    let animationId;
    function gameLoop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawPlayer();
      drawWind();
      drawTarget();
      drawProjectiles();
      drawExplosion();
      updateProjectiles();
      animationId = requestAnimationFrame(gameLoop);
    }

    // Start animasjon
    gameLoop();

    // Rydd opp hvis komponenten un-mountes
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      window.removeEventListener("keydown", (e) => {
        if (e.code === "Space") {
          shootProjectile();
        }
      });
    };
  }, []); 
  // Merk: ingen [angle]-dependency; kjører kun én gang ved mount

  // Denne effekten håndterer kun piltaster for å justere angle‐state:
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "ArrowUp") {
        setAngle((prevAngle) => prevAngle - 2);
      }
      if (event.key === "ArrowDown") {
        setAngle((prevAngle) => prevAngle + 2);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div>
      <h1>Dark Forest Prototype</h1>
      <p>Use arrow keys to adjust angle, space to shoot.</p>
      <canvas ref={canvasRef} id="gameCanvas" width="800" height="400"></canvas>
      {/* Viser angle rett fra state */}
      <p>Angle: {angle}°</p>
    </div>
  );
}

export default App;
