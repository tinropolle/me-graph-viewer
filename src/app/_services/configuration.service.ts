import { Injectable } from '@angular/core';
import { Config } from '../_model/config';
import NodeTypeConfig from "../../assets/node-type-config.json";

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {
  config: Config = {
    fontFamily: "'Roboto Mono', 'Open Sans', sans-serif, sans",
    fontSize: 12,
    objectIntervalX: 480,
    objectIntervalY: 300,
    objectIntervalXInGroup: 280,
    objectIntervalYInGroup: 100,
    objectWidth: 240,
    rowHeight: 12 * 1.45
  }
  nodeTypeConfig: any;

  constructor() {
    this.nodeTypeConfig = NodeTypeConfig;
  }
}
