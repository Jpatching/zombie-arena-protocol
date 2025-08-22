import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { EventEmitter } from 'events';
import { Player } from './Player';
import { ZombieManager } from '../zombies/ZombieManager';
import { WeaponSystem } from '../weapons/WeaponSystem';
import { NetworkManager } from '../network/NetworkManager';
import { MapLoader } from './MapLoader';
import { PerkSystem } from './PerkSystem';

export interface GameConfig {
  canvasId: string;
  serverUrl: string;
  walletAddress: string;
  onTokenEarned?: (amount: number, reason: string) => void;
  onRoundComplete?: (round: number) => void;
}

export class GameEngine extends EventEmitter {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private world: CANNON.World;
  private clock: THREE.Clock;
  
  private player: Player;
  private zombieManager: ZombieManager;
  private weaponSystem: WeaponSystem;
  private networkManager: NetworkManager;
  private perkSystem: PerkSystem;
  
  private currentRound: number = 1;
  private zombiesRemaining: number = 0;
  private isRoundActive: boolean = false;
  private score: number = 0;
  
  constructor(private config: GameConfig) {
    super();
    this.clock = new THREE.Clock();
    this.initializeEngine();
  }
  
  private initializeEngine(): void {
    // Initialize Three.js
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x000000, 1, 100);
    
    const canvas = document.getElementById(this.config.canvasId) as HTMLCanvasElement;
    this.renderer = new THREE.WebGLRenderer({ 
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    
    // Initialize physics
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.solver.iterations = 10;
    
    // Initialize game systems
    this.player = new Player(this.scene, this.world, this.camera);
    this.zombieManager = new ZombieManager(this.scene, this.world);
    this.weaponSystem = new WeaponSystem(this.scene, this.player);
    this.networkManager = new NetworkManager(this.config.serverUrl);
    this.perkSystem = new PerkSystem(this.player);
    
    // Set up lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    this.scene.add(directionalLight);
    
    // Event listeners
    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.setupGameEvents();
  }
  
  private setupGameEvents(): void {
    this.zombieManager.on('zombieKilled', (data: any) => {
      this.score += data.points;
      this.zombiesRemaining--;
      
      // Emit token earned event
      if (data.isHeadshot) {
        this.config.onTokenEarned?.(10, 'headshot');
      } else {
        this.config.onTokenEarned?.(5, 'kill');
      }
      
      // Check round completion
      if (this.zombiesRemaining === 0 && this.isRoundActive) {
        this.completeRound();
      }
    });
    
    this.player.on('damaged', () => {
      this.emit('playerDamaged', { health: this.player.getHealth() });
    });
    
    this.player.on('downed', () => {
      this.emit('playerDowned');
    });
    
    this.weaponSystem.on('mysteryBox', (weapon: any) => {
      this.emit('mysteryBoxRoll', weapon);
    });
  }
  
  public async loadMap(mapName: string): Promise<void> {
    const mapLoader = new MapLoader(this.scene, this.world);
    await mapLoader.load(mapName);
    
    // Set player spawn
    this.player.spawn({ x: 0, y: 5, z: 0 });
    
    // Start first round
    this.startRound();
  }
  
  private startRound(): void {
    this.currentRound++;
    this.isRoundActive = true;
    
    // Calculate zombies for this round
    const zombieCount = this.calculateZombieCount(this.currentRound);
    this.zombiesRemaining = zombieCount;
    
    // Spawn zombies
    this.zombieManager.spawnWave(zombieCount, this.currentRound);
    
    this.emit('roundStart', { round: this.currentRound, zombies: zombieCount });
  }
  
  private completeRound(): void {
    this.isRoundActive = false;
    
    // Award round completion bonus
    const bonus = 100 * this.currentRound;
    this.config.onTokenEarned?.(bonus, 'round_complete');
    this.config.onRoundComplete?.(this.currentRound);
    
    this.emit('roundComplete', { 
      round: this.currentRound, 
      bonus,
      nextRoundIn: 10 
    });
    
    // Start next round after delay
    setTimeout(() => {
      this.startRound();
    }, 10000);
  }
  
  private calculateZombieCount(round: number): number {
    // Classic zombie count formula
    if (round <= 5) {
      return Math.floor(6 + (round - 1) * 2);
    } else {
      return Math.floor(24 + (round - 5) * 3);
    }
  }
  
  public buyPerk(perkType: string, cost: number): boolean {
    return this.perkSystem.buyPerk(perkType, cost);
  }
  
  public useMysterBox(cost: number): void {
    this.weaponSystem.rollMysteryBox(cost);
  }
  
  public packAPunchWeapon(cost: number): boolean {
    return this.weaponSystem.packAPunch(cost);
  }
  
  public update(): void {
    const deltaTime = this.clock.getDelta();
    
    // Update physics
    this.world.step(1/60, deltaTime, 3);
    
    // Update game systems
    this.player.update(deltaTime);
    this.zombieManager.update(deltaTime, this.player.getPosition());
    this.weaponSystem.update(deltaTime);
    
    // Render
    this.renderer.render(this.scene, this.camera);
  }
  
  public start(): void {
    const animate = () => {
      requestAnimationFrame(animate);
      this.update();
    };
    animate();
  }
  
  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  public getScore(): number {
    return this.score;
  }
  
  public getCurrentRound(): number {
    return this.currentRound;
  }
  
  public getPlayerHealth(): number {
    return this.player.getHealth();
  }
  
  public dispose(): void {
    this.networkManager.disconnect();
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    this.renderer.dispose();
  }
}