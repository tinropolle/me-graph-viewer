import { Component, Input, OnChanges, OnInit, SimpleChange, SimpleChanges } from '@angular/core';
import { NodeProperty } from '../_model/node-property';
import { Node } from "../_model/node";

@Component({
  selector: 'app-properties',
  templateUrl: './properties.component.html',
  styleUrls: ['./properties.component.css']
})
export class PropertiesComponent implements OnInit, OnChanges {
  @Input() node: Node;

  simpleProps: string[] = ['id', 'nodeType', 'url', 'index', 'level'];

  isCollapsed: boolean = false;
  showAll: boolean;

  nodeName: string = '';
  properties: NodeProperty[];

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.node) {
      this.fillProperties();
    }
  }

  ngOnInit(): void {
  }

  fillProperties() {
    this.nodeName = this.node ? this.node.label : '';
    this.properties = [];
    for (const key in this.node) {
      if (this.simpleProps.includes(key) || this.showAll) {
        this.properties.push({ property: key, value: this.node[key] });
      }
    }
  }

  toggleCollapsed() {
    this.isCollapsed = !this.isCollapsed;
  }
}
