import {
  AmbientLight,
  BoxGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  GridHelper,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  Object3D,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  Raycaster,
  Scene,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import * as TWEEN from "@tweenjs/tween.js";
import type { Camp, Position } from "@chess/game-core";

const BOARD_SIZE = 15;
const CELL_SIZE = 6;
const HALF_SPAN = ((BOARD_SIZE - 1) * CELL_SIZE) / 2;

export default class Draw {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  controls: OrbitControls;
  container: HTMLElement;
  resizeObserver?: ResizeObserver;
  boardGroup: Group;
  pieceGroup: Group;
  highlightGroup: Group;
  pieceMap: Map<string, Object3D>;
  tweenGroup: TWEEN.Group;
  intersectionPlane: Plane;

  constructor(id: string) {
    const container = document.getElementById(id);

    if (!container) {
      throw new Error("pass container id");
    }

    this.container = container;
    this.scene = new Scene();
    this.scene.background = new Color("#ebe2c7");
    this.camera = new PerspectiveCamera(55, container.offsetWidth / container.offsetHeight, 1, 1000);
    this.camera.position.set(0, 72, 44);
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(container.offsetWidth, container.offsetHeight);
    container.replaceChildren(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.maxPolarAngle = Math.PI * 0.5;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    this.scene.add(new AmbientLight("#ffffff", 1.2));
    const light = new DirectionalLight("#fff6dd", 1.8);
    light.position.set(20, 60, 30);
    this.scene.add(light);

    this.boardGroup = new Group();
    this.pieceGroup = new Group();
    this.highlightGroup = new Group();
    this.scene.add(this.boardGroup, this.pieceGroup, this.highlightGroup);
    this.pieceMap = new Map();
    this.tweenGroup = new TWEEN.Group();
    this.intersectionPlane = new Plane(new Vector3(0, 1, 0), 0);
    this.initResizeObserver();

    this.renderer.setAnimationLoop(() => {
      this.controls.update();
      this.tweenGroup.update();
      this.renderer.render(this.scene, this.camera);
    });
  }

  private handleResize = () => {
    const width = Math.max(this.container.clientWidth, 1);
    const height = Math.max(this.container.clientHeight, 1);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);
  };

  private initResizeObserver() {
    this.handleResize();
    window.addEventListener("resize", this.handleResize);

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });
    this.resizeObserver.observe(this.container);
  }

  drawBoard() {
    const base = new Mesh(
      new BoxGeometry(HALF_SPAN * 2 + 12, 2, HALF_SPAN * 2 + 12),
      new MeshPhongMaterial({ color: "#b68c57" }),
    );
    base.position.y = -1.2;
    this.boardGroup.add(base);

    const surface = new Mesh(
      new PlaneGeometry(HALF_SPAN * 2 + 8, HALF_SPAN * 2 + 8),
      new MeshPhongMaterial({ color: "#d8b27a", side: DoubleSide }),
    );
    surface.rotateX(-Math.PI / 2);
    this.boardGroup.add(surface);

    const grid = new GridHelper(HALF_SPAN * 2, BOARD_SIZE - 1, "#3b2410", "#3b2410");
    grid.position.y = 0.05;
    this.boardGroup.add(grid);
  }

  initEvent(cb: (position: Position) => void) {
    const raycaster = new Raycaster();
    const mouse = new Vector2();

    this.renderer.domElement.addEventListener("click", (event) => {
      mouse.x = (event.offsetX / this.renderer.domElement.offsetWidth) * 2 - 1;
      mouse.y = -(event.offsetY / this.renderer.domElement.offsetHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, this.camera);

      const point = new Vector3();
      if (!raycaster.ray.intersectPlane(this.intersectionPlane, point)) {
        return;
      }

      const snapped = this.toBoardPosition(point);
      if (!snapped) {
        return;
      }

      cb(snapped);
    });
  }

  drawPiece(id: string, camp: Camp, position: Position) {
    const stone = new Group();
    const isBlackStone = camp === "black";
    const bodyMaterial = new MeshPhongMaterial({
      color: isBlackStone ? "#161616" : "#f4efe2",
      emissive: isBlackStone ? "#050505" : "#c7bda9",
      shininess: isBlackStone ? 90 : 55,
      specular: new Color(isBlackStone ? "#7a7a7a" : "#ffffff"),
    });

    const base = new Mesh(new CylinderGeometry(2.25, 2.55, 0.9, 48), bodyMaterial);
    base.position.y = 0.5;
    stone.add(base);

    const dome = new Mesh(new SphereGeometry(2.32, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2), bodyMaterial);
    dome.position.y = 0.9;
    dome.scale.y = 0.48;
    stone.add(dome);

    const highlight = new Mesh(
      new SphereGeometry(0.72, 24, 16),
      new MeshPhongMaterial({
        color: isBlackStone ? "#f3f3f3" : "#fffdf7",
        transparent: true,
        opacity: isBlackStone ? 0.18 : 0.32,
        shininess: 100,
      }),
    );
    highlight.position.set(-0.58, 1.55, -0.5);
    highlight.scale.set(1.1, 0.48, 0.8);
    stone.add(highlight);

    stone.position.copy(this.toWorldPosition(position));
    stone.position.y = 0.15;
    stone.name = id;
    this.pieceMap.set(id, stone);
    this.pieceGroup.add(stone);
  }

  syncPieces(moves: Array<{ id: string; camp: Camp; position: Position }>) {
    const nextIds = new Set(moves.map((move) => move.id));

    for (const [id, mesh] of this.pieceMap.entries()) {
      if (!nextIds.has(id)) {
        this.pieceGroup.remove(mesh);
        this.pieceMap.delete(id);
      }
    }

    for (const move of moves) {
      const existing = this.pieceMap.get(move.id);
      if (existing) {
        existing.position.copy(this.toWorldPosition(move.position));
        existing.position.y = 0.15;
        continue;
      }

      this.drawPiece(move.id, move.camp, move.position);
    }
  }

  showHover(position: Position) {
    this.highlightGroup.clear();
    const marker = new Mesh(
      new CircleGeometry(2.6, 32),
      new MeshBasicMaterial({ color: "#2a8f5b", transparent: true, opacity: 0.35 }),
    );
    marker.rotateX(-Math.PI / 2);
    marker.position.copy(this.toWorldPosition(position));
    marker.position.y = 0.3;
    this.highlightGroup.add(marker);
  }

  clearHover() {
    this.highlightGroup.clear();
  }

  setCameraPosition(type: string, camp: Camp | "viewer") {
    const z = camp === "black" ? -44 : 44;
    const y = type === "down" ? 88 : 72;
    const target = type === "down" ? new Vector3(0, 88, camp === "black" ? -0.01 : 0.01) : new Vector3(0, y, z);
    const tween = new TWEEN.Tween(this.camera.position, this.tweenGroup).to(target, 600).start();
    tween.onComplete(() => tween.remove());
  }

  resetCameraToFront(camp: Camp | "viewer") {
    this.camera.position.set(0, 72, camp === "black" ? -44 : 44);
    this.controls.update();
  }

  setSide(camp: Camp | "viewer") {
    this.resetCameraToFront(camp);
  }

  destroy() {
    this.resizeObserver?.disconnect();
    window.removeEventListener("resize", this.handleResize);
    this.renderer.setAnimationLoop(null);
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.parentElement?.removeChild(this.renderer.domElement);
  }

  private toWorldPosition(position: Position) {
    return new Vector3(position[0] * CELL_SIZE - HALF_SPAN, 0, position[1] * CELL_SIZE - HALF_SPAN);
  }

  private toBoardPosition(point: Vector3): Position | null {
    const x = Math.round((point.x + HALF_SPAN) / CELL_SIZE);
    const y = Math.round((point.z + HALF_SPAN) / CELL_SIZE);

    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) {
      return null;
    }

    return [x, y];
  }
}
