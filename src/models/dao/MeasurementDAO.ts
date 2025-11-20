import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { SensorDAO } from "@dao/SensorDAO"

@Entity("measurement")
export class MeasurementDAO {
  @PrimaryColumn({nullable : false})
  sensorMacAddress : string;

  @ManyToOne(() => SensorDAO, (sensor) => sensor.measurements, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  @JoinColumn({name: "sensorMacAddress", referencedColumnName : "macAddress"})
  sensor : SensorDAO

  @PrimaryColumn({ nullable: false })
  createdAt: Date;

  @Column({type : "float", nullable: false })
  value: number;

  @Column({ nullable: false })
  isOutlier: boolean;
}