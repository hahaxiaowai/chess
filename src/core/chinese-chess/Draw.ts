import {
  AmbientLight,
  AxesHelper,
  BoxGeometry,
  BufferGeometry,
  Camera,
  Color,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  MeshPhysicalMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  Shape,
  ShapeGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import {
  BufferGeometryUtils,
  OrbitControls,
  SVGLoader,
} from "three/examples/jsm/Addons.js";
import svg from "./svg";
import { Chess } from "./Chess";
export default class Draw {
  scene: Scene;
  camera: Camera;
  boardGroup: Group;
  renderer: WebGLRenderer;
  controls: OrbitControls;
  lineWidth: number;
  _lineMaterial: Material;
  chessGroup: Group;
  _chessMap: Map<string, Mesh>;
  _rangeGroup: Group;
  constructor(id: string) {
    const { scene, camera, renderer, controls, boardGroup, chessGroup } =
      this.initScene(id);
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.controls = controls;
    this.boardGroup = boardGroup;
    this.chessGroup = chessGroup;
    this._rangeGroup = new Group();
    this.scene.add(this._rangeGroup);
    this._chessMap = new Map();
    this.lineWidth = 0.2;
    this._lineMaterial = new MeshBasicMaterial({
      color: "rgb(0,0,0)",
      // side: DoubleSide,
    });
  }
  initScene(id: string) {
    const container = document.getElementById(id);
    if (!container) throw new Error("pass container id");
    const scene = new Scene();
    scene.background = new Color("rgb(200,200,200)");

    const camera = new PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    camera.updateProjectionMatrix();
    scene.add(camera);
    camera.rotateY(Math.PI);
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
    container.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI * 0.5;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    renderer.setAnimationLoop(() => {
      controls.update();
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
    };
  }
  initEvent(cb: { (chess: string | Chess): void; (arg0: string): void }) {
    console.log(this.renderer.domElement.height);
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
          rangeIntersection[0].object.userData.position
        );
      } else {
        const intersection = raycaster.intersectObject(this.chessGroup);
        if (intersection[0]) {
          cb(intersection[0].object.name);
        }
      }
    });
  }
  drawBoard() {
    // 此步骤可以考虑用性能更好的方式
    // 现在使用了很多Mesh,可以考虑instance等方式
    // 但目前并没有性能需求，因此选择更容易实现的方式
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
    // 用plane代替line，绘制非1像素的线
    const geometry = new PlaneGeometry(1, 1);
    geometry.rotateX(-Math.PI / 2);

    const line = new Mesh(geometry, this._lineMaterial.clone());
    line.name = "line";
    // x
    line.scale.set(80, 1, this.lineWidth);
    for (let i = 0; i < 10; i++) {
      const cLine = line.clone();
      cLine.position.set(0, 0.01, i * 10 - 45);
      this.boardGroup.add(cLine);
    }
    // y
    line.scale.set(40, 1, this.lineWidth);
    line.rotateY(Math.PI / 2);
    for (let i = 0; i < 9; i++) {
      const cLine = line.clone();
      cLine.position.set(i * 10 - 40, 0.01, 25);
      this.boardGroup.add(cLine);
      const cLine2 = line.clone();
      cLine2.position.set(i * 10 - 40, 0.01, -25);
      this.boardGroup.add(cLine2);
      if (i == 0 || i == 8) {
        const borderLine = line.clone();
        borderLine.position.set(i * 10 - 40, 0.01, 0); // 长度多绘制了，无碍
        this.boardGroup.add(borderLine);
      }
    }
    // 九宫格
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
    // 十字花
    const paddingOrigin = { x: 0.6, y: 0.6 }; // 距离原点的xy偏移
    const crossFlowerLength = 4;
    const halfWidth = this.lineWidth / 2;
    const points = [
      new Vector3(
        paddingOrigin.x - halfWidth,
        0.01,
        paddingOrigin.y - halfWidth
      ),
      new Vector3(paddingOrigin.x - halfWidth, 0.01, crossFlowerLength),
      new Vector3(
        paddingOrigin.x + halfWidth,
        0.01,
        paddingOrigin.y - halfWidth
      ),
      new Vector3(paddingOrigin.x + halfWidth, 0.01, crossFlowerLength),
      new Vector3(
        paddingOrigin.x + halfWidth,
        0.01,
        paddingOrigin.y + halfWidth
      ),
      new Vector3(crossFlowerLength, 0.01, paddingOrigin.y - halfWidth),
      new Vector3(crossFlowerLength, 0.01, paddingOrigin.y + halfWidth),
    ];
    const pieceFlowerGeo = new BufferGeometry();
    pieceFlowerGeo.setFromPoints(points);
    // 1_3
    // | |
    // | |4_____6
    // |_|______|
    // 0-2      5
    pieceFlowerGeo.setIndex([0, 1, 2, 1, 3, 2, 2, 4, 5, 4, 6, 5]);
    const geometries = [pieceFlowerGeo];
    for (let i = 0; i < 3; i++) {
      const other = pieceFlowerGeo.clone();
      other.rotateY((-Math.PI / 2) * (i + 1));
      geometries.push(other);
    }
    const crossFlowerGeo = BufferGeometryUtils.mergeGeometries(geometries);
    const halfFlowerGeo = BufferGeometryUtils.mergeGeometries([
      geometries[0],
      geometries[1],
    ]);
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
        crossLine.position.set(
          positions[j].x,
          positions[j].y,
          (i ? 1 : -1) * positions[j].z
        );
        this.boardGroup.add(crossLine);
      }
      const positions2 = [
        new Vector3(-40, 0.01, 15),
        new Vector3(40, 0.01, 15),
      ];
      for (let k = 0; k < positions2.length; k++) {
        const crossLine = halfFlower.clone();
        crossLine.rotateY(((k ? -1 : 1) * Math.PI) / 2);
        crossLine.position.set(
          positions2[k].x,
          positions2[k].y,
          (i ? 1 : -1) * positions2[k].z
        );
        this.boardGroup.add(crossLine);
      }
    }
  }
  drawChess(type: ChessTypes, camp: ChessCamp, name: string) {
    // 如果角度为2*Math.PI,会在开启bevelEnabled:true时导致圆柱没有完整闭合
    // 这可能是精度造成的问题，所以这里设置为1.99避免这个问题
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
    // geometry.translate(0, 0, 0.3);
    geometry.rotateX(-Math.PI / 2);
    const material = new MeshPhongMaterial({ color: "rgb(239,194,127)" });
    const mesh = new Mesh(geometry, material);
    mesh.name = name;
    this._chessMap.set(name, mesh);
    this.chessGroup.add(mesh);
    // 字
    const textMaterial = new MeshPhongMaterial({
      color: new Color(camp),
      side: DoubleSide,
    });
    const loader = new SVGLoader();
    loader.load(svg[type], (data) => {
      const paths = data.paths;
      const extrudeSettings = {
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
          const geometry = new ExtrudeGeometry(shapes[j], extrudeSettings);
          geometries.push(geometry);
        }
      }
      const geometry = BufferGeometryUtils.mergeGeometries(geometries);
      geometry.translate(-1008.5 / 2, -1008.5 / 2, 0);
      geometry.rotateX(Math.PI / 2);
      geometry.scale(0.0088, 0.0088, 0.0088);
      const textMesh = new Mesh(geometry, textMaterial);
      textMesh.position.set(0, 2.4, 0);
      textMesh.name = name;
      mesh.add(textMesh);
    });
  }
  setPosition(name: string, position: [number, number]) {
    const threePosition = new Vector3(
      position[0] * 10 - 40,
      0,
      -position[1] * 10 + 45
    );
    if (this._chessMap.has(name))
      this._chessMap
        .get(name)
        ?.position.set(threePosition.x, threePosition.y, threePosition.z);
  }
  showRange(position: number[][]) {
    this._rangeGroup.clear();
    const material = new MeshBasicMaterial({
      color: new Color("green"),
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
      const threePosition = new Vector3(
        position[i][0] * 10 - 40,
        0,
        -position[i][1] * 10 + 45
      );
      pMesh.userData.position = position[i];
      pMesh.position.set(threePosition.x, 4, threePosition.z);
      this._rangeGroup.add(pMesh);
    }
  }
  clearRange() {
    this._rangeGroup.clear();
  }
}
