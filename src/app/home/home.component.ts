import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { DrawerComponent } from '../drawer/drawer.component';
import { Graph } from '../_model/graph';
import { Node } from '../_model/node';
import { NodeProperty } from '../_model/node-property';
import { PaintingService } from '../_services/painting.service';
import { ProcessingService } from '../_services/processing.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild(DrawerComponent) drawer: DrawerComponent;
  @ViewChild('info') info: ElementRef;

  listUpdate: Subject<void> = new Subject<void>();

  lastWidth: number;
  lastHeight: number;
  lastGraphWidth: number;
  lastGraphHeight: number;
  
  graph: Graph = null;
  nodes: Node[] = [];
  nodeProperties: Node;

  constructor(private painting: PaintingService) { }

  ngAfterViewInit(): void {
    this.onResize();
  }

  ngOnInit(): void {
  }

  filterNodes(filter: string) {
    this.nodes = this.graph.nodes.filter(n => !filter || n.label.toUpperCase().indexOf(filter.toUpperCase()) >= 0);
  }

  hideCheckedNodes(toHide: boolean) {
    console.log("Hide checked nodes: " + toHide);
    for (const key in this.graph.nodes) {
      if (this.graph.nodes[key].isChecked) {
        this.graph.nodes[key].isHidden = toHide;

        for (const edgeKey in this.graph.edges) {
          if (this.graph.edges[edgeKey].from == this.graph.nodes[key].id) {
            this.graph.edges[edgeKey].isFromHidden = this.graph.nodes[key].isHidden;
          }
          if (this.graph.edges[edgeKey].to == this.graph.nodes[key].id) {
            this.graph.edges[edgeKey].isToHidden = this.graph.nodes[key].isHidden;
          }
        }
      }
    }
    this.drawer.redraw();
  }

  objectListMouseOver(id: string) {
    this.drawer.setHoveredNodeId(id);
  }

  checkNode(node: Node, isChecked: boolean) {
    node.isChecked = isChecked;
    for (const key in this.graph.edges) {
      if (this.graph.edges[key].from == node.id) this.graph.edges[key].isFromChecked = node.isChecked;
      if (this.graph.edges[key].to == node.id) this.graph.edges[key].isToChecked = node.isChecked;
    }
  }

  objectListCheckAllNodes(isChecked: boolean) {
    for (const key in this.nodes) {
      this.checkNode(this.nodes[key], isChecked);
    }
    this.nodes = this.nodes.slice(0);
    this.drawer?.redraw();
  }

  objectListCheckNode(id: string) {
    const node = this.graph.nodes.find(n => n.id == id);
    if (node) {
      this.checkNode(node, !node.isChecked);
    }
    this.nodes = this.nodes.slice(0);
    this.drawer?.redraw();
  }

  objectListSelectNode(id: string) {
    this.graph.nodes.forEach(n => n.isSelected = false);
    const node = this.graph.nodes.find(n => n.id == id);
    if (node) {
      node.isSelected = true;
    }
    this.nodeProperties = node;
    this.nodes = this.nodes.slice(0);
    this.drawer?.redraw();
  }

  onResize() {
    let newWidth = window.innerWidth * 0.7;
    let newHeight = window.innerHeight;
    if (newWidth != this.lastWidth || newHeight != this.lastHeight) {
      this.drawer.canvas.nativeElement.width = newWidth * this.drawer.dpr;
      this.drawer.canvas.nativeElement.height = newHeight * this.drawer.dpr;
      this.drawer.canvas.nativeElement.style.width = `${newWidth}px`;
      this.drawer.canvas.nativeElement.style.height = `${newHeight}px`;

      this.info.nativeElement.style.width = `${window.innerWidth - newWidth}px`;
      this.info.nativeElement.style.height = `${newHeight}px`;

      this.lastWidth = newWidth;
      this.lastHeight = newHeight;

      this.onGraphResize();
    }
    this.drawer?.redraw();
  }

  onGraphResize() {
    if (this.graph.width != this.lastGraphWidth || this.graph.height != this.lastGraphHeight) {
      const canvasWidth = this.drawer.canvas.nativeElement.width;
      const canvasHeight = this.drawer.canvas.nativeElement.height;
      let newScale = Math.min(
        canvasWidth * 0.9 / this.graph.width,
        canvasHeight * 0.9 / this.graph.height);
      if (newScale < 0.1) {
        newScale = 0.1
      }
      this.painting.scale = newScale;
      this.drawer.shiftX = canvasWidth / 2 - this.graph.width * this.painting.scale / 2;
      this.drawer.shiftY = canvasHeight / 2;
      this.lastGraphWidth = this.graph.width;
      this.lastGraphHeight = this.graph.height;
    }
  }

  setGraph(graph: Graph) {
    this.graph = graph;
    this.nodes = graph.nodes;
  }
}
