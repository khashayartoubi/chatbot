import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import type { NodePosition } from '../interfaces/node-position.interface';

@Entity('ai_node_positions')
export class AiNodePosition {
  @PrimaryColumn()
  username!: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  positions!: NodePosition[];

  @UpdateDateColumn()
  updatedAt!: Date;
}
