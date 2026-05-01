import {
  AmbientLight,
  AxesHelper,
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
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
  RingGeometry,
  Scene,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { BufferGeometryUtils, OrbitControls, SVGLoader } from "three/examples/jsm/Addons.js";
import * as TWEEN from "@tweenjs/tween.js";
import { createInitialPieces, type Camp, type PieceLabel } from "@chess/game-core";
import svg from "./svg";
import { getChineseChessTheme, type ChineseChessTheme, type ChineseChessThemeId } from "./theme";

interface HighlightTarget {
  id: string;
  position: [number, number];
}

export default class Draw {
  theme: ChineseChessTheme;
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
  _alertGroup: Group;
  _originRotation?: number;
  _chessRotation: boolean;
  _tweenGroup?: TWEEN.Group;

  constructor(id: string, themeId: ChineseChessThemeId) {
    this.theme = getChineseChessTheme(themeId);
    const { scene, camera, renderer, controls, boardGroup, chessGroup, container } = this.initScene(id);
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.controls = controls;
    this.container = container;
    this.boardGroup = boardGroup;
    this.chessGroup = chessGroup;
    this._rangeGroup = new Group();
    this._alertGroup = new Group();
    this.scene.add(this._rangeGroup);
    this.scene.add(this._alertGroup);
    this._chessMap = new Map();
    this.lineWidth = this.theme.lineWidth;
    this._lineMaterial = new MeshBasicMaterial({
      color: this.theme.lineColor,
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
    scene.background = new Color(this.theme.sceneBackground);

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
      color: this.theme.boardSurface,
      side: DoubleSide,
    });
    const geometry = new BoxGeometry(110, 120, this.theme.boardThickness);
    geometry.rotateX(-Math.PI / 2);
    const mesh = new Mesh(geometry, material);
    mesh.position.set(0, -(this.theme.boardThickness / 2 + 0.3), 0);
    mesh.name = "bg";
    const box = new BoxGeometry(1, 1, 1);
    const material2 = new MeshPhongMaterial({
      color: this.theme.boardAccent,
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
    const shape = new Shape().absarc(0, 0, this.theme.pieceRadius, 1.99 * Math.PI, 0, true);
    const extrudeSettings = {
      curveSegments: 24,
      steps: 1,
      depth: this.theme.pieceDepth,
      bevelEnabled: true,
      bevelThickness: 0.3,
      bevelSize: this.theme.pieceBevelSize,
      bevelSegments: 6,
    };
    const geometry = new ExtrudeGeometry(shape, extrudeSettings);
    geometry.rotateX(-Math.PI / 2);
    const material = new MeshPhongMaterial({ color: this.theme.pieceBase });
    const mesh = new Mesh(geometry, material);
    mesh.name = name;
    this._chessMap.set(name, mesh);
    this.chessGroup.add(mesh);
    const textMaterial = new MeshPhongMaterial({
      color: new Color(camp === "red" ? this.theme.pieceTextRed : this.theme.pieceTextBlack),
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
      textGeometry.scale(this.theme.pieceTextScale, this.theme.pieceTextScale, this.theme.pieceTextScale);
      const textMesh = new Mesh(textGeometry, textMaterial);
      textMesh.position.set(0, this.theme.pieceDepth + 0.4, 0);
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

  private createRangeMarker() {
    const material = new MeshBasicMaterial({
      color: new Color(this.theme.rangeColor),
      side: DoubleSide,
      opacity: 0.52,
      transparent: true,
    });

    switch (this.theme.rangeMarkerStyle) {
      case "ring": {
        const mesh = new Mesh(new RingGeometry(1.35, 2.4, 32), material);
        mesh.rotateX(Math.PI / 2);
        return mesh;
      }
      case "diamond": {
        const mesh = new Mesh(new PlaneGeometry(3.4, 3.4), material);
        mesh.rotateX(Math.PI / 2);
        mesh.rotateZ(Math.PI / 4);
        return mesh;
      }
      case "plate": {
        const mesh = new Mesh(new CylinderGeometry(1.65, 1.65, 0.42, 24), material);
        return mesh;
      }
      case "halo": {
        const mesh = new Mesh(new TorusGeometry(1.8, 0.42, 12, 32), material);
        mesh.rotateX(Math.PI / 2);
        return mesh;
      }
      case "disc":
      default: {
        const mesh = new Mesh(new CircleGeometry(2.05, 32), material);
        mesh.rotateX(Math.PI / 2);
        return mesh;
      }
    }
  }

  private createTargetMarker() {
    const material = new MeshBasicMaterial({
      color: new Color(this.theme.targetColor),
      side: DoubleSide,
      opacity: 0.56,
      transparent: true,
    });

    switch (this.theme.targetMarkerStyle) {
      case "ring": {
        const mesh = new Mesh(new RingGeometry(2.2, 2.9, 36), material);
        mesh.rotateX(Math.PI / 2);
        return mesh;
      }
      case "cross": {
        const horizontal = new Mesh(new PlaneGeometry(5.2, 0.72), material);
        horizontal.rotateX(Math.PI / 2);
        const vertical = new Mesh(new PlaneGeometry(0.72, 5.2), material);
        vertical.rotateX(Math.PI / 2);
        const group = new Group();
        group.add(horizontal);
        group.add(vertical);
        return group;
      }
      case "diamond": {
        const mesh = new Mesh(new PlaneGeometry(4.9, 4.9), material);
        mesh.rotateX(Math.PI / 2);
        mesh.rotateZ(Math.PI / 4);
        return mesh;
      }
      case "spike": {
        const mesh = new Mesh(new CircleGeometry(2.8, 3), material);
        mesh.rotateX(Math.PI / 2);
        mesh.rotateZ(Math.PI / 2);
        return mesh;
      }
      case "square":
      default: {
        const mesh = new Mesh(new PlaneGeometry(4.8, 4.8), material);
        mesh.rotateX(Math.PI / 2);
        return mesh;
      }
    }
  }

  private addThreatLine(startX: number, startZ: number, endX: number, endZ: number, length: number) {
    const angle = Math.atan2(endX - startX, endZ - startZ);
    const centerX = (startX + endX) / 2;
    const centerZ = (startZ + endZ) / 2;

    const createLineSegment = (width: number, opacity: number, offset = 0) => {
      const line = new Mesh(
        new PlaneGeometry(length, width),
        new MeshBasicMaterial({
          color: new Color(this.theme.targetColor),
          transparent: true,
          opacity,
          side: DoubleSide,
        }),
      );
      line.rotateX(-Math.PI / 2);
      line.rotateY(angle);
      line.position.set(
        centerX + Math.cos(angle) * offset,
        0.2 + opacity * 0.05,
        centerZ - Math.sin(angle) * offset,
      );
      this._alertGroup.add(line);
    };

    switch (this.theme.threatLineStyle) {
      case "double":
        createLineSegment(0.42, 0.34, 0.45);
        createLineSegment(0.42, 0.34, -0.45);
        break;
      case "pulse":
        createLineSegment(1.55, 0.12);
        createLineSegment(0.95, 0.22);
        createLineSegment(0.45, 0.36);
        break;
      case "ladder": {
        createLineSegment(0.4, 0.3);
        const rungCount = Math.max(2, Math.floor(length / 8));
        for (let index = 0; index < rungCount; index += 1) {
          const progress = (index + 1) / (rungCount + 1);
          const rung = new Mesh(
            new PlaneGeometry(1.5, 0.28),
            new MeshBasicMaterial({
              color: new Color(this.theme.lineColor),
              transparent: true,
              opacity: 0.28,
              side: DoubleSide,
            }),
          );
          rung.rotateX(-Math.PI / 2);
          rung.rotateY(angle + Math.PI / 2);
          rung.position.set(startX + (endX - startX) * progress, 0.16, startZ + (endZ - startZ) * progress);
          this._alertGroup.add(rung);
        }
        break;
      }
      case "spike": {
        createLineSegment(0.62, 0.3);
        const spike = new Mesh(
          new CircleGeometry(1.35, 3),
          new MeshBasicMaterial({
            color: new Color(this.theme.targetColor),
            transparent: true,
            opacity: 0.48,
            side: DoubleSide,
          }),
        );
        spike.rotateX(-Math.PI / 2);
        spike.rotateZ(-angle + Math.PI / 2);
        spike.position.set(endX, 0.22, endZ);
        this._alertGroup.add(spike);
        break;
      }
      case "beam":
      default:
        createLineSegment(1.1, 0.26);
        break;
    }
  }

  showRangeAndTarget(position: number[][], target: HighlightTarget[]) {
    this._rangeGroup.clear();
    for (let i = 0; i < position.length; i++) {
      const pMesh = this.createRangeMarker();
      pMesh.name = "range";
      const threePosition = new Vector3(position[i][0] * 10 - 40, 0, -position[i][1] * 10 + 45);
      pMesh.userData.position = position[i];
      pMesh.position.set(threePosition.x, 4, threePosition.z);
      this._rangeGroup.add(pMesh);
    }
    for (let i = 0; i < target.length; i++) {
      const pMesh = this.createTargetMarker();
      pMesh.name = "target";
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

  showCheckMarker(position: [number, number] | null, threatPositions: Array<[number, number]>) {
    this._alertGroup.clear();

    if (!position) {
      return;
    }

    const outerRadius = 5.6 * this.theme.alertRingScale;
    const innerOuterRadius = 3.9 * this.theme.alertRingScale;
    const outerRing = new Mesh(
      new RingGeometry(outerRadius - 1, outerRadius, 48),
      new MeshBasicMaterial({
        color: new Color(this.theme.targetColor),
        transparent: true,
        opacity: 0.68,
        side: DoubleSide,
      }),
    );
    outerRing.rotateX(-Math.PI / 2);
    outerRing.position.set(position[0] * 10 - 40, 0.35, -position[1] * 10 + 45);

    const innerRing = new Mesh(
      new RingGeometry(innerOuterRadius - 0.6, innerOuterRadius, 48),
      new MeshBasicMaterial({
        color: new Color(this.theme.lineColor),
        transparent: true,
        opacity: 0.5,
        side: DoubleSide,
      }),
    );
    innerRing.rotateX(-Math.PI / 2);
    innerRing.position.set(position[0] * 10 - 40, 0.28, -position[1] * 10 + 45);

    this._alertGroup.add(outerRing);
    this._alertGroup.add(innerRing);

    for (const threatPosition of threatPositions) {
      const startX = threatPosition[0] * 10 - 40;
      const startZ = -threatPosition[1] * 10 + 45;
      const endX = position[0] * 10 - 40;
      const endZ = -position[1] * 10 + 45;
      const deltaX = endX - startX;
      const deltaZ = endZ - startZ;
      const length = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);

      if (length <= 0) {
        continue;
      }

      this.addThreatLine(startX, startZ, endX, endZ, length);

      if (this.theme.threatLineStyle === "pulse") {
        const orb = new Mesh(
          new SphereGeometry(0.7, 16, 16),
          new MeshBasicMaterial({
            color: new Color(this.theme.rangeColor),
            transparent: true,
            opacity: 0.32,
          }),
        );
        orb.position.set(startX, 0.85, startZ);
        this._alertGroup.add(orb);
      }
    }
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
