// WebGL 3D B-Tree & B+ Tree Disk Visualizer using Three.js

class BTreeNode {
  constructor(isLeaf = true) {
    this.keys = [];
    this.children = [];
    this.isLeaf = isLeaf;
    this.nextLeaf = null; // B+ Tree leaf link
    this.prevLeaf = null;
    this.x = 0;
    this.y = 0;
    this.z = 0;
  }
}

class BPlusTree {
  constructor(order = 3, isBPlus = true) {
    this.order = order;
    this.maxKeys = order - 1;
    this.minKeys = Math.ceil(order / 2) - 1;
    this.isBPlus = isBPlus;
    this.root = new BTreeNode(true);
    this.splitCount = 0;
  }

  insert(key) {
    const root = this.root;
    if (root.keys.length === this.maxKeys) {
      const newRoot = new BTreeNode(false);
      newRoot.children.push(this.root);
      this.splitChild(newRoot, 0, this.root);
      this.root = newRoot;
    }
    this.insertNonFull(this.root, key);
  }

  insertNonFull(node, key) {
    let i = node.keys.length - 1;
    if (node.isLeaf) {
      while (i >= 0 && key < node.keys[i]) i--;
      node.keys.splice(i + 1, 0, key);
    } else {
      while (i >= 0 && key < node.keys[i]) i--;
      i++;
      if (node.children[i].keys.length === this.maxKeys) {
        this.splitChild(node, i, node.children[i]);
        if (key > node.keys[i]) i++;
      }
      this.insertNonFull(node.children[i], key);
    }
  }

  splitChild(parent, i, child) {
    this.splitCount++;
    const mid = Math.floor(child.keys.length / 2);
    const newNode = new BTreeNode(child.isLeaf);

    if (child.isLeaf && this.isBPlus) {
      newNode.keys = child.keys.slice(mid);
      child.keys = child.keys.slice(0, mid);

      // Link leaf nodes for B+ Tree
      newNode.nextLeaf = child.nextLeaf;
      if (newNode.nextLeaf) newNode.nextLeaf.prevLeaf = newNode;
      child.nextLeaf = newNode;
      newNode.prevLeaf = child;

      parent.keys.splice(i, 0, newNode.keys[0]);
    } else {
      const promotedKey = child.keys[mid];
      newNode.keys = child.keys.slice(mid + 1);
      child.keys = child.keys.slice(0, mid);

      if (!child.isLeaf) {
        newNode.children = child.children.slice(mid + 1);
        child.children = child.children.slice(0, mid + 1);
      }
      parent.keys.splice(i, 0, promotedKey);
    }

    parent.children.splice(i + 1, 0, newNode);
  }

  getHeight(node = this.root) {
    if (!node) return 0;
    if (node.isLeaf) return 1;
    return 1 + this.getHeight(node.children[0]);
  }

  getTotalKeys(node = this.root) {
    if (!node) return 0;
    let count = node.keys.length;
    if (!node.isLeaf) {
      for (let child of node.children) count += this.getTotalKeys(child);
    }
    return count;
  }
}

class BTree3DVisualizer {
  constructor() {
    this.tree = new BPlusTree(3, true);
    this.highlightRange = null;

    this.container = document.getElementById("three-container");

    this.initThreeJS();
    this.initEvents();
    this.populateInitialData();
  }

  initThreeJS() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070a12);

    this.camera = new THREE.PerspectiveCamera(60, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
    this.camera.position.set(0, 20, 35);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    dirLight.position.set(20, 40, 20);
    this.scene.add(dirLight);

    window.addEventListener("resize", () => this.onWindowResize());

    this.animate();
  }

  onWindowResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  initEvents() {
    document.getElementById("btn-3d-insert").addEventListener("click", () => {
      const val = parseInt(document.getElementById("key-input").value);
      if (!isNaN(val)) {
        this.tree.insert(val);
        this.log(`Inserted key ${val}`);
        this.updateScene();
      }
    });

    document.getElementById("btn-3d-random").addEventListener("click", () => {
      const rnd = Math.floor(Math.random() * 95) + 5;
      this.tree.insert(rnd);
      this.log(`Inserted random key ${rnd}`);
      this.updateScene();
    });

    document.getElementById("btn-3d-reset").addEventListener("click", () => {
      const order = parseInt(document.getElementById("order-select").value);
      const isBPlus = document.getElementById("mode-select").value === "bplus";
      this.tree = new BPlusTree(order, isBPlus);
      this.log(`Reset tree (Mode: ${isBPlus ? "B+ Tree" : "Standard B-Tree"}, Order: M=${order})`);
      this.updateScene();
    });

    document.getElementById("mode-select").addEventListener("change", () => {
      const order = parseInt(document.getElementById("order-select").value);
      const isBPlus = document.getElementById("mode-select").value === "bplus";
      this.tree = new BPlusTree(order, isBPlus);
      this.populateInitialData();
    });

    document.getElementById("order-select").addEventListener("change", () => {
      const order = parseInt(document.getElementById("order-select").value);
      const isBPlus = document.getElementById("mode-select").value === "bplus";
      this.tree = new BPlusTree(order, isBPlus);
      this.populateInitialData();
    });

    document.getElementById("btn-range-search").addEventListener("click", () => {
      const min = parseInt(document.getElementById("range-min").value);
      const max = parseInt(document.getElementById("range-max").value);
      if (!isNaN(min) && !isNaN(max)) {
        this.highlightRange = { min, max };
        this.log(`Executed range query [${min} .. ${max}]`);
        this.updateScene();
      }
    });
  }

  populateInitialData() {
    [15, 30, 45, 60, 75, 90, 25, 35].forEach((k) => this.tree.insert(k));
    this.updateScene();
  }

  log(msg) {
    const logBox = document.getElementById("split-log");
    const div = document.createElement("div");
    div.className = "log-entry";
    div.textContent = msg;
    logBox.prepend(div);
  }

  updateScene() {
    // Clear 3D scene objects except lights
    while (this.scene.children.length > 2) {
      this.scene.remove(this.scene.children[this.scene.children.length - 1]);
    }

    // Update UI Stats
    document.getElementById("stat-tree-mode").textContent = this.tree.isBPlus ? "B+ Tree" : "B-Tree";
    document.getElementById("stat-order").textContent = this.tree.order;
    document.getElementById("metric-splits").textContent = this.tree.splitCount;
    document.getElementById("metric-tree-height").textContent = this.tree.getHeight();
    document.getElementById("metric-total-keys").textContent = this.tree.getTotalKeys();

    this.calculatePositions();
    this.renderTree3D(this.tree.root);

    if (this.tree.isBPlus) {
      this.renderLeafLinkedList();
    }
  }

  calculatePositions() {
    const root = this.tree.root;
    if (!root) return;

    const setPos = (node, x, y, z, dx) => {
      if (!node) return;
      node.x = x;
      node.y = y;
      node.z = z;

      if (!node.isLeaf && node.children.length > 0) {
        const step = (dx * 2) / Math.max(1, node.children.length - 1);
        node.children.forEach((child, idx) => {
          setPos(child, x - dx + idx * step, y - 8, z, dx / 2.2);
        });
      }
    };

    setPos(root, 0, 12, 0, 16);
  }

  renderTree3D(node) {
    if (!node) return;

    // Render Disk Block Cuboid
    const blockWidth = Math.max(3.5, node.keys.length * 1.8 + 1);
    const blockGeometry = new THREE.BoxGeometry(blockWidth, 2, 2);

    const isLeaf = node.isLeaf;
    const blockMaterial = new THREE.MeshPhongMaterial({
      color: isLeaf ? 0x10b981 : 0x0284c7,
      transparent: true,
      opacity: 0.85,
      shininess: 80,
    });

    const blockMesh = new THREE.Mesh(blockGeometry, blockMaterial);
    blockMesh.position.set(node.x, node.y, node.z);
    this.scene.add(blockMesh);

    // Render Keys as glowing spheres inside block
    node.keys.forEach((key, idx) => {
      const kGeo = new THREE.SphereGeometry(0.5, 16, 16);
      let kColor = 0xfbbf24;

      if (this.highlightRange && key >= this.highlightRange.min && key <= this.highlightRange.max) {
        kColor = 0xef4444; // Range query hit!
      }

      const kMat = new THREE.MeshBasicMaterial({ color: kColor });
      const kMesh = new THREE.Mesh(kGeo, kMat);
      const offsetX = -blockWidth / 2 + 1.2 + idx * 1.6;
      kMesh.position.set(node.x + offsetX, node.y, node.z + 1.1);
      this.scene.add(kMesh);
    });

    // Render Branches to children
    if (!node.isLeaf) {
      node.children.forEach((child) => {
        this.renderBranch(node.x, node.y - 1, node.z, child.x, child.y + 1, child.z);
        this.renderTree3D(child);
      });
    }
  }

  renderBranch(x1, y1, z1, x2, y2, z2) {
    const points = [new THREE.Vector3(x1, y1, z1), new THREE.Vector3(x2, y2, z2)];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
    const line = new THREE.Line(geometry, material);
    this.scene.add(line);
  }

  renderLeafLinkedList() {
    // Find leftmost leaf
    let curr = this.tree.root;
    while (curr && !curr.isLeaf) curr = curr.children[0];

    let count = 0;
    while (curr && curr.nextLeaf) {
      const next = curr.nextLeaf;
      const points = [new THREE.Vector3(curr.x + 2, curr.y, curr.z), new THREE.Vector3(next.x - 2, next.y, next.z)];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineDashedMaterial({ color: 0xf59e0b, dashSize: 0.5, gapSize: 0.3 });
      const line = new THREE.Line(geometry, material);
      line.computeLineDistances();
      this.scene.add(line);

      curr = next;
      count++;
    }
    document.getElementById("stat-pages").textContent = count + 1;
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.btree3d = new BTree3DVisualizer();
});
