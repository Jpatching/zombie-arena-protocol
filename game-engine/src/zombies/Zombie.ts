import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { EventEmitter } from 'events';

export class Zombie extends EventEmitter {
  private id: string;
  private mesh: THREE.Mesh;
  private body: CANNON.Body;
  private health: number = 100;
  private maxHealth: number = 100;
  private speed: number = 1.5;
  private damage: number = 20;
  private active: boolean = false;
  private attackCooldown: number = 0;
  private attackRate: number = 1.5; // seconds between attacks
  
  private mixer: THREE.AnimationMixer;
  private animations: Map<string, THREE.AnimationAction> = new Map();
  private currentAnimation: string = 'idle';
  
  constructor(
    private scene: THREE.Scene,
    private world: CANNON.World
  ) {
    super();
    this.id = `zombie_${Math.random().toString(36).substr(2, 9)}`;
    this.createZombie();
  }
  
  private createZombie(): void {
    // Create zombie mesh
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x4a4a4a,
      roughness: 0.8,
      metalness: 0.2
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.userData = { type: 'zombie', id: this.id };
    
    // Create physics body
    const shape = new CANNON.Box(new CANNON.Vec3(0.5, 1, 0.5));
    this.body = new CANNON.Body({
      mass: 60,
      shape,
      fixedRotation: true
    });
    
    // Initialize animation mixer
    this.mixer = new THREE.AnimationMixer(this.mesh);
    
    // Hide initially (object pooling)
    this.deactivate();
  }
  
  public spawn(position: THREE.Vector3, health: number, speed: number): void {
    this.health = health;
    this.maxHealth = health;
    this.speed = speed;
    this.active = true;
    this.attackCooldown = 0;
    
    // Set position
    this.body.position.set(position.x, position.y + 1, position.z);
    this.mesh.position.copy(position);
    this.mesh.position.y += 1;
    
    // Add to scene and world
    this.scene.add(this.mesh);
    this.world.addBody(this.body);
    
    // Play spawn animation
    this.playAnimation('walk');
  }
  
  public update(deltaTime: number, targetPosition: THREE.Vector3): void {
    if (!this.active) return;
    
    // Update attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }
    
    // Move towards target
    const direction = new THREE.Vector3();
    direction.subVectors(targetPosition, this.mesh.position);
    direction.y = 0; // Keep on same height
    direction.normalize();
    
    // Apply movement
    const velocity = this.body.velocity;
    velocity.x = direction.x * this.speed;
    velocity.z = direction.z * this.speed;
    
    // Rotate to face target
    const angle = Math.atan2(direction.x, direction.z);
    this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), angle);
    
    // Sync mesh with physics
    this.mesh.position.copy(this.body.position as any);
    this.mesh.quaternion.copy(this.body.quaternion as any);
    
    // Update animations
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
  }
  
  public takeDamage(amount: number, isHeadshot: boolean): void {
    if (!this.active) return;
    
    const damage = isHeadshot ? amount * 2 : amount;
    this.health -= damage;
    
    // Visual feedback
    this.mesh.material = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5
    });
    
    setTimeout(() => {
      if (this.mesh) {
        this.mesh.material = new THREE.MeshStandardMaterial({ 
          color: 0x4a4a4a,
          roughness: 0.8,
          metalness: 0.2
        });
      }
    }, 100);
    
    if (this.health <= 0) {
      this.die(isHeadshot);
    }
  }
  
  private die(isHeadshot: boolean): void {
    this.active = false;
    
    // Death animation
    this.playAnimation('death');
    
    // Emit death event
    this.emit('died', {
      zombieId: this.id,
      isHeadshot
    });
    
    // Remove after animation
    setTimeout(() => {
      this.deactivate();
    }, 1000);
  }
  
  public attack(): void {
    if (!this.active || this.attackCooldown > 0) return;
    
    this.attackCooldown = this.attackRate;
    this.playAnimation('attack');
    
    this.emit('attack', {
      zombieId: this.id,
      damage: this.damage
    });
  }
  
  private playAnimation(name: string): void {
    if (this.currentAnimation === name) return;
    
    // Stop current animation
    const current = this.animations.get(this.currentAnimation);
    if (current) {
      current.fadeOut(0.2);
    }
    
    // Play new animation
    const animation = this.animations.get(name);
    if (animation) {
      animation.reset().fadeIn(0.2).play();
      this.currentAnimation = name;
    }
  }
  
  private deactivate(): void {
    this.active = false;
    this.scene.remove(this.mesh);
    this.world.removeBody(this.body);
  }
  
  public reset(): void {
    this.deactivate();
    this.health = this.maxHealth;
    this.attackCooldown = 0;
  }
  
  public isActive(): boolean {
    return this.active;
  }
  
  public getId(): string {
    return this.id;
  }
  
  public getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }
}