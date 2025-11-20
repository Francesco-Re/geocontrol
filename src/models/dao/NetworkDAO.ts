import { Entity, PrimaryColumn, Column, OneToMany } from "typeorm";
import { GatewayDAO } from "@dao/GatewayDAO";

@Entity("networks")
export class NetworkDAO {
  @PrimaryColumn({ nullable: false })
  code: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  description: string;

  @OneToMany(() => GatewayDAO, (gateway) => gateway.network, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  gateways: GatewayDAO[];
}
