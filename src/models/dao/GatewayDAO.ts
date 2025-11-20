import { Entity, PrimaryColumn, Column, ForeignKey, ManyToOne, OneToMany} from "typeorm";
import { NetworkDAO } from "@dao/NetworkDAO";
import { SensorDAO } from "./SensorDAO";
import { on } from "events";

@Entity("gateways")
export class GatewayDAO {
  @PrimaryColumn({ nullable: false })
  macAdress: string;

  @ManyToOne(() => NetworkDAO, (network) => network.gateways, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  network: NetworkDAO;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  description: string;

  @OneToMany(() => SensorDAO, (sensor) => sensor.gateway, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  sensors: SensorDAO[];
}