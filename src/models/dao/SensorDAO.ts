import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { GatewayDAO } from "@dao/GatewayDAO";
import { MeasurementDAO } from "@dao/MeasurementDAO";

@Entity("sensors")
export class SensorDAO {
  @PrimaryColumn({ nullable: false })
  macAddress: string;

  @ManyToOne(() => GatewayDAO, (gateway) => gateway.sensors, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  gateway: GatewayDAO;

  @OneToMany(() => MeasurementDAO, (measurement) => measurement.sensor, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  measurements: MeasurementDAO[];

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  description: string;
  
  @Column({ nullable: false })
  variable: string;
  
  @Column({ nullable: false })
  unit: string;     
}