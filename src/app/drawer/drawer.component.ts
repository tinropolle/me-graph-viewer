import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Graph } from '../_model/graph';
import { PaintingService } from '../_services/painting.service';
import { ConfigurationService } from '../_services/configuration.service';
import { Config } from '../_model/config';
import { Node } from "../_model/node";
import { ProcessingService } from '../_services/processing.service';
import { Edge } from '../_model/edge';

@Component({
  selector: 'app-drawer',
  templateUrl: './drawer.component.html',
  styleUrls: ['./drawer.component.css']
})
export class DrawerComponent implements OnInit, AfterViewInit {
  @Input() graph: Graph;
  @Output() checkNode: EventEmitter<string> = new EventEmitter();
  @Output() selectNode: EventEmitter<string> = new EventEmitter();
  @ViewChild('cnv') canvas: ElementRef;

  dpr = window.devicePixelRatio || 1;
  
  config: Config;
  context: CanvasRenderingContext2D;
  dragging: boolean;
  dragStartTime: number;
  dragStartX: number;
  dragStartY: number;
  mouseX: number;
  mouseY: number;
  shiftOriginX: number = 0;
  shiftOriginY: number = 0;
  shiftX: number = 0;
  shiftY: number = 0;

  hoveredNodeId: string;

  dependentEdges: Edge[];
  dependentNodes: Node[];
  draggingNode: Node;
  draggingNodeOriginX: number;
  draggingNodeOriginY: number;

  constructor(
    private painting: PaintingService,
    private configService: ConfigurationService,
    private processing: ProcessingService) {
    this.config = configService.config;
  }

  ngAfterViewInit(): void {
    this.context = this.canvas.nativeElement.getContext('2d');
    this.redraw();
  }

  ngOnInit(): void {
  }

  getdraggingNode(x: number, y: number) {
    const draggingNode = this.graph.nodes.find(n =>
      n.x - this.config.objectWidth / 2 < x && n.y - n.height / 2 < y &&
      n.x + this.config.objectWidth / 2 > x && n.y + n.height / 2 > y);
    if (draggingNode) {
      this.draggingNode = draggingNode;
      this.draggingNodeOriginX = draggingNode.x;
      this.draggingNodeOriginY = draggingNode.y;
      this.dependentEdges = this.graph.edges.filter(e => e.from == draggingNode.id || e.to == draggingNode.id);
      this.dependentNodes = this.graph.nodes.filter(n => this.dependentEdges.find(e => e.from == n.id || e.to == n.id));
    }
  }

  onMouseDown(e: TouchEvent | MouseEvent) {
    let mouseX = (e as TouchEvent).changedTouches ?
                 (e as TouchEvent).changedTouches[0].pageX :
                 (e as MouseEvent).pageX;
    let mouseY = (e as TouchEvent).changedTouches ?
                 (e as TouchEvent).changedTouches[0].pageY :
                 (e as MouseEvent).pageY;
    mouseX -= this.canvas.nativeElement.offsetLeft;
    mouseY -= this.canvas.nativeElement.offsetTop;

    this.dragStartTime = Date.now();
    this.dragStartX = mouseX;
    this.dragStartY = mouseY;
    this.shiftOriginX = this.shiftX;
    this.shiftOriginY = this.shiftY;

    this.dragging = true;

    this.getdraggingNode(
      (this.mouseX * this.dpr - this.shiftX) / this.painting.scale,
      (this.mouseY * this.dpr - this.shiftY) / this.painting.scale);
    
    this.redraw();
  }

  onMouseMove(e: TouchEvent | MouseEvent) {
    let mouseX = (e as TouchEvent).changedTouches ?
                 (e as TouchEvent).changedTouches[0].pageX :
                 (e as MouseEvent).pageX;
    let mouseY = (e as TouchEvent).changedTouches ?
                 (e as TouchEvent).changedTouches[0].pageY :
                 (e as MouseEvent).pageY;
    mouseX -= this.canvas.nativeElement.offsetLeft;
    mouseY -= this.canvas.nativeElement.offsetTop;
    
    if (this.dragging)
    {
      if (this.draggingNode) {
        this.draggingNode.x = this.draggingNodeOriginX + (mouseX - this.dragStartX) * this.dpr / this.painting.scale;
        this.draggingNode.y = this.draggingNodeOriginY + (mouseY - this.dragStartY) * this.dpr / this.painting.scale;
        this.updateEdgesConfigAsync();
      } else {
        this.shiftX = this.shiftOriginX + (mouseX - this.dragStartX) * this.dpr;
        this.shiftY = this.shiftOriginY + (mouseY - this.dragStartY) * this.dpr;
      }
    }

    this.mouseX = mouseX;
    this.mouseY = mouseY;

    this.redraw();

    e.preventDefault();
  }

  async updateEdgesConfigAsync() {
    this.processing.configureEdges(this.dependentNodes, this.dependentEdges);
  }

  onMouseOut() {
    this.dragging = false;
    this.draggingNode = null;
    this.redraw();
  }

  onMouseUp(e: MouseEvent) {
    if (Math.abs(this.mouseX - this.dragStartX) <= 4 &&
        Math.abs(this.mouseY - this.dragStartY) <= 4 &&
        Date.now() - this.dragStartTime <= 300)
    {
      this.onSelect(
        (this.mouseX * this.dpr - this.shiftX) / this.painting.scale,
        (this.mouseY * this.dpr - this.shiftY) / this.painting.scale,
        e.ctrlKey || e.shiftKey);
    }
    this.dragging = false;
    this.draggingNode = null;
    this.redraw();
  }

  onSelect(x: number, y: number, isMultiple: boolean) {
    const newNode = this.graph.nodes.find(n =>
      n.x - this.config.objectWidth / 2 < x && n.y - n.height / 2 < y &&
      n.x + this.config.objectWidth / 2 > x && n.y + n.height / 2 > y);
    if (newNode) {
      if (isMultiple) {
        this.checkNode.emit(newNode.id);
      } else {
        this.selectNode.emit(newNode.id);
      }
    } else {
      this.selectNode.emit("");
    }
  }

  onWheel(e: WheelEvent) {
    e.preventDefault();
    let diff = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    this.painting.scale *= diff;
    if (this.painting.scale < 0.1)
    {
        this.painting.scale = 0.1;
        diff = 0.1;
        return;
    }
    if (this.painting.scale > 10) {
      this.painting.scale = 10;
      return;
    }

    let mouseX = e.pageX - this.canvas.nativeElement.offsetLeft;
    let mouseY = e.pageY - this.canvas.nativeElement.offsetTop;
    this.shiftX = mouseX * this.dpr - (mouseX * this.dpr - this.shiftX) * diff;
    this.shiftY = mouseY * this.dpr - (mouseY * this.dpr - this.shiftY) * diff;
    this.redraw();
  }

  redraw() {
    let g = this.graph;
    let ctx = this.context;
    let scale = this.painting.scale;

    this.painting.clear(this.context, this.canvas.nativeElement.width, this.canvas.nativeElement.height);

    ctx.translate(this.shiftX, this.shiftY);

    if (g) {
      for (const edge of g.edges) {
        this.painting.drawEdge(this.context, edge);
      }
      for (const node of g.nodes) {
        this.painting.drawNode(this.context, node, node.id === this.hoveredNodeId);
      }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    this.painting.drawInfo(
      this.context,
      Math.round(scale * 100) + ' %\n' +
      ((this.mouseX * this.dpr - this.shiftX) / scale).toFixed(0).toString() + ' ' +
      ((this.mouseY * this.dpr - this.shiftY) / scale).toFixed(0).toString());
  }

  setHoveredNodeId(id: string) {
    this.hoveredNodeId = id;
    this.redraw();
  }
}
