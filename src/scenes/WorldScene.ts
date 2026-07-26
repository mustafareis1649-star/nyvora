import * as THREE from "three";
import type { Character } from "@/types/game";

const MOVE_SPEED = 6.5; // units per second
const TURN_SPEED = 3.2; // radians per second
const DAY_LENGTH_SECONDS = 240; // full day/night cycle length
const CHARACTER_RADIUS = 0.5; // used for building collision checks

interface InputState {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
}

interface BoxCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export class WorldScene {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock: THREE.Clock;
  private character!: THREE.Group;
  private sun!: THREE.DirectionalLight;
  private ambient!: THREE.AmbientLight;
  private hemi!: THREE.HemisphereLight;
  private input: InputState = { forward: false, back: false, left: false, right: false };
  private colliders: BoxCollider[] = [];
  private elapsed = 0;
  private disposed = false;
  private onPositionChange?: (pos: THREE.Vector3) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x0a0b12, 40, 160);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );
    this.camera.position.set(0, 4, 8);

    this.clock = new THREE.Clock();

    this.setupLights();
    this.setupGround();
    this.setupCityProps();
    this.setupCharacter(); // default appearance, overridden by setCharacterAppearance
    this.bindInput();

    window.addEventListener("resize", this.handleResize);
  }

  private setupLights() {
    this.hemi = new THREE.HemisphereLight(0x8899cc, 0x201a12, 0.6);
    this.scene.add(this.hemi);

    this.ambient = new THREE.AmbientLight(0xffffff, 0.15);
    this.scene.add(this.ambient);

    this.sun = new THREE.DirectionalLight(0xffe8c0, 1.2);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.left = -40;
    this.sun.shadow.camera.right = 40;
    this.sun.shadow.camera.top = 40;
    this.sun.shadow.camera.bottom = -40;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);
  }

  private setupGround() {
    const groundGeo = new THREE.PlaneGeometry(400, 400, 64, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x2b2a3a,
      roughness: 0.95,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // simple grid roads to suggest a city layout (Ashfall City placeholder)
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x151622, roughness: 0.9 });
    for (let i = -2; i <= 2; i++) {
      const roadH = new THREE.Mesh(new THREE.BoxGeometry(400, 0.02, 4), roadMat);
      roadH.position.set(0, 0.011, i * 20);
      this.scene.add(roadH);
      const roadV = new THREE.Mesh(new THREE.BoxGeometry(4, 0.02, 400), roadMat);
      roadV.position.set(i * 20, 0.012, 0);
      this.scene.add(roadV);
    }
  }

  private setupCityProps() {
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x3a3550,
      roughness: 0.7,
      metalness: 0.15,
    });
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0x8b7cf6,
      emissive: 0x8b7cf6,
      emissiveIntensity: 0.6,
    });

    const rand = (seed: number) => {
      const x = Math.sin(seed * 999) * 10000;
      return x - Math.floor(x);
    };

    let seed = 1;
    for (let gx = -3; gx <= 3; gx++) {
      for (let gz = -3; gz <= 3; gz++) {
        if (gx === 0 && gz === 0) continue; // keep spawn clear
        if (rand(seed++) > 0.55) continue; // sparse placement

        const height = 4 + rand(seed++) * 14;
        const width = 3 + rand(seed++) * 3;
        const building = new THREE.Mesh(
          new THREE.BoxGeometry(width, height, width),
          buildingMat
        );
        const px = gx * 20 + (rand(seed++) - 0.5) * 6;
        const pz = gz * 20 + (rand(seed++) - 0.5) * 6;
        building.position.set(px, height / 2, pz);
        building.castShadow = true;
        building.receiveShadow = true;
        this.scene.add(building);

        this.colliders.push({
          minX: px - width / 2,
          maxX: px + width / 2,
          minZ: pz - width / 2,
          maxZ: pz + width / 2,
        });

        // window glow strip
        const glow = new THREE.Mesh(
          new THREE.BoxGeometry(width * 0.9, 0.3, width * 0.9),
          glowMat
        );
        glow.position.set(px, height * 0.7, pz);
        this.scene.add(glow);
      }
    }
  }

  private setupCharacter() {
    this.character = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x8b7cf6, roughness: 0.5 });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0x4cd9e0, roughness: 0.4 });

    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.45, 1.1, 4, 12),
      bodyMat
    );
    body.position.y = 1.05;
    body.castShadow = true;
    body.name = "body";

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), accentMat);
    head.position.y = 1.95;
    head.castShadow = true;
    head.name = "head";

    this.character.add(body, head);
    this.character.position.set(0, 0, 0);
    this.scene.add(this.character);
  }

  /** Apply the appearance and class-tinted colors chosen in the character creator. */
  setCharacterAppearance(character: Character) {
    const body = this.character.getObjectByName("body") as THREE.Mesh;
    const head = this.character.getObjectByName("head") as THREE.Mesh;
    const bodyMat = body.material as THREE.MeshStandardMaterial;
    const accentMat = head.material as THREE.MeshStandardMaterial;
    bodyMat.color.set(character.appearance.bodyColor);
    accentMat.color.set(character.appearance.accentColor);
    this.character.scale.setScalar(character.appearance.height);
  }

  private bindInput() {
    const keyMap: Record<string, keyof InputState> = {
      KeyW: "forward",
      ArrowUp: "forward",
      KeyS: "back",
      ArrowDown: "back",
      KeyA: "left",
      ArrowLeft: "left",
      KeyD: "right",
      ArrowRight: "right",
    };
    window.addEventListener("keydown", (e) => {
      const key = keyMap[e.code];
      if (key) this.input[key] = true;
    });
    window.addEventListener("keyup", (e) => {
      const key = keyMap[e.code];
      if (key) this.input[key] = false;
    });
  }

  private handleResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  onMove(callback: (pos: THREE.Vector3) => void) {
    this.onPositionChange = callback;
  }

  private updateDayNightCycle(delta: number) {
    this.elapsed += delta;
    const t = (this.elapsed % DAY_LENGTH_SECONDS) / DAY_LENGTH_SECONDS; // 0..1
    const angle = t * Math.PI * 2;

    const sunHeight = Math.sin(angle);
    const sunX = Math.cos(angle) * 60;
    const sunY = Math.max(sunHeight, -0.15) * 60 + 10;
    const sunZ = 20;
    this.sun.position.set(sunX, sunY, sunZ);
    this.sun.target.position.copy(this.character.position);

    const dayIntensity = THREE.MathUtils.clamp(sunHeight + 0.15, 0, 1);
    this.sun.intensity = 0.15 + dayIntensity * 1.3;
    this.hemi.intensity = 0.25 + dayIntensity * 0.55;

    // sky color: deep violet-night -> warm dusk -> bright day
    const nightColor = new THREE.Color(0x05060d);
    const duskColor = new THREE.Color(0x3a2a4a);
    const dayColor = new THREE.Color(0x87b6e8);

    let skyColor: THREE.Color;
    if (dayIntensity < 0.5) {
      skyColor = nightColor.clone().lerp(duskColor, dayIntensity * 2);
    } else {
      skyColor = duskColor.clone().lerp(dayColor, (dayIntensity - 0.5) * 2);
    }
    this.renderer.setClearColor(skyColor);
    if (this.scene.fog) (this.scene.fog as THREE.Fog).color = skyColor;
  }

  private collidesAt(x: number, z: number): boolean {
    for (const c of this.colliders) {
      if (
        x > c.minX - CHARACTER_RADIUS &&
        x < c.maxX + CHARACTER_RADIUS &&
        z > c.minZ - CHARACTER_RADIUS &&
        z < c.maxZ + CHARACTER_RADIUS
      ) {
        return true;
      }
    }
    return false;
  }

  private updateMovement(delta: number) {
    let turn = 0;
    if (this.input.left) turn += TURN_SPEED * delta;
    if (this.input.right) turn -= TURN_SPEED * delta;
    this.character.rotation.y += turn;

    let move = 0;
    if (this.input.forward) move += MOVE_SPEED * delta;
    if (this.input.back) move -= MOVE_SPEED * delta;

    if (move !== 0) {
      const forwardDir = new THREE.Vector3(0, 0, 1).applyQuaternion(
        this.character.quaternion
      );
      const deltaX = forwardDir.x * move;
      const deltaZ = forwardDir.z * move;
      const curX = this.character.position.x;
      const curZ = this.character.position.z;

      // try full move first; if blocked, slide along whichever axis is clear
      // so walking into a wall doesn't just stop the character dead — it
      // slides along the wall instead, the way most 3D games handle it.
      if (!this.collidesAt(curX + deltaX, curZ + deltaZ)) {
        this.character.position.x += deltaX;
        this.character.position.z += deltaZ;
      } else if (!this.collidesAt(curX + deltaX, curZ)) {
        this.character.position.x += deltaX;
      } else if (!this.collidesAt(curX, curZ + deltaZ)) {
        this.character.position.z += deltaZ;
      }
      // else: fully blocked, don't move
    }

    // camera follows behind and slightly above the character
    const camOffset = new THREE.Vector3(0, 3.2, -6.5).applyQuaternion(
      this.character.quaternion
    );
    const desiredCamPos = this.character.position.clone().add(camOffset);
    this.camera.position.lerp(desiredCamPos, 1 - Math.pow(0.001, delta));
    const lookTarget = this.character.position.clone().add(new THREE.Vector3(0, 1.4, 0));
    this.camera.lookAt(lookTarget);

    if (this.onPositionChange) this.onPositionChange(this.character.position);
  }

  setPosition(x: number, y: number, z: number) {
    this.character.position.set(x, y, z);
  }

  start() {
    const animate = () => {
      if (this.disposed) return;
      requestAnimationFrame(animate);
      const delta = Math.min(this.clock.getDelta(), 0.1);
      this.updateDayNightCycle(delta);
      this.updateMovement(delta);
      this.renderer.render(this.scene, this.camera);
    };
    this.handleResize();
    animate();
  }

  dispose() {
    this.disposed = true;
    window.removeEventListener("resize", this.handleResize);
    this.renderer.dispose();
  }
}
