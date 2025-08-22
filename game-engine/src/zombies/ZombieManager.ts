import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { EventEmitter } from 'events';
import { Zombie } from './Zombie';

export class ZombieManager extends EventEmitter {
  private zombies: Map<string, Zombie> = new Map();
  private spawnPoints: THREE.Vector3[] = [];
  private zombiePool: Zombie[] = [];
  private maxZombies: number = 24;
  private spawnTimer: number = 0;
  private spawnInterval: number = 2;
  
  constructor(
    private scene: THREE.Scene,
    private world: CANNON.World
  ) {
    super();
    this.initializeSpawnPoints();
    this.createZombiePool();
  }
  
  private initializeSpawnPoints(): void {
    // Define zombie spawn points
    this.spawnPoints = [
      new THREE.Vector3(-20, 0, -20),
      new THREE.Vector3(20, 0, -20),
      new THREE.Vector3(-20, 0, 20),
      new THREE.Vector3(20, 0, 20),
      new THREE.Vector3(0, 0, -30),
      new THREE.Vector3(0, 0, 30),
    ];
  }
  
  private createZombiePool(): void {
    // Pre-create zombies for object pooling
    for (let i = 0; i < this.maxZombies; i++) {
      const zombie = new Zombie(this.scene, this.world);
      zombie.on('died', (data) => this.handleZombieDeath(data));
      this.zombiePool.push(zombie);
    }
  }
  
  public spawnWave(count: number, round: number): void {
    const zombiesToSpawn = Math.min(count, this.maxZombies);
    let spawned = 0;
    
    const spawnInterval = setInterval(() => {
      if (spawned >= zombiesToSpawn) {
        clearInterval(spawnInterval);
        return;
      }
      
      const zombie = this.getAvailableZombie();
      if (zombie) {
        const spawnPoint = this.getRandomSpawnPoint();
        const health = this.calculateZombieHealth(round);
        const speed = this.calculateZombieSpeed(round);
        
        zombie.spawn(spawnPoint, health, speed);
        this.zombies.set(zombie.getId(), zombie);
        spawned++;
      }
    }, this.spawnInterval * 1000);
  }
  
  private getAvailableZombie(): Zombie | null {
    return this.zombiePool.find(z => !z.isActive()) || null;
  }
  
  private getRandomSpawnPoint(): THREE.Vector3 {
    const index = Math.floor(Math.random() * this.spawnPoints.length);
    return this.spawnPoints[index].clone();
  }
  
  private calculateZombieHealth(round: number): number {
    // Zombie health scaling formula
    if (round <= 9) {
      return 150 + (round - 1) * 100;
    } else {
      return 950 + (round - 10) * 110;
    }
  }
  
  private calculateZombieSpeed(round: number): number {
    // Speed increases every 5 rounds
    const baseSpeed = 1.5;
    const speedIncrease = Math.floor(round / 5) * 0.2;
    return Math.min(baseSpeed + speedIncrease, 3.5);
  }
  
  public update(deltaTime: number, playerPosition: THREE.Vector3): void {
    // Update all active zombies
    this.zombies.forEach((zombie) => {
      if (zombie.isActive()) {
        zombie.update(deltaTime, playerPosition);
        
        // Check if zombie can attack player
        const distance = zombie.getPosition().distanceTo(playerPosition);
        if (distance < 2) {
          zombie.attack();
          this.emit('zombieAttack', { 
            zombie: zombie.getId(), 
            damage: 20 
          });
        }
      }
    });
  }
  
  private handleZombieDeath(data: any): void {
    const zombie = this.zombies.get(data.zombieId);
    if (zombie) {
      this.zombies.delete(data.zombieId);
      
      // Calculate points
      const points = data.isHeadshot ? 100 : 50;
      
      this.emit('zombieKilled', {
        zombieId: data.zombieId,
        points,
        isHeadshot: data.isHeadshot
      });
    }
  }
  
  public damageZombie(zombieId: string, damage: number, isHeadshot: boolean): void {
    const zombie = this.zombies.get(zombieId);
    if (zombie && zombie.isActive()) {
      zombie.takeDamage(damage, isHeadshot);
    }
  }
  
  public getActiveZombieCount(): number {
    return Array.from(this.zombies.values()).filter(z => z.isActive()).length;
  }
  
  public reset(): void {
    this.zombies.forEach(zombie => zombie.reset());
    this.zombies.clear();
  }
}