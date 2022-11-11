import { Injectable } from '@angular/core';
import { Config } from '../_model/config';
import { Edge } from '../_model/edge';
import { Node } from '../_model/node';
import { ConfigurationService } from './configuration.service';

export enum DatabaseObjectState {
  Default,
  Checked,
  Selected,
  Highlighted
}

@Injectable({
  providedIn: 'root'
})
export class PaintingService {
  config: Config;
  scale = 1;

  constructor(private configService: ConfigurationService) {
    this.config = configService.config;
  }

  clear(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
    ctx.fillStyle = "#EEEEEE";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  drawEdge(ctx: CanvasRenderingContext2D, edge: Edge) {
    if (edge.isFromHidden || edge.isToHidden) return;

    let arrowSize = 1;
    let arrowStyle = 'black';

    if (edge.isFromChecked && edge.isToChecked) {
      ctx.lineWidth = 2 * this.scale;
      ctx.strokeStyle = '#007bff';
      arrowSize = 1.5;
      arrowStyle = '#007bff';
    } else
    if (edge.isFromChecked || edge.isToChecked) {
      ctx.lineWidth = 1 * this.scale;
      ctx.strokeStyle = '#007bff';
      arrowStyle = '#007bff';
    } else {
      ctx.lineWidth = 1 * this.scale;
      ctx.strokeStyle = '#AAAAAA';
    }

    ctx.beginPath();
    ctx.moveTo(edge.fromX * this.scale, edge.fromY * this.scale);
    ctx.lineTo(edge.toX * this.scale, edge.toY * this.scale);
    ctx.stroke();
    this.drawArrowhead2(ctx, edge.fromX, edge.fromY, edge.toX, edge.toY, arrowSize, arrowStyle);
  }

  drawNode(ctx: CanvasRenderingContext2D, node: Node, isHighlighted: boolean) {
    if ((node.labels || []).length < 1 || node.isHidden) return;

    let mainColor = '#E7E5E4';
    let textColor = 'black';

    const nodeTypeConfig = this.configService.nodeTypeConfig[node.nodeType];
    if (nodeTypeConfig) {
      mainColor = nodeTypeConfig.mainColor;
      textColor = nodeTypeConfig.textColor;
    } else {
      throw new Error("No color config for node:\n" + node.nodeType);
    }

    const left = node.x - this.config.objectWidth / 2;
    const top = node.y - node.height / 2;
    
    this.drawNodeBackground(ctx, left, top, this.config.objectWidth, node.height, mainColor);
    this.drawNodeBorder(ctx, left, top, this.config.objectWidth, node.height, DatabaseObjectState.Default);

    if (isHighlighted)
      this.drawNodeBorder(ctx, left, top, this.config.objectWidth, node.height, DatabaseObjectState.Highlighted);
    if (node.isSelected)
      this.drawNodeBorder(ctx, left, top, this.config.objectWidth, node.height, DatabaseObjectState.Selected);
    if (node.isChecked)
      this.drawNodeBorder(ctx, left, top, this.config.objectWidth, node.height, DatabaseObjectState.Checked);

    if (this.scale < 0.3) return;

    for (let row = 0; row < node.labels.length; row++) {
      const baseLine = top + row * this.config.rowHeight + this.config.rowHeight * 0.75;
      this.drawText(ctx, left + this.config.fontSize / 2, baseLine, this.getShortenedText(node.labels[row]), textColor);
    }
  }

  drawInfo(ctx: CanvasRenderingContext2D, text: string) {
    let stringCount = (text.match(/\n/g) || []).length + 1;
    ctx.fillStyle = "rgba(0,0,0,.4)";
    ctx.fillRect(0, 0, 100, this.config.rowHeight * stringCount + 6);
    let lines = text.split("\n");
    let dy = 0;
    for (var line in lines) {
      this.drawTextUnscaled(ctx, 10, 16 + dy, lines[line]);
      dy += this.config.rowHeight;
    }
  }

  drawSmallText(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string = "white") {
    ctx.font = `400 ${this.config.fontSize * 0.5 * this.scale}px ${this.config.fontFamily}`;
    ctx.fillStyle = color;
    ctx.fillText(text, x * this.scale, y * this.scale);
  }

  drawTextUnscaled(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string = "white") {
    ctx.font = `600 ${this.config.fontSize}px ${this.config.fontFamily}`;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  drawText(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string = "white") {
    ctx.font = `400 ${this.config.fontSize * this.scale}px ${this.config.fontFamily}`;
    ctx.fillStyle = color;
    ctx.fillText(text, x * this.scale, y * this.scale);
  }

  getShortenedText(text: string): string {
    const symbolWidth = 0.63 * this.config.fontSize;
    const offset = (symbolWidth * text.length) - (this.config.objectWidth - this.config.fontSize);
    if (offset >= 0) {
      return text.substring(0, text.length / 2 - Math.floor(offset / 2 / symbolWidth) - 1) + '..' + text.substring(text.length / 2 + Math.floor(offset / 2 / symbolWidth) + 1, text.length);
    }
    return text;
  }

  private drawArrowhead2(ctx: CanvasRenderingContext2D, x: number, y: number, x1: number, y1: number, size: number, fill: string) {
    const arrowSize = 12 * size;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(x1 * this.scale, y1 * this.scale);
    const angle1 = Math.atan2(y1 - y, x1 - x) - Math.PI * 0.9;
    const x2 = x1 + arrowSize * Math.cos(angle1);
    const y2 = y1 + arrowSize * Math.sin(angle1);
    ctx.lineTo(x2 * this.scale, y2 * this.scale);
    const angle2 = Math.atan2(y1 - y, x1 - x) - Math.PI;
    const x3 = x1 + arrowSize * Math.cos(angle2) * 0.6;
    const y3 = y1 + arrowSize * Math.sin(angle2) * 0.6;
    ctx.lineTo(x3 * this.scale, y3 * this.scale);
    const angle3 = Math.atan2(y1 - y, x1 - x) + Math.PI * 0.9;
    const x4 = x1 + arrowSize * Math.cos(angle3);
    const y4 = y1 + arrowSize * Math.sin(angle3);
    ctx.lineTo(x4 * this.scale, y4 * this.scale);
    ctx.closePath();
    ctx.fill();
  }

  private drawNodeBackground(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
    style: string) {
    // Body
    ctx.fillStyle = style;
    ctx.fillRect(x * this.scale, y * this.scale, w * this.scale, h * this.scale);
    // Title
    ctx.fillStyle = "rgba(0,0,0,.05)";
    ctx.fillRect(x * this.scale, y * this.scale, w * this.scale, this.config.rowHeight * this.scale);
  }

  private drawNodeBorder(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
    state: DatabaseObjectState) {
    switch (state) {
      case DatabaseObjectState.Highlighted:
        ctx.lineWidth = 6 * this.scale;
        ctx.strokeStyle = "#FDBA74";
        break;
      case DatabaseObjectState.Selected:
        ctx.lineWidth = 4 * this.scale;
        ctx.strokeStyle = "#007bff";
        break;
      case DatabaseObjectState.Checked:
        ctx.lineWidth = 2 * this.scale;
        ctx.strokeStyle = "#007bff";
        break;
      default:
        ctx.lineWidth = 1 * this.scale;
        ctx.strokeStyle = "#777";
        break;
    }
    ctx.strokeRect(x * this.scale, y * this.scale, w * this.scale, h * this.scale);
  }
}
