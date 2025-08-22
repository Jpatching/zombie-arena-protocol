import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { EventEmitter } from 'events';

export class Player extends EventEmitter {
  private body: CANNON.Body;
  private mesh: THREE.Mesh;
  private health: number = 100;
  private maxHealth: number = 100;
  private speed: number = 5;
  private jumpForce: number = 10;
  private isGrounded: boolean = false;
  private currentWeapon: string = 'pistol';
  
  private raycaster: THREE.Raycaster;
  private movement = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false
  };
  
  constructor(
    private scene: THREE.Scene,
    private world: CANNON.World,
    private camera: THREE.Camera
  ) {
    super();
    this.raycaster = new THREE.Raycaster();
    this.initializePlayer();
    this.setupControls();
  }
  
  private initializePlayer(): void {
    // Create player mesh
    const geometry = new THREE.CapsuleGeometry(0.5, 1.8, 4, 8);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);
    
    // Create physics body
    const shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.9, 0.5));
    this.body = new CANNON.Body({
      mass: 80,
      shape,
      material: new CANNON.Material('player')
    });
    this.body.linearDamping = 0.4;
    this.world.addBody(this.body);
    
    // Ground detection
    this.body.addEventListener('collide', (e: any) => {
      const contact = e.contact;
      if (contact.bi.id === this.body.id) {
        contact.ni.negate(contact.ni);
      }
      if (contact.ni.y > 0.5) {
        this.isGrounded = true;
      }
    });
  }
  
  private setupControls(): void {
    document.addEventListener('keydown', (e) => {
      switch(e.code) {
        case 'KeyW': this.movement.forward = true; break;
        case 'KeyS': this.movement.backward = true; break;
        case 'KeyA': this.movement.left = true; break;
        case 'KeyD': this.movement.right = true; break;
        case 'Space': this.movement.jump = true; break;
        case 'ShiftLeft': this.movement.sprint = true; break;
      }
    });
    
    document.addEventListener('keyup', (e) => {
      switch(e.code) {
        case 'KeyW': this.movement.forward = false; break;
        case 'KeyS': this.movement.backward = false; break;
        case 'KeyA': this.movement.left = false; break;
        case 'KeyD': this.movement.right = false; break;
        case 'Space': this.movement.jump = false; break;
        case 'ShiftLeft': this.movement.sprint = false; break;
      }
    });
    
    document.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.shoot();
      }
    });
  }
  
  public update(deltaTime: number): void {
    // Update movement
    const velocity = this.body.velocity;
    const moveSpeed = this.movement.sprint ? this.speed * 1.5 : this.speed;
    
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));
    
    const moveDirection = new THREE.Vector3();
    
    if (this.movement.forward) moveDirection.add(forward);
    if (this.movement.backward) moveDirection.sub(forward);
    if (this.movement.right) moveDirection.add(right);
    if (this.movement.left) moveDirection.sub(right);
    
    moveDirection.normalize();
    
    velocity.x = moveDirection.x * moveSpeed;
    velocity.z = moveDirection.z * moveSpeed;
    
    if (this.movement.jump && this.isGrounded) {
      velocity.y = this.jumpForce;
      this.isGrounded = false;
    }
    
    // Sync mesh with physics body
    this.mesh.position.copy(this.body.position as any);
    this.mesh.quaternion.copy(this.body.quaternion as any);
    
    // Update camera position
    this.camera.position.copy(this.mesh.position);
    this.camera.position.y += 1.6; // Eye height
  }
  
  private shoot(): void {
    // Cast ray from camera
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    
    this.raycaster.set(this.camera.position, direction);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    
    if (intersects.length > 0) {
      const hit = intersects[0];
      // Check if hit zombie
      if (hit.object.userData.type === 'zombie') {
        this.emit('hitZombie', {
          zombie: hit.object,
          damage: this.getWeaponDamage(),
          isHeadshot: hit.point.y > hit.object.position.y + 1.5
        });
      }
    }
    
    this.emit('shoot', { weapon: this.currentWeapon });
  }
  
  private getWeaponDamage(): number {
    const weaponDamages: { [key: string]: number } = {
      pistol: 50,
      ak47: 150,
      raygun: 1000
    };
    return weaponDamages[this.currentWeapon] || 50;
  }
  
  public takeDamage(amount: number): void {
    this.health -= amount;
    this.emit('damaged', { health: this.health, damage: amount });
    
    if (this.health <= 0) {
      this.health = 0;
      this.emit('downed');
    }
  }
  
  public heal(amount: number): void {
    this.health = Math.min(this.health + amount, this.maxHealth);
    this.emit('healed', { health: this.health });
  }
  
  public spawn(position: { x: number, y: number, z: number }): void {
    this.body.position.set(position.x, position.y, position.z);
    this.health = this.maxHealth;
    this.emit('spawned');
  }
  
  public getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }
  
  public getHealth(): number {
    return this.health;
  }
  
  public setWeapon(weapon: string): void {
    this.currentWeapon = weapon;
    this.emit('weaponChanged', { weapon });
  }
  
  public addPerkEffect(perk: string): void {
    switch(perk) {
      case 'juggernog':
        this.maxHealth = 250;
        this.health = Math.min(this.health + 150, this.maxHealth);
        break;
      case 'speed_cola':
        // Increase reload speed (handled in weapon system)
        break;
      case 'stamin_up':
        this.speed = 7;
        break;
    }
  }
}