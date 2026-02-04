//Google login
google.accounts.id.initialize({
  client_id:
    "513987483285-39d6qma9ollbkb9b3rukvdvc50hu993u.apps.googleusercontent.com",
  callback: onLoginSuccess,
});

google.accounts.id.renderButton(document.getElementById("google-btn"), {
  theme: "outline",
  size: "large",
});

function onLoginSuccess() {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("container").style.display = "block";
  document.getElementById("ui-bar").style.display = "flex";

  loadSheetData();
}

const PYRAMID_ROTATION = {
  x: -0.35,
  y: Math.PI / 4,
  z: 0
};


//data from Gsheet
const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTRwkOJehAAJnhCm_Vfq8owyRd1WsATIKYrzEpiGerXddC0-KGCDZpdK_oTAC0RLEPw9DiUmlTQTVRY/pub?output=csv";

function loadSheetData() {
  fetch(CSV_URL)
    .then((res) => res.text())
    .then((csvText) => {
      const parsed = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
      });

      processData(parsed.data);
    });
}

function processData(rows) {
  const people = rows.map((r) => ({
    name: r["Name"],
    photo: r["Photo"],
    age: r["Age"],
    country: r["Country"],
    interest: r["Interest"],
    networth: parseNetWorth(r["Net Worth"]),
  }));

  init3D(people);
  transform(targets.table);
}

function parseNetWorth(value) {
  if (!value) return 0;
  return Number(value.replace(/\$/g, "").replace(/,/g, ""));
}

//three.js global
let camera, scene, renderer, controls;
const objects = [];
const targets = {
  table: [],
  sphere: [],
  helix: [],
  grid: [],
  pyramid: [],
};

//init 3D
function init3D(data) {
  camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    1,
    10000,
  );
  camera.position.z = 3000;

  scene = new THREE.Scene();

  createObjects(data);
  createLayouts();

  renderer = new THREE.CSS3DRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("container").appendChild(renderer.domElement);

  controls = new THREE.TrackballControls(camera, renderer.domElement);
  controls.minDistance = 500;
  controls.maxDistance = 6000;

  // Buttons
  document.getElementById("table").onclick = () => transform(targets.table);
  document.getElementById("sphere").onclick = () => transform(targets.sphere);
  document.getElementById("helix").onclick = () => transform(targets.helix);
  document.getElementById("grid").onclick = () => transform(targets.grid);
  document.getElementById("pyramid").onclick = () =>transform(targets.pyramid);

  animate();
}

//Net worth (color)
function getColor(networth) {
  if (networth < 100000) return "#EF3022"; // Red (Low)
  if (networth < 200000) return "#E8BB36"; // Orange (Medium)
  return "#3A9F48"; // Green (High)
}

//Tiles
function createObjects(data) {
  data.forEach((person, i) => {
    const element = document.createElement("div");
    element.className = "element";
    element.style.backgroundColor = getColor(person.networth);

    element.innerHTML = `
  <div class="number">${i + 1}</div>

  <div class="photo">
    <img src="${person.photo}" onerror="this.style.display='none'" />
  </div>

  <div class="meta">
    <div class="age-country">${person.age} yrs, ${person.country}</div>
    <div class="interest">${person.interest}</div>
    <div class="networth">$${person.networth.toLocaleString()}</div>
  </div>
`;

    const object = new THREE.CSS3DObject(element);
    object.position.set(
      Math.random() * 4000 - 2000,
      Math.random() * 4000 - 2000,
      Math.random() * 4000 - 2000,
    );

    scene.add(object);
    objects.push(object);
  });
}

//Layouts
function createLayouts() {
  targets.table = [];
  targets.sphere = [];
  targets.helix = [];
  targets.grid = [];
  targets.pyramid = [];

  createTable();
  createSphere();
  createHelix();
  createGrid();
  createPyramid();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  camera.position.z = window.innerWidth < 600 ? 4200 : 3000;

  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", onWindowResize);


/* TABLE 20 x 10 (IMAGE B) */
function createTable() {
  objects.forEach((obj, i) => {
    const target = new THREE.Object3D();
    target.position.x = (i % 20) * 140 - 1330;
    target.position.y = -Math.floor(i / 20) * 180 + 800;
    target.position.z = 0;

    targets.table.push(target);
  });
}

/* SPHERE */
function createSphere() {
  const spherical = new THREE.Spherical();
  const vector = new THREE.Vector3();

  objects.forEach((obj, i) => {
    const target = new THREE.Object3D();
    const phi = Math.acos(-1 + (2 * i) / objects.length);
    const theta = Math.sqrt(objects.length * Math.PI) * phi;

    spherical.set(800, phi, theta);
    target.position.setFromSpherical(spherical);
    vector.copy(target.position).multiplyScalar(2);
    target.lookAt(vector);

    targets.sphere.push(target);
  });
}

/* DOUBLE HELIX */
function createHelix() {
  targets.helix = [];

  const radius = 800;
  const verticalSpacing = 25;
  const turns = 4;

  objects.forEach((obj, i) => {
    const target = new THREE.Object3D();

    const strand = i % 2; // 0 or 1
    const angle =
      (Math.floor(i / 2) / objects.length) * Math.PI * 2 * turns
      + (strand * Math.PI);

    const y = -(Math.floor(i / 2) * verticalSpacing) + 800;

    target.position.set(
      Math.cos(angle) * radius,
      y,
      Math.sin(angle) * radius
    );

    targets.helix.push(target);
  });
}


/* GRID 5 x 4 x 10 (IMAGE C) */
function createGrid() {
  objects.forEach((obj, i) => {
    const target = new THREE.Object3D();
    target.position.set(
      (i % 5) * 400 - 800,
      (Math.floor(i / 5) % 4) * 400 - 600,
      Math.floor(i / 20) * 400 - 800,
    );
    targets.grid.push(target);
  });
}

function createPyramid() {
  targets.pyramid = [];

  const size = 1000;
  const geometry = new THREE.TetrahedronGeometry(size);
  const nonIndexed = geometry.toNonIndexed();
  const positions = nonIndexed.attributes.position.array;

  const faces = [];
  for (let i = 0; i < positions.length; i += 9) {
    faces.push([
      new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]),
      new THREE.Vector3(positions[i + 3], positions[i + 4], positions[i + 5]),
      new THREE.Vector3(positions[i + 6], positions[i + 7], positions[i + 8])
    ]);
  }

  const baseCount = Math.floor(objects.length / 4);
  const remainder = objects.length % 4;

  let globalIndex = 0;

  faces.forEach((face, faceIndex) => {
    if (globalIndex >= objects.length) return;

    const objectsPerFace = baseCount + (faceIndex < remainder ? 1 : 0);
    const [v0, v1, v2] = face;

    const edge1 = new THREE.Vector3().subVectors(v1, v0);
    const edge2 = new THREE.Vector3().subVectors(v2, v0);
    const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

    const faceCenter = new THREE.Vector3().add(v0).add(v1).add(v2).divideScalar(3);
    if (faceCenter.dot(normal) < 0) normal.negate();

    // Compute exact rows needed
    let rows = 1;
    while ((rows * (rows + 1)) / 2 < objectsPerFace) rows++;

    let placed = 0;

    for (let r = 0; r < rows; r++) {
      const t = rows === 1 ? 0 : r / (rows - 1);
      const cols = rows - r;

      for (let c = 0; c < cols; c++) {
        if (placed >= objectsPerFace || globalIndex >= objects.length) break;

        const s = cols === 1 ? 0.5 : c / (cols - 1);

        const u = s * (1 - t);
        const v = t;
        const w = 1 - u - v;

        const position = new THREE.Vector3()
          .addScaledVector(v0, w)
          .addScaledVector(v1, u)
          .addScaledVector(v2, v);

        position.addScaledVector(normal, 40);

        const target = new THREE.Object3D();
        target.position.copy(position);

        const quat = new THREE.Quaternion();
        quat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
        target.quaternion.copy(quat);

        targets.pyramid.push(target);

        globalIndex++;
        placed++;
      }
    }
  }); 
} 

//transform and animation
function transform(targetArray, duration = 2000) {
  TWEEN.removeAll();

  objects.forEach((obj, i) => {
    const target = targetArray[i];

    // Position Tween 
    new TWEEN.Tween(obj.position)
      .to(
        {
          x: target.position.x,
          y: target.position.y,
          z: target.position.z,
        },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();

    //  Rotation
    const startQuat = obj.quaternion.clone();
    const endQuat = target.quaternion.clone();

    new TWEEN.Tween({ t: 0 })
      .to({ t: 1 }, duration)
      .easing(TWEEN.Easing.Exponential.InOut)
      .onUpdate(function (state) {
        THREE.Quaternion.slerp(startQuat, endQuat, obj.quaternion, state.t);
      })
      .start();
  });
}

function animate() {
  requestAnimationFrame(animate);
  TWEEN.update();
  controls.update();
  renderer.render(scene, camera);
}