import {
  AmbientLight,
  AxesHelper,
  BoxGeometry,
  BufferGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  Shape,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { BufferGeometryUtils, OrbitControls, SVGLoader } from "three/examples/jsm/Addons.js";
import * as TWEEN from "@tweenjs/tween.js";
import { createInitialPieces, type Camp, type PieceLabel } from "@chess/game-core";
import svg from "./svg";

interface HighlightTarget {
  id: string;
  position: [number, number];
}

export default class Draw {
  scene: Scene;
  camera: PerspectiveCamera;
  boardGroup: Group;
  renderer: WebGLRenderer;
  controls: OrbitControls;
  container: HTMLElement;
  resizeObserver?: ResizeObserver;
  lineWidth: number;
  _lineMaterial: Material;
  chessGroup: Group;
  _chessMap: Map<string, Mesh>;
  _rangeGroup: Group;
  _originRotation?: number;
  _chessRotation: boolean;
  _tweenGroup?: TWEEN.Group;

  constructor(id: string) {
    const { scene, camera, renderer, controls, boardGroup, chessGroup, container } = this.initScene(id);
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.controls = controls;
    this.container = container;
    this.boardGroup = boardGroup;
    this.chessGroup = chessGroup;
    this._rangeGroup = new Group();
    this.scene.add(this._rangeGroup);
    this._chessMap = new Map();
    this.lineWidth = 0.2;
    this._lineMaterial = new MeshBasicMaterial({
      color: "rgb(0,0,0)",
    });
    this._chessRotation = false;
    this.initSceneEvent();
    this.initResizeObserver();
  }

  private handleResize = () => {
    const width = Math.max(this.container.clientWidth, 1);
    const height = Math.max(this.container.clientHeight, 1);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);
  };

  initialPieces() {
    return createInitialPieces();
  }

  initScene(id: string) {
    const container = document.getElementById(id);
    if (!container) throw new Error("pass container id");
    const scene = new Scene();
    scene.background = new Color("rgb(200,200,200)");

    const camera = new PerspectiveCamera(60, container.offsetWidth / container.offsetHeight, 1, 1000);
    camera.updateProjectionMatrix();
    scene.add(camera);
    camera.position.set(0, 85, 55);
    scene.add(new AmbientLight("rgb(255,255,255)"));
    const light = new DirectionalLight("rgb(255,255,255)", 1);
    light.position.set(50, 200, 100);
    light.position.multiplyScalar(1.3);
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    const d = 300;
    light.shadow.camera.left = -d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = -d;
    light.shadow.camera.far = 1000;
    scene.add(light);
    const axesHelper = new AxesHelper(1000);
    axesHelper.position.set(0, 0, 0);
    scene.add(axesHelper);
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    container.replaceChildren(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI * 0.5;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    this._tweenGroup = new TWEEN.Group();

    renderer.setAnimationLoop(() => {
      controls.update();
      if (this._tweenGroup) this._tweenGroup.update();
      renderer.render(scene, camera);
    });
    const boardGroup = new Group();
    scene.add(boardGroup);
    const chessGroup = new Group();
    scene.add(chessGroup);
    return {
      scene,
      camera,
      renderer,
      controls,
      boardGroup,
      chessGroup,
      container,
    };
  }

  initResizeObserver() {
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

  initSceneEvent() {
    this.controls.addEventListener("end", () => {
      const degree = (this.camera.rotation.z * 180) / Math.PI;
      if (degree < 90 && degree > -90) {
        this._rotateChessText(false);
      } else {
        this._rotateChessText(true);
      }
    });
  }

  flyTo(type: string, camp: "red" | "black" | "viewer") {
    if (type === "down") {
      const translate = new TWEEN.Tween(this.camera.position, this._tweenGroup)
        .to(new Vector3(0, 100, camp === "black" ? -0.01 : 0.01), 1000)
        .start()
        .onComplete(() => {
          translate.remove();
        });
      const rotate = new TWEEN.Tween(this.camera.rotation, this._tweenGroup)
        .to(new Vector3(-Math.PI / 2, 0, camp === "black" ? Math.PI : 0), 1000)
        .start()
        .onComplete(() => {
          rotate.remove();
        });
      return;
    }

    if (type === "front") {
      const target = new Vector3(0, 85, camp === "black" ? -55 : 55);
      const translate = new TWEEN.Tween(this.camera.position, this._tweenGroup)
        .to(target, 1000)
        .start()
        .onComplete(() => {
          translate.remove();
        });
    }
  }

  initEvent(cb: {
    (type: string, position?: [number, number], chessName?: string): void;
    (arg0: string, arg1: [number, number], arg2: string): void;
  }) {
    const raycaster = new Raycaster();
    const mouse = new Vector2(1, 1);
    this.renderer.domElement.addEventListener("click", (e) => {
      e.preventDefault();
      mouse.x = (e.offsetX / this.renderer.domElement.offsetWidth) * 2 - 1;
      mouse.y = -(e.offsetY / this.renderer.domElement.offsetHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, this.camera);
      const rangeIntersection = raycaster.intersectObject(this._rangeGroup);
      if (rangeIntersection[0]) {
        cb(
          rangeIntersection[0].object.name,
          rangeIntersection[0].object.userData.position,
          rangeIntersection[0].object.userData.name,
        );
      } else {
        const intersection = raycaster.intersectObject(this.chessGroup);
        const aliveChess: { object: { name: string } }[] = [];
        intersection.forEach((chess) => {
          if (chess.object.visible) {
            aliveChess.push(chess);
          }
        });
        if (aliveChess[0]) {
          cb(aliveChess[0].object.name);
        }
      }
    });
  }

  drawBoard() {
    this._drawBackground();
    this._drawLine();
    this._drawCrossFlower();
  }

  _drawBackground() {
    const material = new MeshPhongMaterial({
      color: "rgb(239,194,127)",
      side: DoubleSide,
    });
    const geometry = new BoxGeometry(110, 120, 2);
    geometry.rotateX(-Math.PI / 2);
    const mesh = new Mesh(geometry, material);
    mesh.position.set(0, -1.3, 0);
    mesh.name = "bg";
    const box = new BoxGeometry(1, 1, 1);
    const material2 = new MeshPhongMaterial({
      color: "rgb(100,0,100)",
      side: DoubleSide,
    });
    const boxMesh = new Mesh(box, material2.clone());
    this.boardGroup.add(boxMesh);
    this.boardGroup.add(mesh);
  }

  _drawLine() {
    const geometry = new PlaneGeometry(1, 1);
    geometry.rotateX(-Math.PI / 2);

    const line = new Mesh(geometry, this._lineMaterial.clone());
    line.name = "line";
    line.scale.set(80, 1, this.lineWidth);
    for (let i = 0; i < 10; i++) {
      const cLine = line.clone();
      cLine.position.set(0, 0.01, i * 10 - 45);
      this.boardGroup.add(cLine);
    }

    line.scale.set(40, 1, this.lineWidth);
    line.rotateY(Math.PI / 2);
    for (let i = 0; i < 9; i++) {
      const cLine = line.clone();
      cLine.position.set(i * 10 - 40, 0.01, 25);
      this.boardGroup.add(cLine);
      const cLine2 = line.clone();
      cLine2.position.set(i * 10 - 40, 0.01, -25);
      this.boardGroup.add(cLine2);
      if (i === 0 || i === 8) {
        const borderLine = line.clone();
        borderLine.position.set(i * 10 - 40, 0.01, 0);
        this.boardGroup.add(borderLine);
      }
    }

    line.scale.set(20 * Math.sqrt(2), 1, this.lineWidth);
    for (let i = 0; i < 2; i++) {
      const incline = line.clone();
      incline.rotateY(Math.PI / 4);
      incline.position.set(0, 0.01, 35 * (i ? 1 : -1));
      this.boardGroup.add(incline);
      const incline2 = incline.clone();
      incline2.rotateY(-Math.PI / 2);
      this.boardGroup.add(incline2);
    }
  }

  _drawCrossFlower() {
    const paddingOrigin = { x: 0.6, y: 0.6 };
    const crossFlowerLength = 4;
    const halfWidth = this.lineWidth / 2;
    const points = [
      new Vector3(paddingOrigin.x - halfWidth, 0.01, paddingOrigin.y - halfWidth),
      new Vector3(paddingOrigin.x - halfWidth, 0.01, crossFlowerLength),
      new Vector3(paddingOrigin.x + halfWidth, 0.01, paddingOrigin.y - halfWidth),
      new Vector3(paddingOrigin.x + halfWidth, 0.01, crossFlowerLength),
      new Vector3(paddingOrigin.x + halfWidth, 0.01, paddingOrigin.y + halfWidth),
      new Vector3(crossFlowerLength, 0.01, paddingOrigin.y - halfWidth),
      new Vector3(crossFlowerLength, 0.01, paddingOrigin.y + halfWidth),
    ];
    const pieceFlowerGeo = new BufferGeometry();
    pieceFlowerGeo.setFromPoints(points);
    pieceFlowerGeo.setIndex([0, 1, 2, 1, 3, 2, 2, 4, 5, 4, 6, 5]);
    const geometries = [pieceFlowerGeo];
    for (let i = 0; i < 3; i++) {
      const other = pieceFlowerGeo.clone();
      other.rotateY((-Math.PI / 2) * (i + 1));
      geometries.push(other);
    }
    const crossFlowerGeo = BufferGeometryUtils.mergeGeometries(geometries);
    const halfFlowerGeo = BufferGeometryUtils.mergeGeometries([geometries[0], geometries[1]]);
    const crossFlower = new Mesh(crossFlowerGeo, this._lineMaterial.clone());
    const halfFlower = new Mesh(halfFlowerGeo, this._lineMaterial.clone());
    for (let i = 0; i <= 1; i++) {
      const positions = [
        new Vector3(0, 0.01, 15),
        new Vector3(-20, 0.01, 15),
        new Vector3(20, 0.01, 15),
        new Vector3(30, 0.01, 25),
        new Vector3(-30, 0.01, 25),
      ];
      for (let j = 0; j < positions.length; j++) {
        const crossLine = crossFlower.clone();
        crossLine.position.set(positions[j].x, positions[j].y, (i ? 1 : -1) * positions[j].z);
        this.boardGroup.add(crossLine);
      }
      const positions2 = [new Vector3(-40, 0.01, 15), new Vector3(40, 0.01, 15)];
      for (let k = 0; k < positions2.length; k++) {
        const crossLine = halfFlower.clone();
        crossLine.rotateY(((k ? -1 : 1) * Math.PI) / 2);
        crossLine.position.set(positions2[k].x, positions2[k].y, (i ? 1 : -1) * positions2[k].z);
        this.boardGroup.add(crossLine);
      }
    }
  }

  drawChess(type: PieceLabel, camp: Camp, name: string) {
    const shape = new Shape().absarc(0, 0, 4, 1.99 * Math.PI, 0, true);
    const extrudeSettings = {
      curveSegments: 24,
      steps: 1,
      depth: 2,
      bevelEnabled: true,
      bevelThickness: 0.3,
      bevelSize: 0.3,
      bevelSegments: 6,
    };
    const geometry = new ExtrudeGeometry(shape, extrudeSettings);
    geometry.rotateX(-Math.PI / 2);
    const material = new MeshPhongMaterial({ color: "rgb(239,194,127)" });
    const mesh = new Mesh(geometry, material);
    mesh.name = name;
    this._chessMap.set(name, mesh);
    this.chessGroup.add(mesh);
    const textMaterial = new MeshPhongMaterial({
      color: new Color(camp),
      side: DoubleSide,
    });
    const loader = new SVGLoader();
    loader.load(svg[type], (data) => {
      const paths = data.paths;
      const textExtrudeSettings = {
        curveSegments: 24,
        steps: 1,
        depth: 50,
        bevelEnabled: true,
        bevelThickness: 0.3,
        bevelSize: 0.3,
        bevelSegments: 6,
      };
      const geometries = [];
      for (let i = 0; i < paths.length; i++) {
        const shapes = SVGLoader.createShapes(paths[i]);
        for (let j = 0; j < shapes.length; j++) {
          const shapeGeometry = new ExtrudeGeometry(shapes[j], textExtrudeSettings);
          geometries.push(shapeGeometry);
        }
      }
      const textGeometry = BufferGeometryUtils.mergeGeometries(geometries);
      textGeometry.translate(-1008.5 / 2, -1008.5 / 2, 0);
      textGeometry.rotateX(Math.PI / 2);
      textGeometry.scale(0.0088, 0.0088, 0.0088);
      const textMesh = new Mesh(textGeometry, textMaterial);
      textMesh.position.set(0, 2.4, 0);
      textMesh.name = name;
      mesh.add(textMesh);
    });
  }

  _rotateChessText(flag: boolean) {
    if (this._chessRotation !== flag) {
      for (let i = 0; i < this.chessGroup.children.length; i++) {
        const element = this.chessGroup.children[i];
        if (element && this._originRotation !== undefined) {
          element.rotation.set(
            element.rotation.x,
            this._originRotation + (this._chessRotation ? 0 : Math.PI),
            element.rotation.z,
          );
        }
      }
      this._chessRotation = flag;
    }
  }

  syncCampOrientation(camp: "red" | "black" | "viewer") {
    this._originRotation = 0;

    if (camp === "black") {
      this._rotateChessText(true);
      return;
    }

    this._rotateChessText(false);
  }

  resetCameraToFront(camp: "red" | "black" | "viewer") {
    this.camera.position.set(0, 85, camp === "black" ? -55 : 55);
    this.controls.update();
  }

  setChessRotation(camp: "red" | "black" | "viewer") {
    this.syncCampOrientation(camp);
    this.resetCameraToFront(camp);
  }

  setPosition(name: string, position: [number, number]) {
    const threePosition = new Vector3(position[0] * 10 - 40, 0, -position[1] * 10 + 45);
    if (this._chessMap.has(name)) {
      this._chessMap.get(name)?.position.set(threePosition.x, threePosition.y, threePosition.z);
    }
  }

  setVisible(name: string, visible: boolean) {
    const chess = this._chessMap.get(name);

    if (!chess) {
      return;
    }

    chess.visible = visible;
    chess.children.forEach((mesh) => {
      mesh.visible = visible;
    });
  }

  hidden(name: string) {
    this.setVisible(name, false);
  }

  showRangeAndTarget(position: number[][], target: HighlightTarget[]) {
    this._rangeGroup.clear();
    const material = new MeshBasicMaterial({
      color: new Color("green"),
      side: DoubleSide,
      opacity: 0.5,
      transparent: true,
    });
    const targetMaterial = new MeshBasicMaterial({
      color: new Color("red"),
      side: DoubleSide,
      opacity: 0.5,
      transparent: true,
    });
    const geometry = new PlaneGeometry(5, 5);
    geometry.rotateX(Math.PI / 2);
    const mesh = new Mesh(geometry, material);
    mesh.name = "range";
    for (let i = 0; i < position.length; i++) {
      const pMesh = mesh.clone();
      const threePosition = new Vector3(position[i][0] * 10 - 40, 0, -position[i][1] * 10 + 45);
      pMesh.userData.position = position[i];
      pMesh.position.set(threePosition.x, 4, threePosition.z);
      this._rangeGroup.add(pMesh);
    }
    const targetMesh = new Mesh(geometry, targetMaterial);
    targetMesh.name = "target";
    for (let i = 0; i < target.length; i++) {
      const pMesh = targetMesh.clone();
      pMesh.userData.name = target[i].id;
      const threePosition = new Vector3(
        target[i].position[0] * 10 - 40,
        0,
        -target[i].position[1] * 10 + 45,
      );
      pMesh.userData.position = target[i].position;
      pMesh.position.set(threePosition.x, 4, threePosition.z);
      this._rangeGroup.add(pMesh);
    }
  }

  clearRange() {
    this._rangeGroup.clear();
  }

  destroy() {
    this.resizeObserver?.disconnect();
    window.removeEventListener("resize", this.handleResize);
    this.renderer.setAnimationLoop(null);
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.parentElement?.removeChild(this.renderer.domElement);
  }
}
