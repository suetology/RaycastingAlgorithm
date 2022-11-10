const SW = window.innerWidth;
const SH = window.innerHeight;

const canvas = document.createElement("canvas");
canvas.setAttribute("width", SW);
canvas.setAttribute("height", SH);
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");

const TICK = 30;
const CS = 64;
const PS = 10;
const FOV = toRad(60);
const map = [
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1]
];

class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

const player = {
    pos: new Vec2(CS * 1.5, CS * 2),
    angle: toRad(0),
    speed: 0
}

const clearScreen = () => {
    ctx.fillColor = "black";
    ctx.clearRect(0, 0, SW, SH);
}

const movePlayer = () => {
    player.pos.x += Math.cos(player.angle) * player.speed;
    player.pos.y += Math.sin(player.angle) * player.speed;
}

const outOfMap = (cell) => cell.y >= map.length || cell.x >= map[0].length || cell.y < 0 || cell.x < 0;

const distance = (a, b) => Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y));

function getVCollision(angle) {
    const right = Math.abs(Math.floor((angle - Math.PI / 2) / Math.PI) % 2);
  
    const firstX = right
      ? Math.floor(player.pos.x / CS) * CS + CS
      : Math.floor(player.pos.x / CS) * CS;
  
    const firstY = player.pos.y + (firstX - player.pos.x) * Math.tan(angle);
  
    const xA = right ? CS : -CS;
    const yA = xA * Math.tan(angle);
  
    let wall;
    let nextX = firstX;
    let nextY = firstY;
    while (!wall) {
      const cellX = right
        ? Math.floor(nextX / CS)
        : Math.floor(nextX / CS) - 1;
      const cellY = Math.floor(nextY / CS);
  
      if (outOfMap(new Vec2(cellX, cellY))) {
        break;
      }
      wall = map[cellY][cellX];
      if (!wall) {
        nextX += xA;
        nextY += yA;
      } else {
      }
    }
    return {
      angle,
      dist: distance(player.pos, new Vec2(nextX, nextY)),
      vertical: true,
    };
  }
  
  function getHCollision(angle) {
    const up = Math.abs(Math.floor(angle / Math.PI) % 2);
    const firstY = up
      ? Math.floor(player.pos.y / CS) * CS
      : Math.floor(player.pos.y / CS) * CS + CS;
    const firstX = player.pos.x + (firstY - player.pos.y) / Math.tan(angle);
  
    const yA = up ? -CS : CS;
    const xA = yA / Math.tan(angle);
  
    let wall;
    let nextX = firstX;
    let nextY = firstY;
    while (!wall) {
      const cellX = Math.floor(nextX / CS);
      const cellY = up
        ? Math.floor(nextY / CS) - 1
        : Math.floor(nextY / CS);
  
      if (outOfMap(new Vec2(cellX, cellY))) {
        break;
      }
  
      wall = map[cellY][cellX];
      if (!wall) {
        nextX += xA;
        nextY += yA;
      }
    }
    return {
      angle,
      dist: distance(player.pos, new Vec2(nextX, nextY)),
      vertical: false,
    };
  }

const castRay = (angle) => {
    const vCollision = getVCollision(angle);
    const hCollision = getHCollision(angle);

    if(vCollision.dist < hCollision.dist) {
        return vCollision;
    } else {
        return hCollision;
    }
}

const getRays = () => {
    const initialAng = player.angle - FOV / 2;
    const raysCount = SW;
    const angleStep = FOV / raysCount;

    return Array.from({ length: raysCount }, (_, i) => {
        const angle = initialAng + i * angleStep;
        const ray = castRay(angle);
        return ray;
    });
}   

const fixFishEye = (dist, angle, playerAngle) => dist * Math.cos(angle - playerAngle);

const renderScene = (rays) => {

    rays.forEach((ray, i) => {

        const dist = ray.dist;
        const wallHeight = ((CS * 5) / dist) * 277;
        const wallColor = ((CS * 5) / dist) * 255;
        
        ctx.fillStyle = `rgb(${wallColor}, ${wallColor}, ${wallColor})`
        
        ctx.fillRect(i, SH / 2 - wallHeight / 2, 1, wallHeight);

        ctx.fillStyle = "grey";

        ctx.fillRect(i, SH / 2 + wallHeight / 2, 1, (SH - wallHeight) / 2)
        
    });
}

const renderMinimap = (pos = new Vec2(0, 0), scale = 1, rays) => {
    const cs = CS * scale;
    map.forEach((row, y) => {
        row.forEach((cell, x) => {
            if(cell) {
                ctx.fillStyle = "grey";
                ctx.fillRect(pos.x + x * cs, pos.y + y * cs, cs, cs);
            }
        });
    });
    ctx.fillStyle = "black";
    ctx.fillRect(pos.x + player.pos.x * scale - PS / 2,
                 pos.y + player.pos.y * scale - PS / 2, PS, PS);

    const rayLength = PS * 2;
    ctx.strokeStyle = "black";

    ctx.strokeStyle = "black";
    ctx.beginPath();

    
    rays.forEach(ray => {
        ctx.moveTo(pos.x + player.pos.x * scale, pos.y + player.pos.y * scale);
        ctx.lineTo(pos.x + (player.pos.x + Math.cos(ray.angle) * ray.dist) * scale,
                   pos.y + (player.pos.y + Math.sin(ray.angle) * ray.dist) * scale); 
    });

    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(pos.x + player.pos.x * scale, pos.y + player.pos.y * scale);
    ctx.lineTo(pos.x + (player.pos.x + Math.cos(player.angle) * rayLength) * scale,
               pos.y + (player.pos.y + Math.sin(player.angle) * rayLength) * scale); 
    ctx.closePath();
    ctx.stroke();

}

const gameLoop = () => {
    clearScreen();
    movePlayer();
    const rays = getRays();
    renderScene(rays);
    renderMinimap(new Vec2(0, 0), 0.75, rays);
    
}

function toRad (deg) {
    return deg * Math.PI / 180;
}

setInterval(gameLoop, TICK);

document.addEventListener("keydown", (e) => {
    if(e.key == "ArrowUp") {
        player.speed = 2;
    }
    if(e.key == "ArrowDown") {
        player.speed = -2;
    }
});

document.addEventListener("keyup", (e) => {
    if(e.key == "ArrowUp" || e.key == "ArrowDown") {
        player.speed = 0;
    }
});

document.addEventListener("mousemove", (e) => {
    player.angle += toRad(e.movementX / 2);

    /* if(player.angle < 0) {
        player.angle += 2 * Math.PI;
    }
    if(player.angle >= 2 * Math.PI) {
        player.angle %= Math.PI;
    }
 */
})